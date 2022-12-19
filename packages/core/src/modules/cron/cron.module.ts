import { Module } from '@nestjs/common';
import { TransactionCronService } from './services/transactions.cron.service';
import { TransactionModule } from '../transactions/transaction.module';

@Module({
  imports: [TransactionModule],
  controllers: [],
  providers: [TransactionCronService],
})
export class CronModule {}
