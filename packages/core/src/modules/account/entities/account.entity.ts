import { AbstractEntity } from '../../../../src/modules/main/entities/abstract-entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { AccountTypeEntity } from './account-type.entity';

import { UserEntity } from '../../main/entities/user.entity';
import { WalletTypeEntity } from '../../../../src/modules/wallet/entities/wallet.entity';
import { SavingsGoalEntity } from '../../savings-goal/entities/savings-goal.entity';
import { DepositEntity } from '../../../../src/modules/transactions/entities/deposit.entity';
import { AccountTransactionEntity } from '../../transactions/entities/account-transaction.entity';
import { InvestmentEntity } from '../../investment/entities/invest.entity';
import { TransactionEntity } from '../../transactions/entities/transaction.entity';
import { InterestEntity } from '../../interest/entities/interest.entity';

@Entity()
export class AccountEntity extends AbstractEntity {
  @Column('text', { nullable: false })
  name: string;

  @ManyToOne(() => AccountTypeEntity, (a) => a.accounts)
  @JoinColumn({ name: 'accountTypeId' })
  accountType?: AccountTypeEntity;

  @Column('uuid')
  accountTypeId: string;

  @Column('text', { nullable: true })
  account_id?: string;

  @OneToOne(() => SavingsGoalEntity, (a) => a.account, {
    nullable: true,
  })
  savingsGoal?: SavingsGoalEntity;

  @OneToMany(() => AccountTransactionEntity, (a) => a.account)
  accountTransactions?: AccountTransactionEntity[];

  @Column('boolean', { nullable: true, default: true })
  allowWithdrawal: boolean;

  // // remove this
  // @Column('uuid', { nullable: true })
  // savingsGoalId?: string;

  @Column('bigint', { nullable: false })
  accountNumber: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    nullable: true,
  })
  balance?: number;

  @ManyToOne(() => UserEntity, (a) => a.accounts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => WalletTypeEntity, (w) => w.accounts)
  @JoinColumn({ name: 'walletId' })
  wallet?: WalletTypeEntity;

  @Column('uuid')
  walletId: string;

  @OneToMany(() => DepositEntity, (d) => d.account)
  deposits?: DepositEntity[];

  @OneToMany(() => InvestmentEntity, (i) => i.account)
  investments?: InvestmentEntity[];

  @OneToMany(() => TransactionEntity, (i) => i.account)
  transactions?: TransactionEntity[];

  @OneToMany(() => InterestEntity, (i) => i.account)
  interests?: InterestEntity[];
}
