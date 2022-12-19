import { ApiProperty, OmitType } from '@nestjs/swagger';
import {
    IsBoolean,
    IsDate,
    IsDateString,
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsObject,
    IsOptional,
    IsString,
} from 'class-validator';
import { AccountDto } from '../../account/dtos/account.dto';
import { InvestmentTypeDto } from './investment-package.dto';
import { FREQUENCY_TYPE } from '../../main/entities/enums/savingsfrequency.enum';
import { STATUS } from '../../main/entities/enums/status.enum';
import { WalletDto } from '../../wallet/dtos/wallet.dto';

export class InvestmentDto {
    @IsNotEmpty()
    @IsString()
    @ApiProperty({
        type: String,
    })
    id: string;

    @IsNotEmpty()
    @IsString()
    @ApiProperty({
        description: 'Investment name',
        example: 'Investment Account',
        type: String,
    })
    name: string;

    @IsOptional()
    @IsString()
    @ApiProperty({
        description: 'Description of the savings goal',
        example: 'purpose is to save to buy a car',
        type: String,
    })
    description?: string;

    @IsObject()
    @IsOptional()
    @ApiProperty({
        description: 'Savings account',
        type: AccountDto,
    })
    account: AccountDto;

    @IsString()
    @ApiProperty({
        type: String,
    })
    userId: string;

    @IsString()
    @ApiProperty({
        type: String,
    })
    ref: string;


    @IsNumber()
    @ApiProperty({
        description: 'Period in days for the savings goal',
        example: 10,
        type: Number,
    })
    period: number;



    @IsNumber()
    @IsNotEmpty()
    @ApiProperty({
        description: 'Amount of money to be saved',
        example: 100,
        type: Number,
    })
    amount: number;



    @IsEnum(STATUS)
    @ApiProperty({
        description: 'Savings Goal Status',
        example: STATUS.enabled,
        enum: STATUS,
    })
    status: STATUS;


    @IsDateString()
    @IsNotEmpty()
    @ApiProperty({
        description: 'Date you want to start contributing to the goal',
        example: '2020-12-12',
        type: Date,
    })
    startDate: Date | string;


    @IsDateString()
    @IsNotEmpty()
    @ApiProperty({
        description: 'Date you want to start contributing to the goal',
        example: '2020-12-19',
        type: Date,
    })
    endDate: Date | string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        description: 'Account Type Id',
        example: '5adf43451c9c-7c1f-4b5c-8c1f-5c9c7c1f4b5c',
        type: String,
    })
    accountId: string;



}

export class InvestmentInputDto extends OmitType(InvestmentDto, [
    'id',
    'account',
    'userId',
    'status',

]) {





}
