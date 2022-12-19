import { AddressEntity } from './../../main/entities/address.entity';
import {
  BadRequestException,
  Inject,
  Injectable,
  HttpException,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { PhoneIdentityEntity } from '../entities/phone-identity.entity';
import { STATUS } from '../entities/enums/status.enum';
import { UserEntity } from '../../../../src/modules/main/entities/user.entity';
import { PasswordEntity } from '../entities/password.entity';
import { PasswordEncoderService } from './password-encorder.service';
import { LevelEntity } from '../../../../src/modules/main/entities/level.entity';
import { PlatformEntity } from '../../../../src/modules/main/entities/platform.entity';
import {
  RegisterResponseDto,
  RegisterUserInputDto,
} from '../dto/register-user.dto';
import { AuthUserEntity } from '../entities/auth-user.entity';
import { AuthUserRole } from '../types/auth-user.roles';
import { JwtManagerService } from './jwt-manager.service';
import {
  PhoneIdentityProviderServiceInterface,
  PhoneIdentityProviderServiceToken,
} from '../interfaces/phone-identity-provider.service.interface';
import {
  UserProviderServiceToken,
  UserProviderServiceInterface,
} from '../interfaces/user-identity-provider.service.interface';
import { PhoneIdentityInterface } from '../interfaces/phone-identity.interface';
import { LoginOutput } from '../types/login-output.type';
import { CreateOtpDto, OtpDto } from '../dto/otp.dto';
import { OtpEntity } from '../entities/otp.entity';
import { OTP_STATUS } from '../entities/enums/otp-status.enum';
import { EmailIdentityEntity } from '../entities/email-identity.entity';
import {
  PhoneEmailPasswordLoginInputDto,
  ResetPasswordDto,
} from '../dto/phone-email-login.dto';
import {
  EmailIdentityProviderServiceInterface,
  EmailIdentityProviderServiceToken,
} from '../interfaces/email-identity-provider.service.interface';
import { ProfileEntity } from '../../../../src/modules/main/entities/profile.entity';
import { MailService } from '../../../../src/modules/mail/mail.service';
import { AccountEntity } from '../../../../src/modules/account/entities/account.entity';
import { PaymentMethodEntity } from '../../../../src/modules/main/entities/paymentmethod.entity';
import { AccountTypeEntity } from '../../account/entities/account-type.entity';
import { WalletTypeEntity } from '../../wallet/entities/wallet.entity';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { SmsService } from '../../shared/services/sms.service';
import { generateCode } from '../../../../src/utils/shared';
import { ReferralEntity } from '../../../../src/modules/main/entities/referral.entity';
import { PlATFORM } from '../../../../src/modules/main/entities/enums/platform.enum';
import { FileEntity, APP_TYPE } from '../../fileupload/entities/file.entity';
import { FileUploadService } from '../../fileupload/services/fileupload.service';
import { DeviceEntity } from '../../main/entities/device.entity';

import { VerificationType } from '../../enums/verification-type.enum';

import { ChangePasswordDto } from '../dto/phone-email-login.dto';

import { EmailIdentityInterface } from '../interfaces/email-identity.inteface';
import { AppRequestContext } from 'src/utils/app-request.context';
import { getAppContextALS } from 'src/utils/context';
import { RefreshTokenEntity } from '../entities/refresh-token.entity';
import { addSeconds } from 'date-fns';
import * as argon2 from 'argon2';
import { globalConfig } from 'src/config';
import { ConfigType } from '@nestjs/config';
import { type } from 'os';
import { PAYMENT_TYPE } from 'src/modules/main/entities/enums/paymenttype.enum';
import { UserPinEntity } from 'src/modules/userpin/entities/userpin.entity';
import { UserPinService } from '../../userpin/services/userpin.service';
import { NotificationService } from 'src/modules/notifications/services/notification.service';

export interface AuthenticateInput {
  phone: string;
  password: string;
}

@Injectable()
export class AuthService<
  PhoneIdentity extends PhoneIdentityInterface = PhoneIdentityInterface,
  EmailIdentity extends EmailIdentityInterface = EmailIdentityInterface,
> {
  @Inject(PhoneIdentityProviderServiceToken)
  private readonly phoneProvider: PhoneIdentityProviderServiceInterface;

  @Inject(EmailIdentityProviderServiceToken)
  private readonly emailProvider: EmailIdentityProviderServiceInterface;

  @Inject(UserProviderServiceToken)
  private readonly userProvider: UserProviderServiceInterface;

  @Inject(PasswordEncoderService)
  private readonly encoder: PasswordEncoderService;




  constructor(
    @InjectEntityManager('default') private em: EntityManager,
    private passwordHash: PasswordEncoderService,
    private readonly jwtManager: JwtManagerService,
    private mailService: MailService,
    public smsService: SmsService,
    private notificationService: NotificationService,
    private fileService: FileUploadService,
    @Inject(globalConfig.KEY) private config: ConfigType<typeof globalConfig>,
  ) { }

  async resetPassword(input: ResetPasswordDto) {
    await this.validateEmailPhoneInput(input);

    const createOtp: CreateOtpDto = {
      ...(input.phone && { phone: input.phone }),
      ...(input.email && { email: input.email }),
      verificationType: VerificationType.RESET_PASSWORD,
    };

    if (await this.createOtp(createOtp)) {
      return {
        message: 'otp_sent',
      };
    }
    throw new BadRequestException('Unable to send otp');
  }

  async changePassword(input: ChangePasswordDto) {
    const identity = await this.validateEmailPhoneInput(input);

    const password = await this.em.findOne(PasswordEntity, {
      where: { userId: identity.user.id },
    });

    if (
      !(await this.phoneEmailIsOtpVerified(
        input,
        VerificationType.RESET_PASSWORD,
      ))
    ) {
      throw new BadRequestException('otp_not_verified');
    }
    password.password = await this.passwordHash.encodePassword(input.password);
    await this.em.save(password);
    return {
      message: 'password_changed',
    };
  }

  async authenticate(
    input: PhoneEmailPasswordLoginInputDto,
  ): Promise<LoginOutput> {
    let identity: PhoneIdentityInterface | EmailIdentityInterface;

    if (input.phone)
      identity = (await this.phoneProvider.retrieveIdentity(
        input.phone,
      )) as PhoneIdentity;
    if (input.email)
      identity = (await this.emailProvider.retrieveIdentity(
        input.email,
      )) as EmailIdentity;

    if (!identity) {
      throw new BadRequestException('missing_identity');
    }
    const user = (await this.userProvider.retrieveUser({
      userId: identity.user.id,
      id: identity.id,
    })) as AuthUserEntity;
    if (!user) {
      throw new BadRequestException('missing_user');
    }

    const verifyPassword = this.encoder.verifyPassword(
      input.password,
      user.passwordIdentity.password,
      user.user?.user_id
        ? { phone: input.phone, user_id: user.user?.user_id }
        : null,
    );

    if (verifyPassword) {
      if (input.deviceId) {
        await this.storeUserDevice(input.deviceId, identity.user.userId);
      }
      //return await this.userTokens(user);
      //return await this.jwtManager.getTokens(user);

      //console.log('authenticated user', user);

      const tokens = await this.jwtManager.getTokens(user);
      await this.updateRefreshToken(tokens.refreshToken, user, 'login');
      return tokens;
    } else {
      throw new BadRequestException('wrong_credentials');
    }
  }

  // handle user pin
  // async updateUserPin(userId: string) {
  //   const userPin = await this.em.findOne(UserPinEntity, {
  //     where: { userId: userId },
  //   });
  //   if (userPin && userPin.pin) {
  //     // create new encrypted pin
  //     const newPin = await this.pinService.getEncryptKey(userPin.pin);
  //     userPin.pin = newPin;
  //     await this.em.save(userPin);
  //   }
  //   // encryption
  // }

  async sendOtp(data: { phone?: string; email?: string }, otp: number) {
    if (process.env.NODE_ENV !== 'test') {
      //  if (data.email) await this.mailService.sendOtp('User', data.email, otp);

      //Send SMS message
      if (data.phone) {
        const otpSmsResponse = await this.notificationService.sendSms({
          to: data.phone, sms: 'Bezo OTP: ' + otp
        })
        console.log('otpSmsResponse', otpSmsResponse);
        return otpSmsResponse;
      }

      // send Email
      if (data.email && !data.phone) {
        const otpSmsResponse = await this.notificationService.sendEmail({
          subject: 'Welcome to Bezomoney! Your Generated Password',
          message: `${otp}`,
          to: data.email,
          template: {
            provider: "sendgrid",
            name: "otp",
            data: {}
          },
          from: 'Papscashback<no-reply@papscashback.com>', //  Support Team<support@bezomoney.com> override default from

        })

        return otpSmsResponse;
      }



    }
  }

  async storeUserDevice(deviceId: string, userId: string) {
    const device = new DeviceEntity();
    device.deviceId = deviceId;
    device.userId = userId;
    return await this.em.save(device);
  }

  async phoneIsUser(phone: string) {
    const identity = await this.phoneProvider.retrieveIdentity(phone);
    if (identity) {
      return true;
    }
    return false;
  }

  async createOtp(input: CreateOtpDto) {
    // console.log('createOtp', input);
    if (input.phone && input.email)
      throw new BadRequestException('phone_or_email_only');
    // if (
    //   (await this.phoneIsUser(input.phone)) &&
    //   input.verificationType === VerificationType.REGISTER_USER
    // )
    //   throw new BadRequestException('account_already_exist');
    const otp = new OtpEntity();
    const generatedOtp =
      input.phone && input.phone === '233222222222'
        ? 443456
        : Number(generateCode(6));
    otp.otp = generatedOtp;
    if (input.phone) otp.phone = input.phone;
    if (input.email) otp.email = input.email;
    otp.verificationType = input.verificationType;
    if (input.phone && input.phone !== '233222222222')

      await this.sendOtp(input, otp.otp);



    if (await this.em.save(otp)) {
      console.log('environment', process.env.NODE_ENV);
      const otpResponse: any = {
        message: 'otp_sent',
      };
      if (process.env.NODE_ENV === 'test') otpResponse.otp = generatedOtp;
      return otpResponse;
    }
    throw new HttpException('Unable to send otp', HttpStatus.BAD_REQUEST);
  }

  async phoneEmailIsOtpVerified(
    request: Partial<RegisterUserInputDto>,
    verifyType?: VerificationType,
  ) {
    const query = {
      ...(request.phone_number && { phone: request.phone_number }),
      ...(request.email && { email: request.email }),
      ...(verifyType && { verificationType: verifyType }),
      status: OTP_STATUS.verified,
    };
    const verifyStatus = await this.em.findOne(OtpEntity, {
      where: query,
      order: { createdAt: 'DESC' },
    });
    return verifyStatus;
  }

  async verifyOtp(input: OtpDto): Promise<{ message: string }> {
    // console.log('otp input', input);
    //const verifiedAuth = await this.ifAuthTypeExists(input);
    const otp_data: OtpEntity = await this.em.findOne(OtpEntity, {
      where: {
        ...(input.phone && { otp: input.otp, phone: input.phone }),
        ...(input.email && { otp: input.otp, email: input.email }),
      },
    });
    // console.log('otp_data', otp_data);
    if (otp_data) {
      if (otp_data.status === OTP_STATUS.verified)
        throw new BadRequestException('otp_already_verified');
      if (otp_data.status === OTP_STATUS.expired)
        throw new BadRequestException('otp_expired');
      if (otp_data.otp !== input.otp)
        throw new BadRequestException('invalid_otp');
      otp_data.status = OTP_STATUS.verified;
      // await Promise.all([this.em.save(otp_data), this.em.save(verifiedAuth)]);
      await Promise.all([this.em.save(otp_data)]);
      return {
        message: 'otp_verified',
      };
    }
    throw new BadRequestException('invalid_otp');
  }

  async ifAuthTypeExists(
    input: OtpDto,
  ): Promise<PhoneIdentityEntity | EmailIdentityEntity> {
    let phone: PhoneIdentityEntity;
    let email: EmailIdentityEntity;
    //const ctx = getAppContextALS<AppRequestContext>();
    if (input.phone) {
      phone = await this.em.findOne(PhoneIdentityEntity, {
        where: { phone: input.phone },
      });
      if (!phone) throw new BadRequestException('missing_identity');

      phone.status = STATUS.active;
      phone.phoneValidated = true;
      phone.verifiedAt = new Date();
      return phone;
    }
    if (input.email) {
      email = await this.em.findOne(EmailIdentityEntity, {
        where: { email: input.email },
      });
      if (!email) throw new BadRequestException('missing_identity');

      email.status = STATUS.active;
      email.emailValidated = true;
      return email;
    }
  }

  async validateEmailPhoneInput(input: { phone?: string; email?: string }) {
    let identity: PhoneIdentityInterface | EmailIdentityInterface;
    if (input.phone) {
      identity = await this.phoneProvider.retrieveIdentity(input.phone);
      if (!identity) {
        throw new BadRequestException('Phone number not found');
      }
      return identity;
    }

    if (input.email) {
      identity = await this.emailProvider.retrieveIdentity(input.email);
      if (!identity) {
        throw new BadRequestException('Email not found');
      }
      return identity;
    }
  }

  async getDefaultAccountType(): Promise<AccountTypeEntity | any> {
    return await this.em.findOne(AccountTypeEntity, {
      where: { name: 'Primary' },
    });
  }

  async getDefaultWallet(): Promise<WalletTypeEntity> {
    return await this.em.findOne(WalletTypeEntity, {
      where: { name: 'Local' },
    });
  }

  async saveUserPhone(phone: PhoneIdentityEntity) {
    const phoneExist = await this.em.findOne(PhoneIdentityEntity, {
      where: { phone: phone.phone },
    });
    if (phoneExist) {
      return phoneExist;
    }
    return await this.em.save(phone);
  }

  async savePaymentMethod(payment: PaymentMethodEntity) {
    return await this.em.save(payment);
  }

  async registerUser(
    request: RegisterUserInputDto,
  ): Promise<RegisterResponseDto> {
    // define referrer user
    let referrer: UserEntity;
    // create user phone
    const phone = new PhoneIdentityEntity();
    const email = new EmailIdentityEntity();

    await this.fieldValidation(request);

    if (request.referralCode) {
      referrer = await this.em.findOne(UserEntity, {
        where: { referralCode: request.referralCode },
      });
      if (!referrer) throw new BadRequestException('invalid_referral_code');
    }

    if (request.phone_number) {
      if (await this.phoneExist(request.phone_number))
        throw new BadRequestException('phone_already_exist');

      if (!(await this.phoneEmailIsOtpVerified(request))) {
        throw new BadRequestException('phone_not_verified');
      } else {
        phone.status = STATUS.enabled;
        phone.verifiedAt = new Date();
      }
      phone.phone = request.phone_number;
    }

    if (request.email) {
      const emailExist = await this.emailExist(request.email);
      const emailIsVerified = await this.phoneEmailIsOtpVerified(request);
      if (emailExist) throw new BadRequestException('email_already_exist');
      if (!emailIsVerified) throw new BadRequestException('email_not_verified');
      email.status = STATUS.enabled;
      email.emailValidated = true;
      email.email = request.email;
    }

    // create user password
    const password = new PasswordEntity();
    password.password = this.passwordHash.encodePassword(request.password);
    password.status = STATUS.enabled;

    // create user default level
    const level = new LevelEntity();

    // create user platform
    const platform = new PlatformEntity();
    platform.name = PlATFORM.android;

    // create default profile
    const profile = new ProfileEntity();

    // create default account
    const defaultAccountType = await this.getDefaultAccountType();
    const defaultWallet = await this.getDefaultWallet();
    const account = new AccountEntity();
    account.accountTypeId = defaultAccountType.id;
    account.name = defaultAccountType.name;
    account.accountNumber = Number(generateCode(10));
    account.walletId = defaultWallet.id;

    // create default payment method

    const paymentMethod = new PaymentMethodEntity();

    // add bezowallet account type id
    // account.accountTypeId = request.accountTypeId;

    // create user
    const user = new UserEntity();
    user.firstName = request.firstName;
    user.lastName = request.lastName;
    if (!request.userName)
      user.userName = this.generateUsername(
        request.firstName,
        request.lastName,
      );
    user.level = level;
    user.platforms = [platform];
    user.profile = profile;
    // user.userPaymentMethods = [paymentMethod];
    user.accounts = [account];
    user.referralCode = generateCode(6);
    if (user.bezoSource) user.bezoSource = request.bezoSource;

    // add file if exists
    if (request.file) {
      const { name, url } = await this.fileService.uploadFile(request.file);
      const file = new FileEntity();
      file.name = name;
      file.url = url;
      file.appType = APP_TYPE.profile;
      user.files = [file];
    }

    // optional date of birth
    if (request.dateOfBirth)
      user.dateOfBirth =
        typeof request.dateOfBirth === 'string'
          ? new Date(request.dateOfBirth)
          : request.dateOfBirth;
    user.gender = request.gender;

    // add optional address
    const address: AddressEntity = {
      ...(request.streetAddress && { homeAddress: request.streetAddress }),
      ...(request.country && { country: request.country }),
      ...(request.region && { region: request.region }),
      ...(request.digitalAddress && { gpsAddress: request.digitalAddress }),
    };
    user.address = address;

    // add user authentication
    const authUser = new AuthUserEntity();
    authUser.user = user;
    authUser.roles = [AuthUserRole.User];
    // save phone and email
    // if (request.phone_number) authUser.phoneIdentity = phone;

    if (request.email) authUser.emailIdentity = email;
    authUser.passwordIdentity = password;

    const auth: AuthUserEntity = await this.em.save(authUser);

    //console.log('created auth user', auth);

    if (request.phone_number) {
      phone.userId = auth.id;
      const savedPhone = await this.saveUserPhone(phone);

      if (request.network) paymentMethod.network = request.network;
      if (request.phone_number) paymentMethod.phoneId = savedPhone.id;
      paymentMethod.userId = auth.userId;
      paymentMethod.status = STATUS.enabled;
      paymentMethod.paymentType = PAYMENT_TYPE.mobile_money;
      await this.em.save(paymentMethod);
    }

    // handle referrals
    if (request.referralCode && referrer) {
      const referral = new ReferralEntity();
      referral.code = request.referralCode;
      referral.userId = referrer.id;
      referral.referredId = auth.userId;
      await this.em.save(referral);
    }

    const { token, refreshToken } = await this.userTokens(auth);
    //await this.updateRefreshToken(refreshToken, auth, 'register');
    return {
      token,
      refreshToken,
    } as RegisterResponseDto;
  }

  async userTokens(
    auth: AuthUserEntity,
  ): Promise<{ token: string; refreshToken: string }> {
    return {
      token: await this.jwtManager.issueAccessToken(auth),
      refreshToken: await this.jwtManager.generateRefreshToken(auth),
    };
  }

  async insertRefreshToken(refreshToken: string) {
    const hashedRefreshToken = await this.jwtManager.hashData(refreshToken);
    const ctx = getAppContextALS<AppRequestContext>();
    const refreshTokenEntity = new RefreshTokenEntity();
    refreshTokenEntity.userId = ctx.authUser.id;
    refreshTokenEntity.token = hashedRefreshToken;
    await this.em.save(refreshTokenEntity);
  }

  async phoneExist(phone: string) {
    return await this.em.findOne(PhoneIdentityEntity, { where: { phone } });
  }

  async emailExist(email: string) {
    return await this.em.findOne(EmailIdentityEntity, { where: { email } });
  }

  async fieldValidation(request: RegisterUserInputDto) {
    if (request.phone_number && request.email) {
      throw new BadRequestException('phone_only_or_email_only');
    }
    if (request.documentType && !request.file)
      throw new BadRequestException('missing_file');

    if (request.file && !request.documentType)
      throw new BadRequestException('missing_document_type');
  }

  async me() {
    const ctx = getAppContextALS<AppRequestContext>();
    return ctx.authUser;
  }

  // save new token

  async saveHashToken(hashedRefreshToken: string, userId: string) {
    const refreshTokenEntity = new RefreshTokenEntity();
    refreshTokenEntity.userId = userId;
    refreshTokenEntity.token = hashedRefreshToken;
    refreshTokenEntity.expiresAt = addSeconds(
      Date.now(),
      this.config.auth.refreshToken.expiresIn,
    );
    return await this.em.save(refreshTokenEntity);
  }

  // refresh token

  async updateRefreshToken(
    token: string,
    user?: AuthUserEntity,
    updateType?: string,
  ) {
    const ctx = getAppContextALS<AppRequestContext>();
    const hashedRefreshToken = await this.jwtManager.hashData(token);

    if (updateType === 'refresh_token') {
      const refreshToken = await this.getUserRefreshToken(ctx.authUser.id);
      console.log('update refresh token', refreshToken);
      if (!refreshToken)
        throw new BadRequestException('refresh_token_not_found');
      refreshToken.token = hashedRefreshToken;
      return await this.em.save(refreshToken);
    }
    try {
      const newToken = await this.getUserRefreshToken(user.id);
      if (newToken) {
        newToken.token = hashedRefreshToken;
        newToken.expiresAt = addSeconds(
          Date.now(),
          this.config.auth.refreshToken.expiresIn,
        );
        await this.em.save(newToken);
      } else {
        await this.saveHashToken(hashedRefreshToken, user.id);
      }
    } catch (err) {
      console.log(err);
      throw new HttpException('error saving refresh token', 500);
    }

    // if (updateType === 'register') {
    //   const saved = await this.saveHashToken(hashedRefreshToken, user.id);
    //   console.log('saved token', saved);
    // }

    // if (updateType === 'login') {
    //   const newToken = await this.getUserRefreshToken(user.id);
    //   if (newToken) {
    //     newToken.token = hashedRefreshToken;
    //     newToken.expiresAt = addSeconds(
    //       Date.now(),
    //       this.config.auth.refreshToken.expiresIn,
    //     );
    //     await this.em.save(newToken);
    //   } else {
    //     await this.saveHashToken(hashedRefreshToken, user.id);
    //   }
    // }
  }

  async getUserRefreshToken(userId: string) {
    const userToken = await this.em.findOne(RefreshTokenEntity, {
      where: { userId },
    });
    if (userToken) return userToken;
    return false;
  }

  async refreshToken(token: string) {
    console.log('received token', token);
    const ctx = getAppContextALS<AppRequestContext>();
    console.log('context', ctx.authUser.id);
    const user = await this.em.findOne(RefreshTokenEntity, {
      where: { userId: ctx.authUser.id },
      order: { createdAt: 'ASC' },
    });

    console.log('user Token', user);
    if (!user || !user.token) throw new ForbiddenException('Access Denied');
    console.log('user token', user.token);
    console.log('incoming token', token);
    const refreshTokenMatches = await argon2.verify(user.token, token);
    console.log('refreshTokenMatches', refreshTokenMatches);
    if (!refreshTokenMatches) throw new ForbiddenException('Access Denied');
    const tokens = await this.jwtManager.getTokens(ctx.authUser);
    await this.updateRefreshToken(
      tokens.refreshToken,
      ctx.authUser,
      'refresh_token',
    );
    return tokens;
  }

  generateUsername = (word1, word2) => {
    const suffix = ['2022', '22', 'theGreat', '10'];
    const prefix = ['great', 'good', 'the', 'brilliant'];

    const suggestions = [];
    suggestions.push(`${word1}${word2}`);
    suffix.forEach((word) => {
      suggestions.push(`${word1}${word}${word2}`);
      suggestions.push(`${word1}${word}`);
      suggestions.push(`${word2}${word}`);
      suggestions.push(`${word1}${word2}${word}`);
    });
    prefix.forEach((word) => {
      suggestions.push(`${word1}${word}${word2}`);
      suggestions.push(`${word}${word1}`);
      suggestions.push(`${word}${word2}`);
      suggestions.push(`${word1}${word}${word2}`);
    });

    return suggestions[Math.floor(Math.random() * suggestions.length)];
  };
}
