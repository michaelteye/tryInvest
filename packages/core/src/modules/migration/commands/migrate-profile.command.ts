import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Console, Command } from 'nestjs-console';
import { AccountTypeEntity } from 'src/modules/account/entities/account-type.entity';
import { RegisterResponseDto } from 'src/modules/auth/dto/register-user.dto';
import { AuthUserEntity } from 'src/modules/auth/entities/auth-user.entity';
import { PhoneIdentityEntity } from 'src/modules/auth/entities/phone-identity.entity';
import { JwtManagerService } from 'src/modules/auth/services/jwt-manager.service';
import { PasswordEncoderService } from 'src/modules/auth/services/password-encorder.service';
import { AddressEntity } from 'src/modules/main/entities/address.entity';

import { PaymentMethodEntity } from 'src/modules/main/entities/paymentmethod.entity';
import { UserEntity } from 'src/modules/main/entities/user.entity';
import { WalletTypeEntity } from 'src/modules/wallet/entities/wallet.entity';
import { EntityManager } from 'typeorm';
import { LevelEntity } from 'src/modules/main/entities/level.entity';
import { NETWORK } from '../../main/entities/enums/network.enum';
import {
  APP_TYPE,
  FileEntity,
  FILE_TYPE,
} from '../../fileupload/entities/file.entity';
import { Document } from 'bson';
import { EmailIdentityEntity } from '../../auth/entities/email-identity.entity';
import { STATUS } from 'src/modules/auth/entities/enums/status.enum';
import { PasswordEntity } from '../../auth/entities/password.entity';
import { ErrorEntity } from '../entitites/error.entity';
import { AuthUserRole } from 'src/modules/auth/types/auth-user.roles';
import { PAYMENT_TYPE } from 'src/modules/main/entities/enums/paymenttype.enum';
import { InjectEntityManager } from '@nestjs/typeorm';

@Console()
export class MigrateProfileCommand {
  private db: Connection;
  constructor(
    @InjectEntityManager('default') private em: EntityManager,
    private readonly jwtManager: JwtManagerService,
    @InjectConnection() private connection: Connection,
  ) {
    this.db = this.connection.useDb('bezosusuDBLive');
  }

  @Command({
    command: 'migrate:profiles',
    options: [
      {
        flags: '--type <type>',
        required: false,
      },
    ],
  })
  async execute(opts?: any) {
    try {
      return await this._execute(opts);
    } catch (e) {
      console.error(e);
      return 1;
    }
  }

  async migrateBezoUsers() {
    const user_profiles = await this.db
      .collection('user_profile')
      .aggregate()
      .match({ momo: { $in: this.bezoUsers() } })
      .lookup({
        from: 'users',
        localField: 'user_id',
        foreignField: '_id',
        as: 'phone',
      })
      .lookup({
        from: 'payment_methods',
        localField: 'user_id',
        foreignField: 'user_id',
        as: 'payment_method',
      })
      .lookup({
        from: 'user_passwords',
        localField: 'user_id',
        foreignField: 'user_id',
        as: 'password',
      })
      .toArray();

    const chunkSize = 1000;

    for (let i = 0; i < user_profiles.length; i += chunkSize) {
      const chunk = user_profiles.slice(i, i + chunkSize);
      await Promise.all([this.createUser(chunk)]);
    }
  }

  async defaultMigration() {
    const user_profiles = await this.db
      .collection('user_profile')
      .aggregate()
      .lookup({
        from: 'users',
        localField: 'user_id',
        foreignField: '_id',
        as: 'phone',
      })
      .lookup({
        from: 'user_passwords',
        localField: 'user_id',
        foreignField: 'user_id',
        as: 'password',
      })
      .lookup({
        from: 'payment_methods',
        localField: 'user_id',
        foreignField: 'user_id',
        as: 'payment_method',
      })
      .toArray();

    const chunkSize = 1000;

    for (let i = 0; i < user_profiles.length; i += chunkSize) {
      const chunk = user_profiles.slice(i, i + chunkSize);
      await Promise.all([this.createUser(chunk)]);
    }
  }

  async _execute(opts?: any) {
    console.log('ready to migrate', opts);
    if (opts && opts.type === 'bezousers') {
      return await this.migrateBezoUsers();
    }
    return await this.defaultMigration();
  }

  bezoUsers() {
    return [
      '233248990505',
      '233249338781',
      '233548480528',
      '233202675453',
      '233209360744',
      '233557452509',
      '233500025738',
      '233244883476',
      '233542853417',
      '233257102527',
      '233242403857',
      '233249735310',
      '233502158886',
      '233549791707',
      '233557241556',
      '233542101223',
      '233245216777',
      '233244219998',
      '233242339756',
      '233548171647',
      '233247029835',
      '233246583910',
      '233209935919',
      '233246114344',
      '233559233139',
      '233544808726',
      '233209141411',
    ];
  }

  async getUserByUserId(userId: string) {
    const user = await this.em.findOne(UserEntity, {
      where: { user_id: userId },
    });
    return user;
  }

  async createUser(profiles: any) {
    //console.log('profiles', profiles);
    // create user

    for (const data of profiles) {
      try {
        if (!(await this.getUserByUserId(data.user_id))) {
          const fullName = data.fullName ? data.fullName.split(' ') : [];
          const user = new UserEntity();
          if (fullName.length > 1) {
            user.firstName = fullName[0];
            user.lastName = fullName[1];
          }

          user.userName = data.userName;
          user.dateOfBirth = new Date('1990-01-01');
          if (data.referralCode) user.referralCode = data.referralCode;
          user.user_id = data.user_id;

          // level
          const level = new LevelEntity();
          level.name = data.level;

          // payment method
          const paymentMethod = new PaymentMethodEntity();
          paymentMethod.paymentType = PAYMENT_TYPE.mobile_money;
          if (data.payment_method.length > 0) {
            paymentMethod.network = this.getNetwork(
              data.payment_method[0].network,
            );
            paymentMethod.status = STATUS.active;
          }

          const files: FileEntity[] = [];

          if (data.idPicture) {
            const fileId = new FileEntity();
            fileId.url = `https://storage.googleapis.com/bezosusubucket/${data.idPicture}`;
            fileId.type = FILE_TYPE.image;
            fileId.appType = APP_TYPE.kyc;
            if (data.idNumber) fileId.idNumber = data.idNumber;
            files.push(fileId);
          }

          if (data.userPicture) {
            const fileUserId = new FileEntity();
            fileUserId.url = `https://storage.googleapis.com/bezosusubucket/${data.userPicture}`;
            fileUserId.appType = APP_TYPE.profile;
            fileUserId.type = FILE_TYPE.image;
            files.push(fileUserId);
          }

          const address = new AddressEntity();
          address.homeAddress = data.homeAddress;
          address.gpsAddress = data.gpsAddress;
          address.country = data.country;
          address.region = data.region;

          user.address = address;
          user.files = files;
          user.level = level;
          user.userPaymentMethods = [paymentMethod];
          user.agreeToTerms = true;

          // create phone identity

          const authUser = new AuthUserEntity();
          authUser.user = user;

          if (data.phone.length) {
            const phone = new PhoneIdentityEntity();
            //phone.phone = data.phone[0].phoneNumber;
            phone.phone = data.payment_method[0].phone;
            phone.phoneValidated = true;
            phone.verifiedAt = data.phone[0].createdAt
              ? new Date(data.phone[0].createdAt)
              : new Date();
            phone.status = STATUS.active;
            phone.paymentMethod = paymentMethod;
            authUser.phoneIdentity = phone;
          }

          if (
            data.password.length &&
            !(await this.ifPasswordExist(data.password[0].password))
          ) {
            const password = new PasswordEntity();
            password.password = data.password[0].password;
            password.status = STATUS.active;
            authUser.passwordIdentity = password;
          }

          if (data.email) {
            const email = new EmailIdentityEntity();
            email.email = data.email;
            email.status = STATUS.active;
            authUser.emailIdentity = email;
          }
          authUser.roles = [AuthUserRole.User];
          //console.log(authUser);
          await this.em.save(authUser);
        }
      } catch (error) {
        const errorData = {
          error,
          data,
        };
        await this.storeErrorData(errorData);
      }
    }
  }

  async storeErrorData(data: any) {
    const errorData = new ErrorEntity();
    errorData.data = data.data;
    errorData.migrationType = 'profiles';
    if (data.error.detail) errorData.detail = data.error.detail;
    if (data.error.table) errorData.table = data.error.table;
    if (data.error.query) errorData.query = data.error.query;
    // errorData.error = data.error;
    await this.em.save(errorData);
  }

  async getDefaultAccountType(): Promise<AccountTypeEntity> {
    return await this.em.findOne(AccountTypeEntity, {
      where: { name: 'Wallet' },
    });
  }

  async getDefaultWallet(): Promise<WalletTypeEntity> {
    return await this.em.findOne(WalletTypeEntity, {
      where: { name: 'Local' },
    });
  }

  async userTokens(
    auth: AuthUserEntity,
  ): Promise<{ token: string; refreshToken: string }> {
    return {
      token: await this.jwtManager.issueAccessToken(auth),
      refreshToken: await this.jwtManager.generateRefreshToken(auth),
    };
  }

  async isPhone(phone) {
    return phone.match(/\d/g).length === 12;
  }

  async phoneExist(phone) {
    return await this.em.findOne(PhoneIdentityEntity, {
      where: { phone },
      relations: ['user'],
    });
  }

  async printToken(auth: AuthUserEntity) {
    const { token, refreshToken } = await this.userTokens(auth);
    const response = {
      token,
      refreshToken,
    } as RegisterResponseDto;

    console.log(response);
  }

  getNetwork(incomingNetwork: string) {
    let network = incomingNetwork.toLowerCase();
    if (network === 'artltigo' || network === 'airteltigo') {
      network = NETWORK.airteltigo;
    }
    if ((<any>Object).values(NETWORK).includes(network.toLowerCase())) {
      return network.toLowerCase() as NETWORK;
    }
  }

  async ifPasswordExist(password: string) {
    return this.em.findOne(PasswordEntity, {
      where: { password },
    });
  }
}
