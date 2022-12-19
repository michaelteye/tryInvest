import { AbstractEntity } from '../../../../src/modules/main/entities/abstract-entity';
import { Entity, Column, OneToOne, OneToMany } from 'typeorm';
import { AccountEntity } from './account.entity';

// references bezo lock  and flexisave, default Primary wallet
// link account type to wallet

@Entity()
export class AccountTypeEntity extends AbstractEntity {
  @Column('varchar', { nullable: true })
  name?: string;

  @Column('integer', { nullable: true, default: 0 })
  withdrawalPeriod?: number;

  @Column('integer', { nullable: true, default: 0 })
  dailyLimit?: number;

  @Column('integer', { nullable: true, default: 0 })
  monthlyLimit?: number;

  @Column('integer', { nullable: true, default: 0 })
  withdrawalStartingCost?: number;

  @Column('integer', { nullable: true, default: 0 })
  withdrawalEndingCost?: number;

  // relationship with account entity

  @OneToMany(() => AccountEntity, (a) => a.accountType)
  accounts?: AccountEntity[];
}
