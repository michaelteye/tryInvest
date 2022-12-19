import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Console, Command } from 'nestjs-console';
import { AccountTypeEntity } from 'src/modules/account/entities/account-type.entity';
import { JwtManagerService } from 'src/modules/auth/services/jwt-manager.service';
import { PasswordEncoderService } from 'src/modules/auth/services/password-encorder.service';

import { UserEntity } from 'src/modules/main/entities/user.entity';
import { WalletTypeEntity } from 'src/modules/wallet/entities/wallet.entity';
import { EntityManager } from 'typeorm';

import { STATUS } from 'src/modules/auth/entities/enums/status.enum';

import { ErrorEntity } from '../entitites/error.entity';
import { GoalTypeEntity } from '../../savings-goal/entities/goal-type.entity';
import { SavingsGoalEntity } from '../../savings-goal/entities/savings-goal.entity';
import { AccountEntity } from 'src/modules/account/entities/account.entity';
import { GOAL_STATUS } from '../../auth/entities/enums/goal-status.enum';
import { FREQUENCY_TYPE } from 'src/modules/main/entities/enums/savingsfrequency.enum';
import { generateCode } from '../../../utils/shared';

@Console()
export class MigrateAccountCommand {
  private db: Connection;
  constructor(
    private em: EntityManager,
    private passwordHash: PasswordEncoderService,
    private readonly jwtManager: JwtManagerService,
    @InjectConnection() private connection: Connection,
  ) {
    this.db = this.connection.useDb('bezosusuDBLive');
  }

  @Command({
    command: 'migrate:accounts',
    options: [
      {
        flags: '--type <type>',
        required: false,
      },
    ],
  })
  async execute(opts?: any) {
    try {
      return await this._execute(opts);
    } catch (e) {
      console.error(e);
      return 1;
    }
  }

  async _execute(opts?: any) {
    await this.migrateAccountTypes();
    await this.migrateSavingsGoals(opts?.type);
    //const savingsGoals = await this.getSavingsGoals();
    //console.log('accountTypes', accountTypes);
  }

  bezoUsers() {
    const users = [
      'e8d1f260398a3b202ad53e87bc2311714b303e4e',
      'e1a07e6d62bb59ceb9106d8510f3c760cb00aa43',
      'd308121515b204a6e42debd9eb7a5b45c76efe08',
      '138ac5f3c1945c95218c8af5e6291cd1f10b176c',
      '5224e8043ef265408fe82ab684bd0c4830297eab',
      '24ba32b6ce949d5761c451ccc5ce75a48c78ad92',
      '41dbd50b957608041f862739fe0ac4c72a35a3f9',
      'e46a60ac1facd7e0378ac182973058e68cca8598',
      '9999d305555bae808eca26b4b459b6cca75a4ea8',
      '5250b772c3f65166ac2cf00bbe5a7647856763f6',
      'a17bc3fe092aeb229782df1f05775fe17bf31208',
      '04a926271731e4603a7e405108b4d1ba98f0d37c',
      '7c41af50ca491e29e4ab11e7168ed113c05600d7',
      '537e31925cba79503ad6b39aa0a107cd39b232d8',
      '9ed01082e0d7366c7d4a7e6f68314d7571be3e07',
      '3a581b611d35ef221affd5047fd27f6421cadee8',
      'bd756794c382c584a5d1287a7f591616c9446cbb',
      '98d100741280b62c6b734c6b6e653e24b443731f',
      'fa1a703401943a993a536c8eb82656a1435daf0d',
      '3367edc08e435dbc140bcebb896d0d725ea87b97',
      '5bf0e497860189c276b29df0e3897936326957ac',
      '2a12b8a0633662dc37e03a604cd97df1420cab50',
      '460eb80ed86fd377106105036318dd196b84c7ad',
      'f6a4f00ce247dfa4b1aa50a60f7bf01ad9c5076f',
      '5ddbb42961068053a5e13a8fa0bed69d2fa05b66',
    ];
    return users;
  }

  // load account type

  async getAccountTypes() {
    const accountTypes = await this.db
      .collection('account_type')
      .find()
      .toArray();
    return accountTypes;
  }

  async migrateAccountTypes() {
    console.log('Migrating account types ....');
    const accountTypes = await this.getAccountTypes();
    for (const accountType of accountTypes) {
      const goalType = new GoalTypeEntity();
      goalType.name = accountType.name;
      goalType.status = accountType.status;
      goalType.type = accountType.type;
      await this.saveGoalType(goalType);
    }
    console.log('Migration complete ....');
  }

  async migrateSavingsGoals(type?: string) {
    console.log('Migrating Savings Goals ...');
    const savingGoals = await this.getSavingsGoals(type);

    const chunkSize = 1000;
    for (let i = 0; i < savingGoals.length; i += chunkSize) {
      const chunk = savingGoals.slice(i, i + chunkSize);
      await Promise.all([this.createSavingGoals(chunk)]);
    }
    console.log('Completed ...');
  }

  async createSavingGoals(savingGoals: any[]) {
    for (const item of savingGoals) {
      console.log('items to save', item);
      try {
        // create savings goal
        //console.log('incoming data', item);
        const savingsGoal = new SavingsGoalEntity();
        savingsGoal.name = item.savingGoal;

        savingsGoal.account = await this.createUserDefaultAccount(
          item.account[0],
          item.account_type[0],
          item.user_id,
          item.savingGoal,
        );

        savingsGoal.frequency = item.frequencyType
          ? this.getFrequencyType(item.frequencyType)
          : FREQUENCY_TYPE.not_available;

        // savings goal type
        if (item.account_type.length) {
          savingsGoal.goalTypeId = await this.getGoalTypeId(
            item.account_type[0].name,
          );
        } else {
          savingsGoal.goalTypeId = await this.getGoalTypeId('Other');
        }
        savingsGoal.period = isNaN(Number(item.goalPeriod))
          ? 0
          : item.goalPeriod;
        savingsGoal.amountToRaise = Number(item.amountToRaise);
        if (item.emoji) savingsGoal.emoji = item.emoji;
        if (item.preference) savingsGoal.preference = item.preference;
        savingsGoal.amount = isNaN(item.amountToSave) ? 0 : item.amountToSave;
        const goalStatus = item.status.toLowerCase();
        savingsGoal.status =
          goalStatus === 'success' ? STATUS.active : STATUS.disabled;
        savingsGoal.startDate = await this.isValidDate(item.startDate);
        savingsGoal.goalStatus =
          goalStatus === 'success' ? GOAL_STATUS.inprogress : GOAL_STATUS.ended;
        savingsGoal.endDate = await this.isValidDate(item.endDate);
        savingsGoal.isFavorite = item.isFavorite;
        savingsGoal.userId = await this.getUserId(item.user_id);

        //console.log('savingsGoal', savingsGoal);

        await this.em.save(savingsGoal);
      } catch (error) {
        // console.log(error instanceof QueryFailedError);
        // console.log(error.message);
        // return 0;
        await this.storeErrorData(
          {
            data: item,
            error,
          },
          'accounts',
        );
      }
    }
  }

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

  async getBezoUsersSavingsGoals() {
    const savingsGoals = await this.db
      .collection('personal_savings')
      .aggregate()
      .match({ user_id: { $in: this.bezoUsers() } })
      .lookup({
        from: 'account',
        localField: 'account_id',
        foreignField: '_id',
        as: 'account',
      })
      .lookup({
        from: 'account_type',
        localField: 'account.account_type_id',
        foreignField: '_id',
        as: 'account_type',
      })
      .toArray();
    return savingsGoals as unknown as any[];
  }

  async getAllUsersSavingsGoals() {
    const savingsGoals = await this.db
      .collection('personal_savings')
      .aggregate()
      .lookup({
        from: 'account',
        localField: 'account_id',
        foreignField: '_id',
        as: 'account',
      })
      .lookup({
        from: 'account_type',
        localField: 'account.account_type_id',
        foreignField: '_id',
        as: 'account_type',
      })
      .toArray();
    return savingsGoals as unknown as any[];
  }
  async getSavingsGoals(type?: string): Promise<any[]> {
    //savingsGoals.match({ momo: { $in: this.bezoUsers() } });
    if (type === 'bezousers') {
      return await this.getBezoUsersSavingsGoals();
    }
    return await this.getAllUsersSavingsGoals();
  }

  async createUserDefaultAccount(
    accountData: any,
    accountType: any,
    userId: string,
    goalName?: string,
  ): Promise<AccountEntity> {
    const account = new AccountEntity();

    account.name = goalName;

    if (accountData) {
      const account_type =
        accountType.name === 'Primary' ? 'Primary' : 'Flexi Save';
      account.accountTypeId = await this.getAccountTypeId(account_type);
      account.accountNumber = this.getAccountNumber(
        Number(accountData.accountNumber),
      );
      account.balance = Number(accountData.balance);
      account.userId = await this.getUserId(userId);
      account.walletId = await this.getWalletId();
      account.account_id = accountData._id;
      return account;
    }

    account.name = goalName ? goalName : 'Primary';
    account.accountTypeId = await this.getAccountTypeId('Primary');
    account.accountNumber = this.getAccountNumber(0); // generate default account number;
    account.balance = 0;
    account.userId = await this.getUserId(userId);
    account.walletId = await this.getWalletId();
    return account;
  }

  async storeErrorData(data: any, errorType: string) {
    const errorData = new ErrorEntity();
    errorData.data = data.data;
    errorData.migrationType = errorType;
    if (data.error.detail) errorData.detail = data.error.detail;
    if (data.error.table) errorData.table = data.error.table;
    if (data.error.query) errorData.query = data.error.query;
    errorData.data = JSON.stringify(data.error);
    await this.em.save(errorData);
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

  async getGoalTypeId(name: string) {
    const goalType = await this.em.findOne(GoalTypeEntity, {
      where: { name },
    });
    if (goalType) return goalType.id;
    return null;
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

  capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  getFrequencyType(frequency: string): FREQUENCY_TYPE {
    const toFormat = frequency.toLowerCase();
    const types = Object.values(FREQUENCY_TYPE).map((i) => i.toLowerCase());

    if (types.includes(toFormat)) {
      return this.capitalizeFirstLetter(toFormat) as FREQUENCY_TYPE;
    }
    return FREQUENCY_TYPE.not_available;
  }

  getAccountNumber(acc: number) {
    if (acc === 0) return Number(generateCode(10));
    return acc;
  }
}
