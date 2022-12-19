import { Injectable, HttpException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TransactionEntity } from '../entities/transaction.entity';
import { Repository, EntityManager } from 'typeorm';
import { DepositInputDto } from '../dtos/deposit.dto';
import { getAppContextALS } from '../../../utils/context';
import { AppRequestContext } from 'src/utils/app-request.context';
import { uuid } from 'uuidv4';
import { TRANSACTION_STATUS } from 'src/modules/enums/transaction.status';
import { TRANSACTION_TYPE } from 'src/modules/enums/transaction-type.enum';
import { PaymentMethodEntity } from 'src/modules/main/entities/paymentmethod.entity';
import { NETWORK } from 'src/modules/main/entities/enums/network.enum';
import { PhoneIdentityEntity } from '../../auth/entities/phone-identity.entity';
import { HttpRequestService } from '../../shared/services/http.request.service';
import {
  AccountTransactionEntity,
  TransferStatus,
} from '../entities/account-transaction.entity';
import { AccountEntity } from '../../account/entities/account.entity';
import { UserPinService } from 'src/modules/userpin/services/userpin.service';
import { TransactionHistory } from '../types/transaction-history.type';
import { AccountService } from '../../account/services/account.service';
import { NotificationService } from 'src/modules/notifications/services/notification.service';

@Injectable()
export class TransactionService extends HttpRequestService {
  constructor(
    @InjectRepository(TransactionEntity)
    private transactionRepository: Repository<TransactionEntity>,

    @InjectRepository(PaymentMethodEntity)
    private paymentRepository: Repository<PaymentMethodEntity>,

    @InjectRepository(AccountEntity)
    private accountRepository: Repository<AccountEntity>,

    @InjectRepository(AccountTransactionEntity)
    private accountTransactionRepository: Repository<AccountTransactionEntity>,

    private userPinService: UserPinService,

    private accountService: AccountService,

    private em: EntityManager,

    private notificationService: NotificationService
  ) {
    super();
  }

  async getTransactionStatus(ref: string) {
    const status = await this.em.findOne(TransactionEntity, {
      where: { transactionId: ref },
    });
    if (status) return status;
    throw new HttpException('Transaction not found', 404);
  }

  async userHasEnoughBalance(userId: string, amount: number) {
    const account = await this.getUserDefaultAccount(userId);
    if (account) {
      if (Number(account.balance) >= Number(amount)) return true;
      return false;
    }
    return false;
  }

  async depositWithdrawal(
    input: DepositInputDto,
    type?: TRANSACTION_TYPE,
  ): Promise<any> {
    if (!input.verificationId)
      throw new HttpException('Verification Id is required', 400);
    await this.userPinService.verifyId(input.verificationId);
    const ctx = getAppContextALS<AppRequestContext>();
    const reference = uuid();
    const transaction = new TransactionEntity();
    transaction.amount = input.amount;
    transaction.userId = ctx.authUser.userId;
    transaction.transactionType = type;
    transaction.transactionId = reference;
    transaction.transactionStatus = TRANSACTION_STATUS.pending;

    //if (input.accountId) transaction.accountId = input.accountId;

    // initiate deposit api
    const paymentMethod = await this.getUserPaymentPhone();
    if (paymentMethod.phone) {
      const phoneData = paymentMethod.phone as PhoneIdentityEntity;
      const network = paymentMethod.network.toUpperCase();
      const paymentMode = network === 'airteltigo' ? 'ARITEL_TIGO' : network;
      const depositWithdrawalResponse = await this.initiateDepositWithdrawal(
        phoneData.phone,
        input.amount,
        reference,
        type,
        paymentMode,
      );

      console.log("depositWithdrawalResponse", depositWithdrawalResponse)
      if (depositWithdrawalResponse.status === 'PENDING') {
        // if user is withdrawing money from their account deduct when transaction executes
        // reverse amount if transaction fails
        if (type === TRANSACTION_TYPE.DEBIT) {
          await this.debitUserPrimaryAccount(input.amount);
        }

        transaction.senderPhone = phoneData.phone;
        await this.transactionRepository.save(transaction);

        if (ctx.authUser.emailIdentity.email) {
          const otpEmailResponse = await this.notificationService.sendEmail({
            subject: `Bezo Susu: Transaction notification - ${new Date().toISOString().split("T")[0]} `,
            message: 'Withdrawal has been initiated you will receive a notification soon',
            to: ctx.authUser.emailIdentity.email,
            template: {
              provider: "sendgrid",
              name: "otp",
              data: {}
            },
            from: 'Papscashback<no-reply@papscashback.com>', //  Support Team<support@bezomoney.com> override default from

          })
          console.log('otpEmailResponse', otpEmailResponse);

        }

        if (ctx.authUser.phoneIdentity.phone) {
          const otpSmsResponse = await this.notificationService.sendSms({
            to: phoneData.phone, sms: 'Withdrawal has been initiated you will receive a notification soon'
          })
          console.log('otpSmsResponse', otpSmsResponse);
          // return otpSmsResponse;
        }


        return depositWithdrawalResponse;
      }
      throw new HttpException(depositWithdrawalResponse, 400);
    }

    throw new HttpException('Payment method not found', 404);
  }

  async debitUserPrimaryAccount(amount: number) {
    const ctx = getAppContextALS<AppRequestContext>();
    const hasEnoughBalance = await this.accountService.userHasEnoughBalance(
      ctx.authUser.userId,
      amount,
    );
    if (!hasEnoughBalance) throw new HttpException('Insufficient balance', 400);

    const account = await this.accountService.getUserPrimaryAccount({
      userId: ctx.authUser.userId,
    });
    if (account) {
      account.balance = Number(account.balance) - Number(amount);
      return await this.accountRepository.save(account);
    }
    throw new HttpException('Primary Account not found', 404);
  }

  async creditUserPrimaryAccount(amount: number, userId: string) {
    const account = await this.getUserDefaultAccount(userId);
    if (account) {
      account.balance = Number(account.balance) + Number(amount);
      return await this.accountRepository.save(account);
    }
    throw new HttpException('Primary Account not found', 404);
  }

  async getUserPaymentPhone(network?: NETWORK) {
    const ctx = getAppContextALS<AppRequestContext>();
    // console.log('ctx', JSON.stringify(ctx.authUser, null, 2));
    const paymentMethod = await this.paymentRepository.findOne({
      where: { userId: ctx.authUser.userId, ...(network && { network }) },
      relations: ['phone'],
    });
    if (!paymentMethod)
      throw new HttpException('Payment method not found', 404);
    return paymentMethod;
  }

  async initiateDepositWithdrawal(
    phone: string,
    amount: number,
    reference: string,
    type: TRANSACTION_TYPE,
    paymentMode: string,
  ) {
    const url = `${this.cfg.payment.url}/${type === TRANSACTION_TYPE.CREDIT ? 'debit' : 'credit'
      }`;
    console.log('environment', process.env.NODE_ENV);
    const data = {
      phoneNumber: process.env.NODE_ENV === 'test' ? '233542853417' : phone,
      amount: amount,
      callbackUrl: this.cfg.payment.callbackUrl,
      reference,
      narration: reference,
      paymentMode,
    };

    this.logger.debug(`Initiating ${type} request to ${url}`);
    this.logger.debug(`Request data: ${JSON.stringify(data, null, 2)}`);

    await this.post(url, data);
    this.logger.debug(`Error Response ${JSON.stringify(this.error, null, 2)}`);
    if (this.error) {
      throw new HttpException(this.error, 400);
    }
    this.logger.debug(`Response ${JSON.stringify(this.response, null, 2)}`);
    this.response.reference = reference;
    return this.response;
  }

  async transactionCallback(request: any) {
    const transaction = await this.getTransactionByRef(request.transactionRef);
    if (
      transaction &&
      transaction.transactionStatus === TRANSACTION_STATUS.pending
    ) {
      await this.updateTransaction(request, transaction);
    }
    return 'success';
  }

  async getTransactionByRef(ref: string) {
    return await this.transactionRepository.findOne({
      where: { transactionId: ref },
    });
  }

  async updateTransaction(data, transaction: TransactionEntity) {
    if (transaction && data.status === 'SUCCESS') {
      transaction.transactionStatus = TRANSACTION_STATUS.success;
      transaction.transactionData = data;
      await this.transactionRepository.save(transaction);
      await this.saveAccountTransactions(transaction);
    } else {
      transaction = await this.reverseTransaction(transaction);
    }
    await this.transactionRepository.save(transaction);
  }

  async reverseTransaction(transaction: TransactionEntity) {
    if (transaction.transactionType === TRANSACTION_TYPE.DEBIT) {
      // reverse user account balance if transaction is debit
      await this.creditUserPrimaryAccount(
        transaction.amount,
        transaction.userId,
      );
    }
    if (
      transaction.accountId &&
      transaction.transactionType === TRANSACTION_TYPE.CREDIT
    ) {
      // reverse user account balance if transaction is transfer
      await this.creditUserPrimaryAccount(
        transaction.amount,
        transaction.userId,
      );
    }
    transaction.transactionStatus = TRANSACTION_STATUS.failed;
    return transaction;
  }

  async saveAccountTransactions(transaction: TransactionEntity) {
    const accountTransaction = new AccountTransactionEntity();
    accountTransaction.amount = transaction.amount;
    accountTransaction.referenceId = transaction.transactionId;
    accountTransaction.phone = transaction.senderPhone;
    const userAccount = await this.getUserDefaultAccount(transaction.userId);
    accountTransaction.initialBalance = this.computeInitialBalance(
      Number(userAccount.balance),
      transaction.amount,
      transaction.transactionType,
    );
    accountTransaction.transactionType = transaction.transactionType;
    accountTransaction.accountId = transaction.accountId ?? userAccount.id;
    // handle transfer status later
    accountTransaction.transactionStatus = transaction.transactionStatus;
    accountTransaction.transactionId = transaction.id;
    accountTransaction.transferStatus =
      transaction.accountId &&
        transaction.transactionType === TRANSACTION_TYPE.CREDIT
        ? TransferStatus.PENDING
        : TransferStatus.NOT_AVAILABLE;
    accountTransaction.currentBalance = Number(
      this.computeBalance(
        userAccount.balance,
        accountTransaction.amount,
        accountTransaction.transactionType,
      ),
    );

    const saved = await this.accountTransactionRepository.save(
      accountTransaction,
    );
    // update account balance
    if (saved && saved.transactionType === TRANSACTION_TYPE.CREDIT) {
      if (!transaction.accountId) {
        userAccount.balance = saved.currentBalance;
      }
      await this.accountRepository.save(userAccount);
    }
  }

  async getUserDefaultAccount(userId: string) {
    const account = await this.accountRepository.findOne({
      where: { userId, name: 'Primary' },
    });
    return account;
  }

  async getAccountById(accountId: string) {
    const account = await this.accountRepository.findOne({
      where: { id: accountId },
    });
    return account;
  }

  computeBalance(
    accountBalance: number,
    amount: number,
    type: TRANSACTION_TYPE,
    transfer = false,
  ) {
    if (type === TRANSACTION_TYPE.CREDIT && !transfer) {
      return Number(accountBalance) + Number(amount);
    }
    return Number(accountBalance);
  }

  computeInitialBalance(
    accountBalance: number,
    amount: number,
    type: TRANSACTION_TYPE,
  ) {
    if (type === TRANSACTION_TYPE.DEBIT) {
      return Number(accountBalance) + Number(amount);
    }
    return accountBalance;
  }

  async createTransactionHistoryFromTransfer(
    input: TransactionHistory,
  ): Promise<void> {
    const transactionExists = await this.transactionRepository.findOne({
      where: { transactionId: input.reference },
    });

    //console.log('transactionExists', transactionExists);

    const transaction = new TransactionEntity();
    transaction.amount = Number(input.amount);
    transaction.transactionType = input.transactionType;
    transaction.transactionId = input.reference;
    transaction.accountId = input.accountId;
    // userId here is the user who is transferring
    transaction.userId = input.userId;
    transaction.transactionStatus = input.transactionStatus;
    transaction.naration = input.narration;

    const savedTransaction =
      transactionExists ?? (await this.em.save(transaction));

    //console.log('savedTransaction', savedTransaction);

    const accountTransaction = new AccountTransactionEntity();

    // accountId here is the account that is being credited
    accountTransaction.accountId = input.accountId;
    accountTransaction.amount = Number(input.amount);
    accountTransaction.initialBalance = Number(input.initialBalance);
    accountTransaction.transactionType = input.debitCreditType;
    accountTransaction.currentBalance = Number(input.currentBalance);
    accountTransaction.transactionStatus = input.transactionStatus;
    accountTransaction.transactionId = savedTransaction.id;
    accountTransaction.referenceId = input.reference;
    accountTransaction.transferStatus = input.transferStatus;

    // console.log('accountTransaction', accountTransaction);
    await this.accountTransactionRepository.insert(accountTransaction);
  }

  async transactionHistory(
    creditAccount: AccountEntity,
    debitAccount: AccountEntity,
    amount: number,
    narration: string,
    transactionType: TRANSACTION_TYPE,
    reference?: string,
  ): Promise<void> {
    const transactionReference = reference ?? uuid();
    const historyData: TransactionHistory = {
      amount: Number(amount),
      narration: narration,
      transactionType: transactionType,
      initialBalance: 0,
      currentBalance: 0,
      transactionStatus: TRANSACTION_STATUS.success,
      transferStatus: TransferStatus.SUCCESS,
      reference: transactionReference,
    };

    {
      // create credit history
      const creditHistory: TransactionHistory = historyData;
      creditHistory.accountId = creditAccount.id;
      creditHistory.userId = creditAccount.userId;
      creditHistory.initialBalance = Number(creditAccount.balance);
      creditHistory.currentBalance =
        Number(creditAccount.balance) + Number(amount);
      creditHistory.debitCreditType = TRANSACTION_TYPE.CREDIT;
      console.log('creditHistory', creditHistory);
      await this.createTransactionHistoryFromTransfer(creditHistory);
    }

    {
      // create debit history
      const debitHistory: TransactionHistory = historyData;
      debitHistory.accountId = debitAccount.id;
      debitHistory.userId = debitAccount.userId;
      debitHistory.initialBalance = Number(debitAccount.balance);
      debitHistory.currentBalance =
        Number(debitAccount.balance) - Number(amount);
      debitHistory.debitCreditType = TRANSACTION_TYPE.DEBIT;
      console.log('debitHistory', debitHistory);
      await this.createTransactionHistoryFromTransfer(debitHistory);
    }
  }
}
