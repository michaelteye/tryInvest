import { Entity, Column } from 'typeorm';
import { VerificationType } from '../../enums/verification-type.enum';
import { AbstractEntity } from '../../main/entities/abstract-entity';
import { OTP_STATUS } from './enums/otp-status.enum';

@Entity()
export class OtpEntity extends AbstractEntity {
  @Column('text', { nullable: true })
  phone?: string;

  @Column('text', { nullable: true })
  email?: string;

  @Column('int', { nullable: false })
  otp?: number;

  @Column('enum', { enum: OTP_STATUS, default: OTP_STATUS.not_verified })
  status: OTP_STATUS;

  @Column('enum', { enum: VerificationType })
  verificationType: VerificationType;
}
