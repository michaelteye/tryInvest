import { Injectable, OnModuleInit } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { account, wallet } from '../data';
import { AccountTypeEntity } from '../../account/entities/account-type.entity';
import { WalletTypeEntity } from '../../wallet/entities/wallet.entity';
import { OtpEntity } from '../../auth/entities/otp.entity';
import { VerificationType } from 'src/modules/enums/verification-type.enum';
import { OTP_STATUS } from 'src/modules/auth/entities/enums/otp-status.enum';

@Injectable()
export class SeederService implements OnModuleInit {
  constructor(private em: EntityManager) {}
  async onModuleInit() {
    await this.seed();
  }

  async seed() {
    await Promise.all([
      this.seedAccountType(),
      this.seedWallet(),
      this.seedTestOtp(),
    ]);
  }

  async seedAccountType() {
    const data = account.accountTypeData;
    return data.map(async (item: AccountTypeEntity) => {
      await this.em
        .findOne(AccountTypeEntity, { where: { name: item.name } })
        .then(async (accountType) => {
          if (!accountType) {
            await this.em.save(AccountTypeEntity, item);
          }
        });
    });
  }

  async seedWallet() {
    const data = wallet.walletData;
    return data.map(async (item: WalletTypeEntity) => {
      await this.em
        .findOne(WalletTypeEntity, { where: { name: item.name } })
        .then(async (wallet) => {
          if (!wallet) {
            await this.em.save(WalletTypeEntity, item);
          }
        });
    });
  }

  async seedTestOtp() {
    await this.em
      .findOne(OtpEntity, { where: { otp: 443456 } })
      .then(async (wallet) => {
        if (!wallet) {
          const otp = new OtpEntity();
          otp.otp = 443456;
          otp.phone = '233222222222';
          otp.status = OTP_STATUS.verified;
          otp.verificationType = VerificationType.REGISTER_USER;
          await this.em.save(OtpEntity, otp);
        }
      });
  }
}
