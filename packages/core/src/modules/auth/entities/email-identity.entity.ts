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
import { EmailIdentityInterface } from '../interfaces/email-identity.inteface';
import { AuthUserEntity } from './auth-user.entity';
import { STATUS } from './enums/status.enum';

@Entity()
export class EmailIdentityEntity implements EmailIdentityInterface {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { unique: false, nullable: true })
  email?: string;

  @Column('boolean', { default: false })
  emailValidated?: boolean;

  @Column('enum', { enum: STATUS, default: STATUS.disabled })
  status?: string;

  @OneToOne(() => AuthUserEntity, (o) => o.emailIdentity)
  @JoinColumn({ name: 'userId' })
  user: AuthUserEntity;

  @Column('uuid', { nullable: true })
  readonly userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
