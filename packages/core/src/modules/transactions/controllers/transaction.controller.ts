import {
  Body,
  All,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Controller,
  Logger,
  Post,
  Param,
  Get,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiResponse, OmitType } from '@nestjs/swagger';
import { AuthUserRole } from 'src/modules/auth/types/auth-user.roles';

import { MixedAuthGuard } from '../../auth/guards/mixed-auth.guard';
import { RoleAuth, RoleAuthGuard } from '../../auth/guards/role-auth.guard';
import { DepositInputDto } from '../dtos/deposit.dto';
import { TransactionService } from '../services/transaction.service';
import { TRANSACTION_TYPE } from '../../enums/transaction-type.enum';
import { TransactionEntity } from '../entities/transaction.entity';

@ApiTags('Transactions')
@ApiBearerAuth('JWT')
@Controller('transactions')
@UseGuards(MixedAuthGuard, RoleAuthGuard)
@UsePipes(new ValidationPipe({ transform: true }))
export class TransactionController {
  private readonly logger = new Logger('RecipeService');
  constructor(private service: TransactionService) {}

  @RoleAuth(AuthUserRole.User)
  @Post('/deposit')
  @ApiResponse({
    status: 201,
    description: 'Transaction Initiated Successfully.',
  })
  async deposit(@Body() request: DepositInputDto): Promise<any> {
    return await this.service.depositWithdrawal(
      request,
      TRANSACTION_TYPE.CREDIT,
    );
  }

  @RoleAuth(AuthUserRole.User)
  @Post('/withdrawal')
  @ApiResponse({
    status: 201,
    description: 'Transaction Initiated Successfully.',
  })
  async withdrawal(@Body() request: DepositInputDto): Promise<any> {
    return await this.service.depositWithdrawal(
      request,
      TRANSACTION_TYPE.DEBIT,
    );
  }

  // create transaction status api

  @RoleAuth(AuthUserRole.User)
  @Get('status/:ref')
  @ApiResponse({
    status: 201,
    description: 'Get Transaction Status.',
  })
  async transactionStatus(
    @Param('ref') ref: string,
  ): Promise<TransactionEntity> {
    return await this.service.getTransactionStatus(ref);
  }
}
