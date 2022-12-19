import { LEVEL } from '../../../../src/modules/auth/entities/enums/level.enum';
import { Column, Entity, OneToMany, OneToOne } from 'typeorm';
import { AbstractEntity } from './abstract-entity';
import { UserEntity } from './user.entity';

@Entity()
export class LevelEntity extends AbstractEntity {
  @Column('enum', { enum: LEVEL, default: LEVEL.beginner })
  name?: LEVEL;

  @Column('int', { default: 0 })
  depositLimit: number;

  @OneToOne(() => UserEntity, (o) => o.level)
  user: UserEntity;
}
