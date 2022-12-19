import { Injectable, HttpException, Logger } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { SavingsGoalInputDto } from 'src/modules/savings-goal/dtos/savings-goal.dto';
import { WalletTypeEntity } from 'src/modules/wallet/entities/wallet.entity';
import { AppRequestContext } from 'src/utils/app-request.context';
import { getAppContextALS } from 'src/utils/context';
import { generateCode } from 'src/utils/shared';
import { EntityManager, Repository } from 'typeorm';
import { AccountEntity } from '../entities/account.entity';
import { UserPinService } from '../../userpin/services/userpin.service';
import { PhoneIdentityEntity } from '../../auth/entities/phone-identity.entity';
import {
  TransferToAccountDto,
  AdminTransferToAccountDto,
} from '../dtos/transfer-account.dto';
import { AccountTransactionEntity } from 'src/modules/transactions/entities/account-transaction.entity';
import { TRANSACTION_TYPE } from 'src/modules/enums/transaction-type.enum';
import { TransferStatus } from '../../transactions/entities/account-transaction.entity';
import { TRANSACTION_STATUS } from 'src/modules/enums/transaction.status';
import { TransactionEntity } from '../../transactions/entities/transaction.entity';
import { uuid } from 'uuidv4';
import { AuthUserEntity } from '../../auth/entities/auth-user.entity';
import { UserDto } from '../../auth/dto/user.dto';
import { AdminTransferResponseDto } from '../dtos/transfer-account.dto';

export type TransactionHistory = {
  amount: number;
  accountId?: string;
  narration?: string;
  transactionType: TRANSACTION_TYPE;
  userId?: string;
  initialBalance: number;
  currentBalance: number;
  debitCreditType?: TRANSACTION_TYPE;
  transactionStatus: TRANSACTION_STATUS;
  transferStatus: TransferStatus;
  reference: string;
};

@Injectable()
export class AccountService {
  private logger = new Logger('AccountService');
  constructor(
    @InjectEntityManager('default') private em: EntityManager,
    private userPinService: UserPinService,

    @InjectRepository(AccountEntity)
    private accountRepository: Repository<AccountEntity>,
  ) { }

  async mapAccountFromSavingsGoal(
    input: SavingsGoalInputDto,
  ): Promise<AccountEntity> {
    const ctx = getAppContextALS<AppRequestContext>();
    const account = new AccountEntity();
    account.name = input.name;
    account.accountTypeId = input.accountTypeId;
    account.userId = ctx.authUser.userId;
    account.accountNumber = Number(generateCode(10));
    account.walletId = input.walletId ?? (await this.getDefaultWalletId());
    return account;
  }

  async getDefaultWalletId(): Promise<string> {
    return this.em
      .findOne(WalletTypeEntity, { where: { name: 'Local' } })
      .then((wallet) => wallet.id);
  }

  // async transferToUserAccount(input: TransferToAccountDto): Promise<void> {
  //   if (!input.verificationId)
  //     throw new HttpException('Verification Id is required', 400);
  //   await this.userPinService.verifyId(input.verificationId);
  //   const ctx = getAppContextALS<AppRequestContext>();
  //   const initiatorAccount = await this.getUserPrimaryAccount({
  //     userId: ctx.authUser.userId,
  //   });

  //   const amount = Number(input.amount);

  //   const initiatorUserBalance = Number(initiatorAccount.balance);
  //   if (initiatorUserBalance < amount)
  //     throw new HttpException(`Insufficient funds`, 400);

  //   const initiatorUserCurrentBalance = initiatorUserBalance - amount;

  //   initiatorAccount.balance = initiatorUserCurrentBalance;

  //   // transfer to user Account
  //   const receiverAccount: AccountEntity = await this.getUserPrimaryAccount({
  //     accountId: input.transferAccountId,
  //   });

  //   const receiverAccountBalance = Number(receiverAccount.balance) + amount;
  //   receiverAccount.balance = receiverAccountBalance;

  //   // console.log('user account', account);
  //   // console.log('transfer account', transferAccount);

  //   await this.em.save(initiatorAccount);
  //   await this.em.save(receiverAccount);
  //   //Promise.all([this.em.save(account), this.em.save(transferAccount)]);
  // }

  async getUserAccount(accountId: string): Promise<AccountEntity> {
    const account = await this.em.findOne(AccountEntity, {
      where: { id: accountId },
    });
    if (!account) {
      throw new HttpException(`Account with id ${accountId} not found`, 400);
    }
    return account;
  }

  async getUserPrimaryAccount(user: {
    userId?: string;
    accountId?: string;
  }): Promise<AccountEntity> {
    this.logger.debug('user', user);
    const { userId, accountId } = user;

    const account = await this.em.findOne(AccountEntity, {
      where: {
        ...(user && { userId }),
        ...(accountId && { id: accountId }),
        name: 'Primary',
      },
    });
    if (!account) {
      const errorMessage = user.userId
        ? `id ${userId}`
        : `account id ${accountId}`;
      throw new HttpException(
        `User with  ${errorMessage} has no Primary Account`,
        400,
      );
    }

    return account;
  }

  async userHasEnoughBalance(userId: string, amount: number) {
    const account = await this.getUserPrimaryAccount({ userId });
    if (account) {
      if (Number(account.balance) >= Number(amount)) return true;
      return false;
    }
    return false;
  }

  // async getUserPrimaryAccount(userId: string) {
  //   const account = await this.accountRepository.findOne({
  //     where: { userId, name: 'Primary' },
  //   });
  //   return account;
  // }

  async getUserBalance(userId: string) {
    const account = await this.getUserPrimaryAccount({ userId });
    if (account) return Number(account.balance);
    return 0;
  }

  // async createTransactionHistoryFromTransfer(
  //   input: TransactionHistory,
  // ): Promise<void> {
  //   const transaction = new TransactionEntity();
  //   transaction.amount = Number(input.amount);
  //   transaction.transactionType = input.transactionType;
  //   transaction.transactionId = input.reference;
  //   transaction.accountId = input.accountId;
  //   // userId here is the user who is transferring
  //   transaction.userId = input.userId;
  //   transaction.transactionStatus = input.transactionStatus;
  //   transaction.naration = input.narration;

  //   const savedTransaction = await this.em.save(transaction);

  //   const accountTransaction = new AccountTransactionEntity();

  //   // accountId here is the account that is being credited
  //   accountTransaction.accountId = input.accountId;
  //   accountTransaction.amount = Number(input.amount);
  //   accountTransaction.initialBalance = Number(input.initialBalance);
  //   accountTransaction.transactionType = input.debitCreditType;
  //   accountTransaction.currentBalance = Number(input.currentBalance);
  //   accountTransaction.transactionStatus = input.transactionStatus;
  //   accountTransaction.transactionId = savedTransaction.id;
  //   accountTransaction.referenceId = input.reference;
  //   accountTransaction.transferStatus = input.transferStatus;
  //   await this.em.save(accountTransaction);
  // }

  // async adminTransferToUserAccount(
  //   input: AdminTransferToAccountDto,
  // ): Promise<AdminTransferResponseDto> {
  //   try {
  //     const ctx = getAppContextALS<AppRequestContext>();
  //     const userPhone = await this.em.findOne(PhoneIdentityEntity, {
  //       where: { phone: input.phone },
  //     });

  //     if (!userPhone)
  //       throw new HttpException(
  //         `User with phone ${input.phone} not found`,
  //         404,
  //       );

  //     const authUser = await this.em.findOne(AuthUserEntity, {
  //       where: { id: userPhone.userId },
  //       relations: ['user'],
  //     });

  //     const creditAccount = await this.em.findOne(AccountEntity, {
  //       where: { userId: authUser.userId, name: 'Primary' },
  //     });

  //     if (!creditAccount) {
  //       throw new HttpException(
  //         `User with phone ${input.phone} has no Primary Account`,
  //         404,
  //       );
  //     }

  //     const reference = uuid();

  //     const debitAccount = await this.em.findOne(AccountEntity, {
  //       where: { userId: ctx.authUser.userId, name: 'Ledger' },
  //     });

  //     await this.transactionHistory(
  //       creditAccount,
  //       debitAccount,
  //       input.amount,
  //       input.narration,
  //       reference,
  //     );

  //     // update  ledger account details
  //     const ledger = await this.em.findOne(AccountEntity, {
  //       where: { name: 'Ledger' },
  //     });
  //     ledger.balance = Number(ledger.balance) - Number(input.amount);
  //     await this.em.save(ledger);

  //     // credit user account

  //     creditAccount.balance =
  //       Number(creditAccount.balance) + Number(input.amount);
  //     await this.em.save(creditAccount);
  //     return {
  //       user: authUser.user as unknown as UserDto,
  //       reference: reference,
  //     };
  //   } catch (error) {
  //     return error.message;
  //   }
  // }

  // async transactionHistory(
  //   creditAccount: AccountEntity,
  //   debitAccount: AccountEntity,
  //   amount: number,
  //   narration: string,
  //   reference?: string,
  // ): Promise<void> {
  //   const transactionReference = reference ?? uuid();
  //   const historyData: TransactionHistory = {
  //     amount: Number(amount),
  //     narration: narration,
  //     transactionType: TRANSACTION_TYPE.ADMIN_TRANSFER,
  //     initialBalance: 0,
  //     currentBalance: 0,
  //     transactionStatus: TRANSACTION_STATUS.success,
  //     transferStatus: TransferStatus.SUCCESS,
  //     reference: transactionReference,
  //   };

  //   {
  //     // create credit history
  //     historyData.accountId = creditAccount.id;
  //     historyData.userId = creditAccount.userId;
  //     historyData.initialBalance = Number(creditAccount.balance);
  //     historyData.currentBalance =
  //       Number(creditAccount.balance) + Number(amount);
  //     historyData.debitCreditType = TRANSACTION_TYPE.CREDIT;
  //     await this.createTransactionHistoryFromTransfer(historyData);
  //   }

  //   {
  //     // create debit history
  //     historyData.accountId = debitAccount.id;
  //     historyData.userId = debitAccount.userId;
  //     historyData.initialBalance = Number(debitAccount.balance);
  //     historyData.currentBalance =
  //       Number(debitAccount.balance) - Number(amount);
  //     historyData.debitCreditType = TRANSACTION_TYPE.DEBIT;
  //     await this.createTransactionHistoryFromTransfer(historyData);
  //   }
  // }
}
