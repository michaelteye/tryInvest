import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { STATUS } from './enums/status.enum';
import { AuthUserEntity } from './auth-user.entity';

@Entity()
export class PasswordEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { unique: true })
  password: string;

  @OneToOne(() => AuthUserEntity, (i) => i.password, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: AuthUserEntity;

  @Column('uuid', { nullable: true })
  userId?: string;

  @Column('enum', { enum: STATUS, default: STATUS.disabled })
  status?: STATUS;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
