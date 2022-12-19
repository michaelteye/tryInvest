import { Console, Command } from 'nestjs-console';
import { AccountTypeEntity } from 'src/modules/account/entities/account-type.entity';
import { AccountEntity } from 'src/modules/account/entities/account.entity';
import { RegisterResponseDto } from 'src/modules/auth/dto/register-user.dto';
import { AuthUserEntity } from 'src/modules/auth/entities/auth-user.entity';
import { PasswordEntity } from 'src/modules/auth/entities/password.entity';
import { PhoneIdentityEntity } from 'src/modules/auth/entities/phone-identity.entity';
import { JwtManagerService } from 'src/modules/auth/services/jwt-manager.service';
import { PasswordEncoderService } from 'src/modules/auth/services/password-encorder.service';
import { AuthUserRole } from 'src/modules/auth/types/auth-user.roles';
import { GENDER } from 'src/modules/enums/gender.enum';
import { SOCIAL } from 'src/modules/enums/social.enum';
import { WalletTypeEntity } from 'src/modules/wallet/entities/wallet.entity';
import { generateCode } from 'src/utils/shared';
import { EntityManager } from 'typeorm';
import { AddressEntity } from '../entities/address.entity';
import { PlATFORM } from '../entities/enums/platform.enum';
import { STATUS } from '../entities/enums/status.enum';
import { LevelEntity } from '../entities/level.entity';
import { PaymentMethodEntity } from '../entities/paymentmethod.entity';
import { PlatformEntity } from '../entities/platform.entity';
import { ProfileEntity } from '../entities/profile.entity';
import { ReferralEntity } from '../entities/referral.entity';
import { UserEntity } from '../entities/user.entity';

@Console()
export class CreateUserCommand {
  constructor(
    private em: EntityManager,
    private passwordHash: PasswordEncoderService,
    private readonly jwtManager: JwtManagerService,
  ) {}

  @Command({
    command: 'create:user',
    options: [
      {
        flags: '--phone <phone>',
        required: true,
      },
      {
        flags: '--status <status>',
        required: false,
      },
    ],
  })
  async execute(opts) {
    try {
      return await this._execute(opts);
    } catch (e) {
      console.error(e);
      return 1;
    }
  }

  async _execute(opts: { phone: string; status: string }) {
    if (opts.status && opts.status === 'delete') {
      const phoneIdentity = await this.phoneExist(opts.phone);
      if (!phoneIdentity) {
        console.log(`Phone number ${opts.phone} not found`);
        return 0;
      }
      console.log('we are here to delete');
      const deleteUser = await this.em.delete(UserEntity, {
        id: phoneIdentity.user.userId,
      });
      console.log(`deleted phone number ${opts.phone}`, deleteUser);
      return 0;
    }
    if (!(await this.isPhone(opts.phone))) {
      console.error('Invalid phone number');
      return 0;
    }
    const phoneExist = await this.phoneExist(opts.phone);
    if (phoneExist) {
      const phoneUser = phoneExist.user;
      await this.printToken(phoneUser);
      return 0;
    }
    const phone = new PhoneIdentityEntity();

    phone.status = STATUS.enabled;
    phone.verifiedAt = new Date();
    phone.phone = opts.phone;

    // create user password
    const password = new PasswordEntity();
    password.password = this.passwordHash.encodePassword('test@pasW9rd');
    password.status = STATUS.enabled;

    // create user default level
    const level = new LevelEntity();

    // create user platform
    const platform = new PlatformEntity();
    platform.name = PlATFORM.android;

    // create default profile
    const profile = new ProfileEntity();

    // create default payment method

    const paymentMethod = new PaymentMethodEntity();

    // create default account
    const defaultAccountType = await this.getDefaultAccountType();
    const defaultWallet = await this.getDefaultWallet();
    const account = new AccountEntity();
    account.accountTypeId = defaultAccountType.id;
    account.name = defaultAccountType.name;
    account.accountNumber = Number(generateCode(10));
    account.walletId = defaultWallet.id;

    // add bezowallet account type id
    // account.accountTypeId = request.accountTypeId;

    // create user
    const user = new UserEntity();
    user.firstName = 'Patrick';
    user.lastName = 'Oduro';
    user.userName = 'patduro';
    user.level = level;
    user.platforms = [platform];
    user.profile = profile;
    user.userPaymentMethods = [paymentMethod];
    user.accounts = [account];
    user.referralCode = generateCode(6);
    user.bezoSource = SOCIAL.FACEBOOK;

    // optional date of birth

    user.dateOfBirth = new Date('1990-01-01');
    user.gender = GENDER.male;

    const address = new AddressEntity();
    address.homeAddress = 'Number 6 Avodire Road';
    address.country = 'Ghana';
    address.region = 'Greater Accra';
    address.gpsAddress = 'JW-2445450223';

    user.address = address;

    // add user authentication
    const authUser = new AuthUserEntity();
    authUser.user = user;
    authUser.roles = [AuthUserRole.User];
    authUser.phoneIdentity = phone;
    authUser.passwordIdentity = password;

    const auth: AuthUserEntity = await this.em.save(authUser);

    // handle referrals

    await this.printToken(auth);
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
}
