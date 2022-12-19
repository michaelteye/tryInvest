import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Console, Command } from 'nestjs-console';
import { EntityManager } from 'typeorm';
import { TRANSACTION_TYPE } from '../../enums/transaction-type.enum';
import { MigrationService } from '../services/migration.service';

@Console()
export class MigrateWithdrawalsCommand {
  private db: Connection;
  constructor(
    private em: EntityManager,
    @InjectConnection() private connection: Connection,
    private service: MigrationService,
  ) {
    this.db = this.connection.useDb('bezosusuDBLive');
  }

  @Command({
    command: 'migrate:withdrawals',
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
    console.log('Migrating withdrawals ....');
    await this.migrateTransactions();
    console.log('Migration complete ....');
  }

  // load account type

  async getDeposits() {
    const deposits = await this.db
      .collection('withdrawal')
      .aggregate()
      .lookup({
        from: 'personal_savings',
        localField: 'savingsRefNo',
        foreignField: 'refNo',
        as: 'personal_savings',
      })
      .lookup({
        from: 'account',
        localField: 'personal_savings.account_id',
        foreignField: '_id',
        as: 'accounts',
      })
      .lookup({
        from: 'account_type',
        localField: 'accounts.account_type_id',
        foreignField: '_id',
        as: 'account_type',
      })

      .toArray();
    return deposits;
  }

  async migrateTransactions() {
    const userDeposits = await this.getDeposits();
    //console.log('userDeposits', JSON.stringify(userDeposits, null, 2));
    console.log(userDeposits.length);

    const chunkSize = 1000;
    for (let i = 0; i < userDeposits.length; i += chunkSize) {
      const chunk = userDeposits.slice(i, i + chunkSize);
      await Promise.all([
        this.service.createTransactions(chunk, TRANSACTION_TYPE.DEBIT),
      ]);
    }
  }
}
