import { ApiProperty, OmitType } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { DEPOSIT_TYPE } from '../../../../src/modules/enums/deposit-type.enum';
import { AccountDto } from '../../account/dtos/account.dto';
import { VENDOR } from '../../enums/vendor.enum';

export enum NETWORK {
  mtn = 'mtn',
  vodafone = 'vodafone',
  airteltigo = 'arieltigo',
}

export class DepositDto {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Deposit amount',
    example: 1000,
    type: Number,
  })
  amount: number;

  @IsEnum(VENDOR)
  @IsOptional()
  @ApiProperty({
    description: 'Vendor',
    example: VENDOR.itc,
    enum: VENDOR,
    required: false,
  })
  vendor?: VENDOR;

  // @IsEnum(DEPOSIT_TYPE)
  // @IsNotEmpty()
  // @ApiProperty({
  //   description: 'Deposit type',
  //   example: DEPOSIT_TYPE.direct,
  //   enum: DEPOSIT_TYPE,
  // })
  // depositType: DEPOSIT_TYPE;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Account id',
    example: 'b3d9c1a0-5b9c-4b1d-8c1a-0b9c4b1d8c1a',
    type: String,
    required: false,
  })
  accountId?: string;

  // @IsString()
  // @IsOptional()
  // @ApiProperty({
  //   description: 'Account transfer id mostly from savings goal',
  //   example: 'b3d9c1a0-5b9c-4b1d-8c1a-0b9c4b1d8c1a',
  //   type: String,
  //   required: false,
  // })
  // accountTransferId: string;

  @IsObject()
  @IsOptional()
  @ApiProperty({
    description: 'Account',
    example: AccountDto,
    type: AccountDto,
  })
  account?: AccountDto;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'User id',
    example: 'b3d9c1a0-5b9c-4b1d-8c1a-0b9c4b1d8c1a',
    type: String,
  })
  userId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'pin verification id',
    example: 'b3d9c1a0-5b9c-4b1d-8c1a-0b9c4b1d8c1a',
    type: String,
    required: true,
  })
  verificationId: string;
}

export class DepositInputDto extends OmitType(DepositDto, [
  'userId',
  'account',
  'accountId',
  'vendor',
]) {
  // @ValidateIf((o) => o.depositType == DEPOSIT_TYPE.direct || o.paymentMethodId)
  // @IsString()
  // @IsOptional()
  // @ApiProperty({
  //   description: 'Payment method id',
  //   example: 'b3d9c1a0-5b9c-4b1d-8c1a-0b9c4b1d8c1a',
  //   type: String,
  //   required: true,
  // })
  // paymentMethodId?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'momo network',
    example: 'vodafone or mtn or airteltigo',
    type: String,
    required: true,
  })
  network?: NETWORK;
}
