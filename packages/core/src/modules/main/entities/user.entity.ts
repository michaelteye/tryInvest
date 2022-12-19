import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { AuthUserEntity } from '../../auth/entities/auth-user.entity';
import { AbstractEntity } from './abstract-entity';
import { AddressEntity } from './address.entity';
import { DocumentEntity } from './document.entity';
import { LevelEntity } from './level.entity';
import { PlatformEntity } from './platform.entity';
import { ProfileEntity } from './profile.entity';
import { UserPinEntity } from '../../userpin/entities/userpin.entity';
import { PaymentMethodEntity } from './paymentmethod.entity';
import { AccountEntity } from '../../../../src/modules/account/entities/account.entity';
import { SavingsGoalEntity } from '../../../../src/modules/savings-goal/entities/savings-goal.entity';
import { DepositEntity } from '../../../../src/modules/transactions/entities/deposit.entity';
import { GENDER } from '../../enums/gender.enum';
import { ReferralEntity } from './referral.entity';
import { FileEntity } from '../../fileupload/entities/file.entity';
import { DeviceEntity } from './device.entity';
import { SOCIAL } from '../../enums/social.enum';
import { InvestmentEntity } from '../../investment/entities/invest.entity';
import { InterestEntity } from 'src/modules/interest/entities/interest.entity';
import { PinVerificationEntity } from '../../userpin/entities/pin-verification.entity';

@Entity()
export class UserEntity extends AbstractEntity {
  @Column('text', { nullable: true })
  user_id?: string;

  @Column('text', { nullable: true })
  firstName?: string;

  @Column('text', { nullable: true })
  lastName?: string;

  @Column('text', { nullable: true })
  otherName?: string;

  @Column('text', { nullable: true, unique: true })
  userName?: string;

  @Column('text', { nullable: true })
  referralCode?: string;

  @Column('text', { nullable: true })
  deviceId?: string;

  @Column('text', { nullable: true })
  country?: string;

  @Column('date', { nullable: true })
  dateOfBirth?: Date;

  @Column({
    name: 'gender',
    type: 'enum',
    enum: GENDER,
    enumName: 'gender',
    nullable: true,
  })
  gender: GENDER;

  @Column({
    name: 'social',
    type: 'enum',
    enum: SOCIAL,
    enumName: 'social',
    nullable: true,
  })
  bezoSource: SOCIAL;

  @Column('text', { nullable: true })
  occupation?: string;

  @OneToOne(() => AuthUserEntity, (auth) => auth.user)
  authUser: AuthUserEntity;

  @OneToOne(() => LevelEntity, (o) => o.user, { cascade: true })
  @JoinColumn({ name: 'levelId' })
  level?: LevelEntity;

  @Column('uuid', { nullable: true })
  levelId?: string;

  @OneToOne(() => AddressEntity, (a) => a.user, {
    cascade: true,
  })
  address?: AddressEntity;

  @OneToOne(() => UserPinEntity, (t) => t.user, { cascade: true })
  pin?: UserPinEntity;

  @OneToMany(() => DocumentEntity, (d) => d.user, { cascade: true })
  documents?: DocumentEntity[];

  @OneToMany(() => PaymentMethodEntity, (u) => u.user, { cascade: true })
  userPaymentMethods?: PaymentMethodEntity[];

  @OneToMany(() => PlatformEntity, (p) => p.user, { cascade: true })
  platforms?: PlatformEntity[];

  @OneToOne(() => ProfileEntity, (p) => p.user)
  profile?: ProfileEntity;

  @OneToMany(() => AccountEntity, (u) => u.user, { cascade: true })
  accounts: AccountEntity[];

  @OneToMany(() => SavingsGoalEntity, (u) => u.user, { cascade: true })
  savingsGoals: SavingsGoalEntity[];

  @OneToMany(() => DepositEntity, (u) => u.user)
  deposits: DepositEntity[];

  @OneToMany(() => ReferralEntity, (u) => u.user)
  referrals: ReferralEntity[];

  @OneToMany(() => FileEntity, (u) => u.user, {
    cascade: true,
  })
  files?: FileEntity[];

  @OneToMany(() => DeviceEntity, (d) => d.user, {
    cascade: true,
  })
  devices?: DeviceEntity[];

  @Column('boolean', { nullable: true, default: false })
  agreeToTerms?: boolean;

  @OneToMany(() => InvestmentEntity, (i) => i.user, {
    cascade: true,
  })
  investments?: InvestmentEntity[];

  @OneToMany(() => InterestEntity, (i) => i.user, {
    cascade: true,
  })
  interests?: InterestEntity[];

  @OneToMany(() => PinVerificationEntity, (p) => p.user)
  pinVerifications?: PinVerificationEntity[];
}
