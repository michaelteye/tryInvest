import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionController } from './controllers/transaction.controller';
import { TransactionService } from './services/transaction.service';
import { TransactionEntity } from './entities/transaction.entity';
import { PaymentMethodEntity } from '../main/entities/paymentmethod.entity';
import { HttpModule } from '@nestjs/axios';
import { HttpRequestService } from '../shared/services/http.request.service';
import { CallBackController } from './controllers/callback.controller';
import { AccountTransactionEntity } from './entities/account-transaction.entity';
import { AccountEntity } from '../account/entities/account.entity';
import { UserPinModule } from '../userpin/userpin.module';
import { SharedModule } from '../shared/shared.module';
import { AccountModule } from '../account/account.module';
import { NotificationService } from '../notifications/services/notification.service';

export const Entities = [
  TransactionEntity,
  PaymentMethodEntity,
  AccountTransactionEntity,
  AccountEntity,
];

@Module({
  imports: [
    TypeOrmModule.forFeature(Entities),
    HttpModule,
    UserPinModule,
    SharedModule,
    AccountModule,
  ],
  controllers: [TransactionController, CallBackController],
  providers: [TransactionService, HttpRequestService, NotificationService],
  exports: [TypeOrmModule.forFeature(Entities), TransactionService],
})
export class TransactionModule { }
