import { Column, Entity, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../main/entities/abstract-entity';
import { STATUS } from '../../auth/entities/enums/status.enum';
import { InvestmentPackageEntity } from './investment-package.entity';

@Entity()
export class InvestmentTypeEntity extends AbstractEntity {
  @Column('text', { nullable: true })
  name?: string;

  @Column('text', { nullable: true })
  typeId?: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column('text', { nullable: true })
  title?: string;

  @Column('text', { nullable: true })
  brief?: string;

  @Column('enum', { enum: STATUS, default: STATUS.active })
  status?: STATUS;

  // @OneToMany(() => InvestmentPackageEntity, (a) => a.investmentType)
  // investmentPackages?: InvestmentPackageEntity[];
}

// {
//     "_id": "9805959d-e493-43c0-8007-aa3e9e155aa0",
//     "admin_id": "5154c487-c0a7-429f-bd06-efa46e7e73b6",
//     "name": "Bonds",
//     "description": "Government Bonds are investment vehicles issued by governments when they want to raise funds for projects. By buying the bond, you are giving the issuer funds to work with and pay you back an interest on a periodic basis. Bonds are highly secured and a good way to preserve your principal capital whilst investing and it enables you to have a steady stream of income.",
//     "createdAt": {
//       "$date": {
//         "$numberLong": "1656334415642"
//       }
//     },
//     "updatedAt": {
//       "$date": {
//         "$numberLong": "1656334415642"
//       }
//     },
//     "status": "active",
//     "title": "What are Bonds?",
//     "brief": "Government of Ghana Bonds"
//   }
