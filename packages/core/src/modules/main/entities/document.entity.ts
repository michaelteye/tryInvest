import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { AbstractEntity } from './abstract-entity';
import { UserEntity } from './user.entity';
import { DOCUMENT_TYPE } from './enums/document.enum';

@Entity()
export class DocumentEntity extends AbstractEntity {
  @Column('text', { nullable: true })
  name?: string;

  @Column('text', { nullable: true })
  type: DOCUMENT_TYPE;

  @Column('text', { nullable: true })
  url: string;

  @Column('text', { nullable: true })
  idNumber?: string;

  @Column('text', { nullable: true })
  drive?: string;

  @Column('text', { nullable: true })
  mimeType?: string;

  @ManyToOne(() => UserEntity, (user) => user.documents)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column('text')
  userId: string;
}
