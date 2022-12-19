import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AbstractEntity } from '../../main/entities/abstract-entity';
import { UserEntity } from '../../main/entities/user.entity';
import { TRANSACTION_STATUS } from '../../enums/transaction.status';
import { VENDOR } from '../../../../src/modules/enums/vendor.enum';
import { AccountTransactionEntity } from './account-transaction.entity';
import { PaymentMethodEntity } from 'src/modules/main/entities/paymentmethod.entity';
import { PlATFORM } from '../../main/entities/enums/platform.enum';
import { TRANSACTION_TYPE } from '../../enums/transaction-type.enum';
import { OmitType } from '@nestjs/swagger';
import { AccountEntity } from '../../account/entities/account.entity';
import { InterestEntity } from '../../interest/entities/interest.entity';

// - accountId  :   Account Number
// - amount : amount
// - transaction_type : DEBIT, CREDIT
// - transactionId : Transaction ID to be generated and passed to the payment gateway
// - narration - Transaction Description (Description should show what transaction is done)
// - user_id  - Account Holder's ID
// - phoneNumber  :  mobileNumber that did transaction
// - platform (web, ussd,  mobile app - )

@Entity()
export class TransactionEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id?: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    nullable: true,
  })
  amount?: number;

  @ManyToOne(() => UserEntity, (u) => u.deposits)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column('uuid')
  userId: string;

  @Column('text')
  transactionId: string;

  @Column('text', { nullable: true })
  recipientPhone?: string;

  @Column('text', { nullable: true })
  senderPhone?: string;

  @Column('text', { nullable: true })
  naration?: string;

  // @Column('uuid', { nullable: true })
  // accountTransferId?: string;

  @Column('enum', {
    enum: TRANSACTION_STATUS,
    default: TRANSACTION_STATUS.pending,
  })
  transactionStatus: TRANSACTION_STATUS;

  @Column('enum', {
    enum: PlATFORM,
    default: PlATFORM.web,
  })
  platform: PlATFORM;

  @Column({
    type: 'jsonb',
    nullable: true,
    default: {},
  })
  public transactionData?: any;

  @OneToMany(() => AccountTransactionEntity, (t) => t.transaction)
  accountTransactions?: AccountTransactionEntity[];

  @Column('enum', { enum: TRANSACTION_TYPE, nullable: false })
  transactionType: TRANSACTION_TYPE;

  @ManyToOne(() => AccountEntity, (a) => a.transactions)
  @JoinColumn({ name: 'accountId' })
  account: AccountEntity;

  @Column('uuid', { nullable: true })
  accountId: string;

  @OneToOne(() => InterestEntity, (i) => i.transaction)
  interest?: InterestEntity;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}
