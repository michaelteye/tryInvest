import { AuthUserEntity } from '../../../modules/auth/entities/auth-user.entity';
import { Entity, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AbstractEntity } from './abstract-entity';

@Entity()
export class AdminEntity extends AbstractEntity {
  @OneToOne(() => AuthUserEntity, (o) => o.admin)
  authUser: AuthUserEntity;
}
