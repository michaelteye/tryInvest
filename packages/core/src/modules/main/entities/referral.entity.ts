import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from './abstract-entity';
import { UserEntity } from './user.entity';

@Entity()
export class ReferralEntity extends AbstractEntity {
  @Column('text', { nullable: false })
  code: string;

  @ManyToOne(() => UserEntity, (user) => user.referrals)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column('uuid', { nullable: false })
  userId: string;

  @Column('uuid', { nullable: false })
  referredId: string;
}
