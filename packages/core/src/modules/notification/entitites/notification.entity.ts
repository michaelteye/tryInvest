import { Column, Entity } from 'typeorm';
import { AbstractEntity } from '../../main/entities/abstract-entity';
import { PlATFORM } from '../../main/entities/enums/platform.enum';

export enum NOTIFICATION_TYPE {
  deposit = 'deposit',
  withdrawal = 'withdrawal',
  transfer = 'transfer',
  payment = 'payment',
  account = 'account',
  interest = 'interest',
  loan = 'loan',
}

export enum NOTIFICATION_STATUS {
  read = 'read',
  not_read = 'not_read',
}
@Entity()
export class NotificationEntity extends AbstractEntity {
  @Column('text', { nullable: true })
  title?: string;

  @Column('text', { nullable: true })
  message?: string;

  @Column('text', { nullable: true })
  deviceId?: string;

  @Column('enum', { enum: PlATFORM, nullable: true })
  platform: PlATFORM;

  @Column('enum', { enum: NOTIFICATION_TYPE, nullable: true })
  type: NOTIFICATION_TYPE;

  @Column('enum', {
    enum: NOTIFICATION_STATUS,
    default: NOTIFICATION_STATUS.not_read,
  })
  status: NOTIFICATION_STATUS;
}
