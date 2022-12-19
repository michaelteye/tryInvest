import { UserEntity } from '../../../../src/modules/main/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../../src/modules/main/entities/abstract-entity';

export enum FILE_TYPE {
  video = 'video',
  document = 'document',
  image = 'image',
}

export enum APP_TYPE {
  profile = 'profile',
  product = 'product',
  kyc = 'kyc',
}

@Entity()
export class FileEntity extends AbstractEntity {
  @Column('text', { nullable: true })
  name?: string;

  @Column('text', { nullable: false })
  url: string;

  @Column('text', { nullable: true })
  idNumber?: string;

  @Column('enum', {
    nullable: false,
    enum: FILE_TYPE,
    default: FILE_TYPE.document,
  })
  type: FILE_TYPE;

  @Column('enum', { nullable: false, enum: APP_TYPE, default: APP_TYPE.kyc })
  appType: APP_TYPE;

  @ManyToOne(() => UserEntity, (u) => u.files)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column('uuid', { nullable: false })
  userId: string;
}
