import { Column, Entity } from 'typeorm';
import { AbstractEntity } from '../../main/entities/abstract-entity';

@Entity()
export class ErrorEntity extends AbstractEntity {
  @Column({
    type: 'jsonb',
    nullable: true,
    default: {},
  })
  error!: any;

  @Column('text', { nullable: true })
  migrationType?: string;

  @Column('text', { nullable: true })
  query?: string;

  @Column('text', { nullable: true })
  detail?: string;

  @Column('text', { nullable: true })
  table?: string;

  @Column({
    type: 'jsonb',
    nullable: true,
    default: {},
  })
  data!: any;
}
