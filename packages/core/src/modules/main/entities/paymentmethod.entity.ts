import { STATUS } from '../../auth/entities/enums/status.enum';
import { PhoneIdentityEntity } from '../../auth/entities/phone-identity.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { AbstractEntity } from './abstract-entity';
import { UserEntity } from './user.entity';
import { PAYMENT_TYPE } from './enums/paymenttype.enum';
import { NETWORK } from './enums/network.enum';
import { DepositEntity } from '../../transactions/entities/deposit.entity';
import { TransactionEntity } from '../../transactions/entities/transaction.entity';

@Entity()
export class PaymentMethodEntity extends AbstractEntity {
  @OneToOne(() => PhoneIdentityEntity, (p) => p.paymentMethod)
  @JoinColumn({ name: 'phoneId' })
  phone?: PhoneIdentityEntity;

  @Column('uuid', { nullable: true })
  phoneId?: string;

  @ManyToOne(() => UserEntity, (u) => u.userPaymentMethods, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column('text', { nullable: true })
  userId?: string;

  @Column('text', { nullable: true })
  accountNumber?: string;

  @Column('text', { nullable: true })
  bank?: string;

  @Column('enum', { enum: STATUS, default: STATUS.disabled })
  status: STATUS;

  @Column('enum', { enum: PAYMENT_TYPE, nullable: true })
  paymentType?: PAYMENT_TYPE;

  @Column('enum', { enum: NETWORK, nullable: true })
  network?: NETWORK;

  @OneToMany(() => DepositEntity, (d) => d.paymentMethod)
  deposits?: DepositEntity[];

  @Column('boolean', { default: false, nullable: true })
  default?: boolean;
}
