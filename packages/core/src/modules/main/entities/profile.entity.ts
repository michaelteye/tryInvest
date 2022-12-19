import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { AbstractEntity } from './abstract-entity';
import { UserEntity } from './user.entity';

@Entity()
export class ProfileEntity extends AbstractEntity {
  @OneToOne(() => UserEntity, (u) => u.profile)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column('text')
  userId: string;
}
