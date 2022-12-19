import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PasswordEntity } from '../auth/entities/password.entity';
// import { UserAccountEntity } from './entities/useraccount.entity';
import { AddressEntity } from './entities/address.entity';
import { AdminEntity } from './entities/admin.entity';
import { DocumentEntity } from './entities/document.entity';
import { LevelEntity } from './entities/level.entity';
import { PersonalSavingsEntity } from './entities/personalSavings.entity';
import { PlatformEntity } from './entities/platform.entity';
import { ProfileEntity } from './entities/profile.entity';
import { UserEntity } from './entities/user.entity';
import { PaymentMethodEntity } from './entities/paymentmethod.entity';
import { CreateAdminCommand } from './commands/admin.command';
import { CreateAccountCommand } from './commands/account.command';
import { PasswordEncoderService } from '../auth/services/password-encorder.service';
import { CreateUserCommand } from './commands/user.command';
import { AuthModule } from '../auth/auth.module';
import { TransactionModule } from '../transactions/transaction.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AddressEntity,
      AdminEntity,
      DocumentEntity,
      LevelEntity,
      PasswordEntity,
      PlatformEntity,
      ProfileEntity,
      UserEntity,
      PaymentMethodEntity,
      PersonalSavingsEntity,
    ]),
    AuthModule,
  ],
  providers: [
    PasswordEncoderService,
    // commands
    CreateAdminCommand,
    CreateAccountCommand,
    CreateUserCommand,
  ],
  exports: [
    // commands
    CreateAdminCommand,
    CreateAccountCommand,
    CreateUserCommand,
  ],
  controllers: [],
})
export class MainModule {}
