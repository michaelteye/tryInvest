import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { AccountTypeEntity } from 'src/modules/account/entities/account-type.entity';
import { AccountEntity } from 'src/modules/account/entities/account.entity';
import { GOAL_STATUS } from 'src/modules/auth/entities/enums/goal-status.enum';
import { STATUS } from 'src/modules/auth/entities/enums/status.enum';
import { TRANSACTION_TYPE } from 'src/modules/enums/transaction-type.enum';
import { TRANSACTION_STATUS } from 'src/modules/enums/transaction.status';
import { FREQUENCY_TYPE } from 'src/modules/main/entities/enums/savingsfrequency.enum';
import { UserEntity } from 'src/modules/main/entities/user.entity';
import { GoalTypeEntity } from 'src/modules/savings-goal/entities/goal-type.entity';
import { SavingsGoalEntity } from 'src/modules/savings-goal/entities/savings-goal.entity';
import { WalletTypeEntity } from 'src/modules/wallet/entities/wallet.entity';
import { generateCode } from 'src/utils/shared';
import { ErrorEntity } from '../entitites/error.entity';
import { EntityManager } from 'typeorm';
import { TransactionEntity } from 'src/modules/transactions/entities/transaction.entity';

@Injectable()
export class MigrationService {
  constructor(
    @InjectConnection() private connection: Connection,
    private em: EntityManager,
  ) {}

  async saveGoalType(data: GoalTypeEntity) {
    await this.em
      .findOne(GoalTypeEntity, {
        where: { name: data.name },
      })
      .then(async (goal: any) => {
        if (!goal) {
          await this.em.save(data);
        }
      });
  }

  async storeErrorData(data: any, errorType: string) {
    const errorData = new ErrorEntity();
    errorData.data = data.data;
    errorData.migrationType = errorType;
    if (data.error.detail) errorData.detail = data.error.detail;
    if (data.error.table) errorData.table = data.error.table;
    if (data.error.query) errorData.query = data.error.query;
    // errorData.error = data.error;
    await this.em.save(errorData);
  }

  async getUserId(id: string) {
    const user = await this.em.findOne(UserEntity, {
      where: { user_id: id },
    });
    if (user) return user.id;
    return null;
  }

  async isValidDate(date: string) {
    const timestamp = Date.parse(date);

    if (isNaN(timestamp) == false) {
      return new Date(timestamp);
    }
    return null;
  }

  getTransactionType(type: string): TRANSACTION_TYPE {
    if (type.includes('debit')) return TRANSACTION_TYPE.DEBIT;
    if (type.includes('credit')) return TRANSACTION_TYPE.CREDIT;
    return TRANSACTION_TYPE.NOT_SPECIFIED;
  }

  getTransactionStatus(status: string): TRANSACTION_STATUS {
    if (status === 'success') return TRANSACTION_STATUS.success;
    if (status === 'progress') return TRANSACTION_STATUS.pending;

    return TRANSACTION_STATUS.failed;
  }

  async getUserAccountId(id: string) {
    return await this.em.findOne(AccountEntity, { where: { account_id: id } });
  }

  async createUserDefaultAccount(userId: string) {
    const userHasAccount = await this.ifUserHasAccount(userId);
    if (!userHasAccount) {
      const account = new AccountEntity();
      account.name = 'Primary';
      account.accountTypeId = await this.getAccountTypeId('Primary');
      account.accountNumber = this.getAccountNumber(0); // generate default account number;
      account.balance = 0;
      account.userId = await this.getUserId(userId);
      account.walletId = await this.getWalletId();
      return await this.em.save(account);
    }
    return userHasAccount;
  }

  async getAccountTypeId(type?: string) {
    const accountType = await this.em.findOne(AccountTypeEntity, {
      where: { name: type ?? 'Flexi Save' },
    });
    return accountType.id;
  }

  async getWalletId() {
    const wallet = await this.em.findOne(WalletTypeEntity, {
      where: { name: 'Local' },
    });
    if (wallet) return wallet.id;
    return null;
  }

  getAccountNumber(acc: number) {
    if (acc === 0) return Number(generateCode(10));
    return acc;
  }

  async ifUserHasAccount(user_id: string) {
    const userId = await this.getUserId(user_id);
    const account = await this.em.findOne(AccountEntity, {
      where: { userId: userId },
    });
    if (account) return account;
    return null;
  }

  async createSavingsGoal(item: any) {
    const savingsGoal = new SavingsGoalEntity();

    const personal_savings = item.personal_savings[0];
    savingsGoal.name = personal_savings.savingGoal;
    const account = item.accounts[0];
    const account_type = item.account_type[0];
    account.type = account_type.name;
    account.account_id = personal_savings.account_id;

    //savingsGoal.account = await this.createUserAccount(item);
    savingsGoal.accountId = (await this.createUserAccount(account)).id;

    savingsGoal.frequency = personal_savings.frequencyType
      ? this.getFrequencyType(personal_savings.frequencyType)
      : FREQUENCY_TYPE.not_available;

    // savings goal type
    if (item.account_type.length) {
      savingsGoal.goalTypeId = await this.getGoalTypeId(
        item.account_type[0].name === 'Primary' ? 'Primary' : 'Flexi Save',
      );
    } else {
      savingsGoal.goalTypeId = await this.getGoalTypeId('Other');
    }
    savingsGoal.period = isNaN(Number(personal_savings.goalPeriod))
      ? 0
      : personal_savings.goalPeriod;
    savingsGoal.amountToRaise = Number(personal_savings.amountToRaise);
    if (personal_savings.emoji) savingsGoal.emoji = personal_savings.emoji;
    if (personal_savings.preference)
      savingsGoal.preference = personal_savings.preference;
    savingsGoal.amount = isNaN(personal_savings.amountToSave)
      ? 0
      : personal_savings.amountToSave;
    savingsGoal.status =
      item.status === 'success' ? STATUS.active : STATUS.disabled;
    savingsGoal.startDate = await this.isValidDate(personal_savings.startDate);
    savingsGoal.goalStatus = GOAL_STATUS.inprogress;
    savingsGoal.endDate = await this.isValidDate(personal_savings.endDate);
    if (personal_savings.isFavorite)
      savingsGoal.isFavorite = personal_savings.isFavorite;

    savingsGoal.userId = await this.getUserId(personal_savings.user_id);
    //console.log('savingsGoal', savingsGoal);
    await this.em.save(savingsGoal);
    return savingsGoal.accountId;
  }

  async createUserAccount(accountData) {
    const account = new AccountEntity();

    account.name = accountData.type;

    if (accountData) {
      account.accountTypeId = await this.getAccountTypeId(
        accountData.type === 'Primary' ? 'Primary' : 'Flexi Save',
      );
      account.accountNumber = this.getAccountNumber(
        Number(accountData.accountNumber),
      );
      account.balance = Number(accountData.balance);
      account.userId = await this.getUserId(accountData.user_id);
      account.walletId = await this.getWalletId();
      account.account_id = accountData.account_id;
      //console.log('saving account', account);
      return await this.em.save(account);
    }
  }

  getFrequencyType(frequency: string): FREQUENCY_TYPE {
    const toFormat = frequency.toLowerCase();
    const types = Object.values(FREQUENCY_TYPE).map((i) => i.toLowerCase());

    if (types.includes(toFormat)) {
      return this.capitalizeFirstLetter(toFormat) as FREQUENCY_TYPE;
    }
    return FREQUENCY_TYPE.not_available;
  }

  capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  async getGoalTypeId(name: string) {
    const goalType = await this.em.findOne(GoalTypeEntity, {
      where: { name },
    });
    if (goalType) return goalType.id;
    return null;
  }

  async saveTransaction(transaction, type) {
    // console.log('incoming transaction', transaction);
    const newTransaction = new TransactionEntity();
    newTransaction.amount = Number(transaction.amount);
    // newTransaction.referenceId = transaction.refNo;
    newTransaction.transactionId = transaction.refNo;
    newTransaction.userId = await this.getUserId(transaction.user_id);
    newTransaction.transactionStatus = this.getTransactionStatus(
      transaction.status,
    );
    newTransaction.transactionType = type;
    if (await this.isValidDate(transaction.createdAt))
      newTransaction.createdAt = new Date(transaction.createdAt);

    // const accountId = transaction.PersonalSavings[0].account_id;
    // newTransaction.accountId = (await this.getUserAccountId(accountId)).id;

    if (transaction.msisdn) {
      newTransaction.recipientPhone = transaction.msisdn;
    }

    if (transaction.personal_savings && transaction.personal_savings.length) {
      const accountId = transaction.personal_savings[0].account_id;
      if (await this.getUserAccountId(accountId)) {
        newTransaction.accountId = (await this.getUserAccountId(accountId)).id;
      } else {
        // create savings goal account and get account id
        console.log('transaction', transaction);
        console.log('Account ID Not Found');
        newTransaction.accountId = await this.createSavingsGoal(transaction);
      }
    } else {
      // create account for user
      newTransaction.accountId = (
        await this.createUserDefaultAccount(transaction.user_id)
      ).id;
      //await this.createUserAccount(transaction.user_id)
    }
    //console.log('newTransaction', newTransaction);
    return await this.em.save(newTransaction);
  }

  async createTransactions(transactionData: any[], type: TRANSACTION_TYPE) {
    for (const transaction of transactionData) {
      try {
        await this.saveTransaction(transaction, type);
      } catch (error: any) {
        console.log('error', error);
        // return 0;
        await this.storeErrorData(
          {
            data: transaction,
            error,
          },
          'deposits',
        );
      }
    }
  }
}
