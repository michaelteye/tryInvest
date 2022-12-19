import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  RelationId,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { STATUS } from './enums/status.enum';
import { PhoneIdentityInterface } from '../interfaces/phone-identity.interface';
import { AuthUserEntity } from './auth-user.entity';
import { PHONETYPE } from './enums/phone-type';
import { PaymentMethodEntity } from '../../main/entities/paymentmethod.entity';

@Entity()
export class PhoneIdentityEntity implements PhoneIdentityInterface {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @Column('text', { unique: true })
  phone: string;

  @Column('boolean', { default: false })
  phoneValidated?: boolean;

  @Column('text', { default: STATUS.disabled })
  status?: STATUS;

  @Column('enum', {
    enum: PHONETYPE,
    default: PHONETYPE.authentication,
    nullable: true,
  })
  phoneType?: PHONETYPE;

  @OneToOne(() => AuthUserEntity, (o) => o.phoneIdentity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: AuthUserEntity;

  @Column('uuid', { nullable: true })
  userId?: string;

  @OneToOne(() => PaymentMethodEntity, (p) => p.phone, { cascade: true })
  paymentMethod?: PaymentMethodEntity;

  @Column('date', { nullable: true })
  verifiedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
