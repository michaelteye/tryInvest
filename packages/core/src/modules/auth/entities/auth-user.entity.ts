import { AdminEntity } from './../../../modules/main/entities/admin.entity';
import { UserEntity } from '../../../modules/main/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserInterface } from '../interfaces/user.interface';
import { AuthUserRole } from '../types/auth-user.roles';
import { ApiKeyIdentityEntity } from './api-key-identity.entity';
import { EmailIdentityEntity } from './email-identity.entity';
import { PhoneIdentityEntity } from './phone-identity.entity';
import { PasswordEntity } from './password.entity';
import { RefreshTokenEntity } from './refresh-token.entity';

@Entity()
export class AuthUserEntity implements UserInterface {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { nullable: false, array: true, default: '{}' })
  roles?: AuthUserRole[];

  @Column('text', { nullable: true })
  password?: string;

  @OneToOne(() => ApiKeyIdentityEntity, (o) => o.user)
  apiKeyIdentity?: ApiKeyIdentityEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Profiles
  @OneToOne(() => UserEntity, (user) => user.authUser, {
    cascade: true,
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;

  @Column('uuid', { nullable: true })
  userId?: string;

  @OneToOne(() => PasswordEntity, (p) => p.user, {
    cascade: true,
    nullable: false,
  })
  passwordIdentity: PasswordEntity;

  @OneToOne(() => AdminEntity, (user) => user.authUser, {
    cascade: true,
    nullable: true,
  })
  @JoinColumn({ name: 'adminId' })
  admin?: AdminEntity;

  @Column('string', { nullable: true })
  adminId?: string;

  @OneToOne(() => EmailIdentityEntity, (o) => o.user, { cascade: true })
  emailIdentity?: EmailIdentityEntity;

  @OneToOne(() => PhoneIdentityEntity, (o) => o.user, {
    cascade: true,
    nullable: true,
  })
  phoneIdentity?: PhoneIdentityEntity;

  @OneToOne(() => RefreshTokenEntity, (o) => o.user, {
    cascade: true,
    nullable: true,
  })
  token?: RefreshTokenEntity;
}
