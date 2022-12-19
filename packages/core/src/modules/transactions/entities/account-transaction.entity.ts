import { TransactionStatus } from './../../userpin/entities/userpin.entity';
// this will only have successful transactions and successful withdrawals only;
// its should have many to one relationship with the account entity;

import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  Tree,
  UpdateDateColumn,
} from 'typeorm';
import { AbstractEntity } from '../../main/entities/abstract-entity';
import { TransactionEntity } from './transaction.entity';
import { TRANSACTION_TYPE } from '../../enums/transaction-type.enum';
import { TRANSACTION_STATUS } from '../../enums/transaction.status';
import { OmitType, PickType } from '@nestjs/swagger';
import { AccountEntity } from '../../account/entities/account.entity';

// should have account_id which is the bezo wallet default account id
// should have accountTransferId which is the account id of the account that is being transferred to, will be optional , but required if transfer is involved;
// should have transfer status: (pending, success, not_available, failed)
// should have debit amount, credit amount and balance all should have default 0;
// should have initial balance which is the balance from the default bezowallet account;

export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  TRANSFER = 'transfer',
  DEBIT = 'debit',
  CREDIT = 'credit',
}

export enum TransferStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  NOT_AVAILABLE = 'not_available',
}

@Entity()
export class AccountTransactionEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id?: number;

  @ManyToOne(() => AccountEntity, (account) => account.accountTransactions)
  @JoinColumn({ name: 'accountId' })
  account?: AccountEntity;

  @Column('uuid', { nullable: true })
  accountId?: string;

  // @Column('uuid', { nullable: true })
  // accountTransferId?: string;

  @Column('text', { nullable: true })
  referenceId?: string;

  @Column('text', { nullable: true })
  phone?: string;

  @Column('text', { nullable: true })
  responseMessage?: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    nullable: true,
  })
  amount?: number;

  // @Column({
  //   type: 'decimal',
  //   precision: 10,
  //   scale: 2,
  //   default: 0,
  //   nullable: true,
  // })
  // creditAmount?: number;

  // @Column({
  //   type: 'decimal',
  //   precision: 10,
  //   scale: 2,
  //   default: 0,
  //   nullable: true,
  // })
  // debitAmount?: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    nullable: true,
  })
  initialBalance?: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    nullable: true,
  })
  currentBalance?: number;

  @Column('enum', { enum: TRANSACTION_TYPE, nullable: false })
  transactionType: TRANSACTION_TYPE;

  @Column('enum', { enum: TransferStatus, nullable: false })
  transferStatus?: TransferStatus;

  @Column('enum', {
    enum: TRANSACTION_STATUS,
    nullable: false,
    default: TRANSACTION_STATUS.pending,
  })
  transactionStatus: TRANSACTION_STATUS;

  @ManyToOne(() => TransactionEntity, (t) => t.accountTransactions)
  @JoinColumn({ name: 'transactionId' })
  transaction?: TransactionEntity;

  @Column('int', { nullable: true })
  transactionId?: number;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}
