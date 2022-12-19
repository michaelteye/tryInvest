import { AccountEntity } from '../../../../src/modules/account/entities/account.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { AbstractEntity } from '../../main/entities/abstract-entity';
import { DEPOSIT_TYPE } from '../../enums/deposit-type.enum';
import { UserEntity } from '../../main/entities/user.entity';
import { PaymentMethodEntity } from '../../main/entities/paymentmethod.entity';

@Entity()
export class DepositEntity extends AbstractEntity {
  @Column('integer')
  amount: number;

  @ManyToOne(() => AccountEntity, (a) => a.deposits)
  @JoinColumn({ name: 'accountId' })
  account: AccountEntity;

  @Column('uuid')
  accountId: string;

  @Column('enum', { enum: DEPOSIT_TYPE, nullable: false })
  depositType: DEPOSIT_TYPE;

  @ManyToOne(() => UserEntity, (u) => u.deposits)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column('uuid')
  userId: string;

  // to change

  // @OneToOne(() => TransactionEntity, (t) => t.deposit)
  // @JoinColumn({ name: 'transactionId' })
  // transaction: TransactionEntity;

  @Column('uuid', { nullable: false })
  transactionId: string;

  @ManyToOne(() => PaymentMethodEntity, (p) => p.deposits)
  @JoinColumn({ name: 'paymentMethodId' })
  paymentMethod: PaymentMethodEntity;

  @Column('uuid', { nullable: false })
  paymentMethodId: string;
}
