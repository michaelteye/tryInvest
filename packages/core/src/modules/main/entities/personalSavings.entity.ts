import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { AbstractEntity } from './abstract-entity';
import { DEPOSIT_PREFERENCE } from './enums/deposittype.enum';
import { FREQUENCY_TYPE } from './enums/savingsfrequency.enum';
import { TRANSACTIONSTATUS } from './enums/transactionstatus.enum';
import { UserAccountEntity } from './useraccount.entity';


@Entity()
export class PersonalSavingsEntity extends AbstractEntity {
  @ManyToOne(() => UserAccountEntity, (u) => u.personalSavings)
  @JoinColumn({ name: 'accountId' })
  account: UserAccountEntity;

  @Column('uuid')
  accountId: string;

  // add reference

  @Column('text')
  name: string;

  @Column('text')
  period: string;

  @Column('enum', { enum: FREQUENCY_TYPE })
  frequency: FREQUENCY_TYPE;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amount: number;

  @Column('boolean')
  lockSaving: boolean;

  @Column('text', { nullable: true })
  emoji?: string;

  @Column('enum', { enum: DEPOSIT_PREFERENCE })
  preference: DEPOSIT_PREFERENCE;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amountToRaise: number;

  // enquire about status

  @Column('enum', { enum: TRANSACTIONSTATUS })
  status: TRANSACTIONSTATUS;

  @Column('boolean', { default: false })
  isFavorite: boolean;
}
