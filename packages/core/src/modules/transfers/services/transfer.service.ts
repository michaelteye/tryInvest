import { HttpException, Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import {
  AdminTransferToAccountDto,
  AdminTransferResponseDto,
  TransferToAccountDto,
} from 'src/modules/account/dtos/transfer-account.dto';
import { AccountEntity } from 'src/modules/account/entities/account.entity';
import { AccountService } from 'src/modules/account/services/account.service';
import { UserDto } from 'src/modules/auth/dto/user.dto';
import { AuthUserEntity } from 'src/modules/auth/entities/auth-user.entity';
import { PhoneIdentityEntity } from 'src/modules/auth/entities/phone-identity.entity';
import { TRANSACTION_TYPE } from 'src/modules/enums/transaction-type.enum';
import { UserPinService } from 'src/modules/userpin/services/userpin.service';
import { AppRequestContext } from 'src/utils/app-request.context';
import { getAppContextALS } from 'src/utils/context';
import { EntityManager } from 'typeorm';
import { uuid } from 'uuidv4';
import { TransactionService } from '../../transactions/services/transaction.service';

@Injectable()
export class TransferService {
  constructor(
    @InjectEntityManager('default') private em: EntityManager,
    private transactionService: TransactionService,
    private userPinService: UserPinService,
    private accountService: AccountService,
  ) {}
  async adminTransferToUserAccount(
    input: AdminTransferToAccountDto,
  ): Promise<AdminTransferResponseDto> {
    try {
      const ctx = getAppContextALS<AppRequestContext>();
      const userPhone = await this.em.findOne(PhoneIdentityEntity, {
        where: { phone: input.phone },
      });

      if (!userPhone)
        throw new HttpException(
          `User with phone ${input.phone} not found`,
          404,
        );

      const authUser = await this.em.findOne(AuthUserEntity, {
        where: { id: userPhone.userId },
        relations: ['user'],
      });

      // const creditAccount = await this.em.findOne(AccountEntity, {
      //   where: { userId: authUser.userId, name: 'Primary' },
      // });
      const creditAccount = await this.accountService.getUserPrimaryAccount({
        userId: authUser.userId,
      });

      if (!creditAccount) {
        throw new HttpException(
          `User with phone ${input.phone} has no Primary Account`,
          404,
        );
      }

      const reference = uuid();

      const debitAccount = await this.em.findOne(AccountEntity, {
        where: { userId: ctx.authUser.userId, name: 'Ledger' },
      });

      await this.transactionService.transactionHistory(
        creditAccount,
        debitAccount,
        input.amount,
        input.narration,
        TRANSACTION_TYPE.ADMIN_TRANSFER,
        reference,
      );

      // update  ledger account details
      // const ledger = await this.em.findOne(AccountEntity, {
      //   where: { name: 'Ledger' },
      // });
      debitAccount.balance =
        Number(debitAccount.balance) - Number(input.amount);
      await this.em.save(debitAccount);

      // credit user account

      creditAccount.balance =
        Number(creditAccount.balance) + Number(input.amount);
      await this.em.save(creditAccount);
      return {
        user: authUser.user as unknown as UserDto,
        reference: reference,
      };
    } catch (error) {
      return error.message;
    }
  }

  async transferToUserAccount(input: TransferToAccountDto): Promise<void> {
    if (!input.verificationId)
      throw new HttpException('Verification Id is required', 400);
    await this.userPinService.verifyId(input.verificationId);
    const ctx = getAppContextALS<AppRequestContext>();
    const debitAccount = await this.accountService.getUserPrimaryAccount({
      userId: ctx.authUser.userId,
    });

    const amount = Number(input.amount);

    const initiatorUserBalance = Number(debitAccount.balance);
    if (initiatorUserBalance < amount)
      throw new HttpException(`Insufficient funds`, 400);

    const initiatorUserCurrentBalance = initiatorUserBalance - amount;

    debitAccount.balance = initiatorUserCurrentBalance;

    // transfer to user Account
    const creditAccount: AccountEntity =
      await this.accountService.getUserAccount(input.transferAccountId);
    const reference = uuid();

    await this.transactionService.transactionHistory(
      creditAccount,
      debitAccount,
      input.amount,
      `Transfer to user account with id ${creditAccount.id}`,
      TRANSACTION_TYPE.USER_TRANSFER,
      reference,
    );

    const receiverAccountBalance = Number(creditAccount.balance) + amount;
    creditAccount.balance = receiverAccountBalance;

    // console.log('user account', account);
    // console.log('transfer account', transferAccount);

    await this.em.save(debitAccount);
    await this.em.save(creditAccount);
    //Promise.all([this.em.save(account), this.em.save(transferAccount)]);
  }
}
