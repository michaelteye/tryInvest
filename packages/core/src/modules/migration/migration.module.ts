import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ErrorEntity } from './entitites/error.entity';
import { MigrateProfileCommand } from './commands/migrate-profile.command';
import { MigrateTransactionPinCommand } from './commands/migrate-transactionpin.command';
import { MigrateAccountCommand } from './commands/migrate-account.command';
import { MigrateAccountTransactionCommand } from './commands/migrate-account-transactions';
import { MigrateInvestmentCommand } from './commands/migrate-investments';
import { MigrateDepositsCommand } from './commands/migrate-deposits.command';
import { MigrateWithdrawalsCommand } from './commands/migrate-withdrawals.command';
import { MigrationService } from './services/migration.service';
import { MigrateInterestCommand } from './commands/migrate-interests';
import { PasswordEncoderService } from '../auth/services/password-encorder.service';
import { UserPinModule } from '../userpin/userpin.module';
import { MigrateGoalDescriptionCommand } from './commands/migrate-goal-descriptions';

@Module({
  imports: [TypeOrmModule.forFeature([ErrorEntity]), AuthModule, UserPinModule],
  controllers: [],
  providers: [
    // commands
    MigrateProfileCommand,
    MigrateTransactionPinCommand,
    MigrateAccountCommand,
    MigrateProfileCommand,
    MigrateAccountTransactionCommand,
    MigrateInvestmentCommand,
    MigrateDepositsCommand,
    MigrateWithdrawalsCommand,
    MigrateInterestCommand,
    MigrateGoalDescriptionCommand,

    //services
    MigrationService,
    PasswordEncoderService,
  ],
})
export class MigrationModule {}
