import { Module } from '@nestjs/common';
import { TransferController } from './controllers/transfer.controller';
import { TransferService } from './services/transfer.service';
import { TransactionModule } from '../transactions/transaction.module';
import { UserPinModule } from '../userpin/userpin.module';
import { AccountModule } from '../account/account.module';
import { CleanTransferCommand } from './commands/clean-tranfer.command';

@Module({
  imports: [TransactionModule, UserPinModule, AccountModule],
  controllers: [TransferController],
  providers: [TransferService, CleanTransferCommand],
  exports: [TransferService, CleanTransferCommand],
})
export class TransferModule {}
