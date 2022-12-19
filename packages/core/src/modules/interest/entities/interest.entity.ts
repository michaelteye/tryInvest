import { Entity, OneToOne, JoinColumn, Column, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../main/entities/abstract-entity';
import { TransactionEntity } from '../../transactions/entities/transaction.entity';
import { AccountEntity } from '../../account/entities/account.entity';
import { UserEntity } from 'src/modules/main/entities/user.entity';

@Entity()
export class InterestEntity extends AbstractEntity {
  @OneToOne(() => TransactionEntity, (t) => t.interest)
  @JoinColumn({ name: 'transactionId' })
  transaction: TransactionEntity;

  @Column('bigint', { nullable: false })
  transactionId: number;

  @ManyToOne(() => AccountEntity, (a) => a.interests)
  @JoinColumn({ name: 'accountId' })
  account: AccountEntity;

  @Column('uuid', { nullable: false })
  accountId: string;

  @ManyToOne(() => UserEntity, (a) => a.interests)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column('uuid', { nullable: false })
  userId: string;

  @Column('text', { nullable: true })
  phone: string;

  @Column('text', { nullable: true })
  month: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    nullable: true,
  })
  amount?: number;
}

// {
//     "_id": "e2036627-26f6-4ded-ac8d-30a53e1a1216",
//     "transactionId": "685fc4e6-2dde-4bda-b08c-c92588b56782",
//     "account_id": "01f6f0a1-3a48-4ef9-ad24-ec80bd494dc7",
//     "interest": 0.75,
//     "amount": "0.24",
//     "user_id": "96d74bae1193bb9373c0443985675814459fb503",
//     "phoneNumber": "233553030155",
//     "month": "September",
//     "createdAt": {
//       "$date": {
//         "$numberLong": "1664552170840"
//       }
//     },
//     "updatedAt": {
//       "$date": {
//         "$numberLong": "1664552170840"
//       }
//     }
//   }
