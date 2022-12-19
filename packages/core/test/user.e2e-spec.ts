import { RegisterUserInputDto } from '../src/modules/auth/dto/register-user.dto';
import { TestClient } from './utils/test-client';
import {
  ChangePasswordDto,
  PhoneEmailPasswordLoginInputDto,
  ResetPasswordDto,
} from '../src/modules/auth/dto/phone-email-login.dto';
import { CreateOtpDto, OtpDto } from '../src/modules/auth/dto/otp.dto';
import { EntityManager } from 'typeorm';
import { AuthService } from '../src/modules/auth/services/auth.service';
import { AuthUserEntity } from '../src/modules/auth/entities/auth-user.entity';
import { GENDER } from '../src/modules/enums/gender.enum';
import { DOCUMENT_TYPE } from '../src/modules/main/entities/enums/document.enum';
import { FileEntity } from '../src/modules/fileupload/entities/file.entity';
import { FileUploadService } from '../src/modules/fileupload/services/fileupload.service';
import { NotificationService } from '../src/modules/notifications/services/notification.service';
import { DeviceEntity } from '../src/modules/main/entities/device.entity';
import { UserEntity } from '../src/modules/main/entities/user.entity';
import { AccountEntity } from '../src/modules/account/entities/account.entity';
import { OtpEntity } from 'src/modules/auth/entities/otp.entity';
import { VerificationType } from 'src/modules/enums/verification-type.enum';
import { STATUS } from '../src/modules/auth/entities/enums/status.enum';
import { OTP_STATUS } from '../src/modules/auth/entities/enums/otp-status.enum';
import { NETWORK } from 'src/modules/transactions/dtos/deposit.dto';
import { PhoneIdentityEntity } from '../src/modules/auth/entities/phone-identity.entity';

describe('User (e2e)', () => {
  let testClient: TestClient;

  beforeAll(async () => {
    testClient = new TestClient();
    await testClient.init();
  });

  afterAll(async () => {
    await testClient.close();
  });

  const registerUser = async (payload: any, options?: any) => {
    const opts: any = {};
    opts.payload = payload;
    if (options?.statusCode) opts.statusCode = options.statusCode;
    const register = await testClient.httpRequest(
      'post',
      '/users/signup',
      opts,
    );
    return register;
  };

  const createOtp = async (payload: CreateOtpDto) => {
    await testClient.httpRequest('post', '/otps', {
      payload,
      statusCode: 201,
    });
  };

  it('test phone verification function', async () => {
    const srv = testClient.app.get(AuthService);
    const verified1 = await srv.phoneEmailIsOtpVerified({
      phone_number: '233542987',
    });
    expect(verified1).toBeNull();

    const verified2 = await srv.phoneEmailIsOtpVerified({
      phone_number: '233542853416',
    });
    expect(verified2.status).toEqual('verified');
    expect(verified2.phone).toEqual('233542853416');
  });

  it('Register With Unverified Phone Number', async () => {
    const payload: RegisterUserInputDto = {
      firstName: 'Patrick',
      lastName: 'Oduro',
      phone_number: '233542853475',
      password: 'Adom4Christ@',
      dateOfBirth: new Date('1990-01-01'),
      gender: GENDER.male,
      referralCode: '153456',
    };
    const registered = await registerUser(payload, { statusCode: 400 });
    expect(registered.statusCode).toEqual(400);
    expect(registered.message).toEqual('phone_not_verified');
    expect(registered.error).toEqual('Bad Request');
  });

  it('/ (POST) Phone Registration Test', async () => {
    const payload: RegisterUserInputDto = {
      firstName: 'Patrick',
      lastName: 'Oduro',
      phone_number: '233542853418',
      password: 'Adom4Christ@',
      dateOfBirth: new Date('1990-01-01'),
      gender: GENDER.male,
      referralCode: '153456',
      network: NETWORK.mtn,
    };
    await registerUser(payload);

    const login = await testClient.httpRequest('post', '/users/login', {
      payload: {
        phone: payload.phone_number,
        password: payload.password,
      },
    });

    //console.log('login', login);
    expect(login.token).toBeDefined();
    expect(login.refreshToken).toBeDefined();
    testClient.defaultHeaders.Authorization = `Bearer ${login.token}`;

    const userMe = await testClient.httpRequest('get', '/users/me');
    expect(userMe.roles.length).toEqual(1);
    const em = await testClient.app.get(EntityManager);

    const user = await em.findOne(UserEntity, { where: { id: userMe.userId } });
    expect(user.firstName).toEqual(payload.firstName);
    expect(user.lastName).toEqual(payload.lastName);

    const userAccount = await em.findOne(AccountEntity, {
      where: { userId: user.id },
    });
    expect(userAccount.name).toEqual('Primary');
    expect(userAccount.accountTypeId).toEqual(
      'b3c5ec8c-cfaf-43cd-bf81-0a555c2a7dcc',
    );
  });

  it('/ (POST) Phone Registration With Unverified Phone Number', async () => {
    const payload: RegisterUserInputDto = {
      firstName: 'Kojo',
      lastName: 'Oduro',
      phone_number: '233542333017',
      password: 'Adom4Kojo@',
      dateOfBirth: new Date('1990-01-01'),
      gender: GENDER.female,
    };
    const registered = await registerUser(payload);
    expect(registered.statusCode).toEqual(400);
    expect(registered.message).toEqual('phone_not_verified');
    expect(registered.error).toEqual('Bad Request');
  });

  it('/ (POST) Phone Login Test', async () => {
    const payload: RegisterUserInputDto = {
      firstName: 'Kwabena',
      lastName: 'Oduro',
      phone_number: '233542853416',
      password: 'Kwabena4Christ@',
      dateOfBirth: new Date('1990-01-01'),
      gender: GENDER.male,
    };
    const registered = await registerUser(payload);
    expect(registered.token).toBeDefined();
    expect(registered.refreshToken).toBeDefined();
    // login user
    const loginData: Partial<PhoneEmailPasswordLoginInputDto> = {
      phone: payload.phone_number,
      password: payload.password,
      deviceId: '123456789',
    };
    const login = await testClient.httpRequest('post', '/users/login', {
      payload: loginData,
    });
    expect(login.token).toBeDefined();
    expect(login.refreshToken).toBeDefined();
    testClient.defaultHeaders.Authorization = `Bearer ${login.token}`;

    const userMe = await testClient.httpRequest('get', '/users/me');
    expect(userMe.userId).toBeDefined();

    const en = await testClient.app.get(EntityManager);
    const device = await en.findOne(DeviceEntity, {
      where: { userId: userMe.userId },
    });

    expect(device.userId).toEqual(userMe.userId);
    expect(device.deviceId).toEqual(loginData.deviceId);
  });

  it('/ (POST) Email Registration Test', async () => {
    const payload: RegisterUserInputDto = {
      firstName: 'Patrick',
      lastName: 'Oduro',
      email: 'email3@gmail.com',
      password: 'Adom4Christ@email',
      dateOfBirth: new Date('1990-01-01'),
      gender: GENDER.male,
    };
    await registerUser(payload);
  });

  it('/ (POST) Email Login Test', async () => {
    const payload: RegisterUserInputDto = {
      firstName: 'Kwabena',
      lastName: 'Oduro',
      email: 'email4@gmail.com',
      password: 'Kwabena4Christ@new2',
      dateOfBirth: new Date('1990-01-01'),
      gender: GENDER.male,
    };

    await registerUser(payload);

    // login user
    const loginData: { email: string; password: string } = {
      email: payload.email,
      password: payload.password,
    };
    await testClient.login(loginData, {
      path: '/users/login',
    });
    const userMe = await testClient.httpRequest('get', '/users/me');
    expect(userMe.userId).toBeDefined();

    // test validation status

    const em = testClient.app.get(EntityManager);
    const user = await em.findOne(AuthUserEntity, {
      where: { userId: userMe.userId },
      relations: ['emailIdentity'],
    });

    expect(user.emailIdentity.emailValidated).toBeTruthy();
    expect(user.emailIdentity.email).toEqual(loginData.email);
  });

  // register user with id upload
  it('/ (POST) Register User with Image Upload', async () => {
    const register: RegisterUserInputDto = {
      firstName: 'James',
      lastName: 'Oduro',
      phone_number: '233542853419',
      password: 'Kwabena4Christ@new2',
      dateOfBirth: '1990-01-01',
      gender: GENDER.male,
      documentType: DOCUMENT_TYPE.idPicture,
    };
    const registered = await testClient.httpRequest('post', '/users/signup', {
      fields: register,
      files: { file: { path: `${process.cwd()}/test/test-profile.png` } },
    });

    expect(registered.token).toBeDefined();
    expect(registered.refreshToken).toBeDefined();

    // clean up test file

    await testClient.login(
      {
        phone: register.phone_number,
        password: register.password,
      },
      {
        path: '/users/login',
      },
    );
    const me = await testClient.httpRequest('get', '/users/me');

    expect(me.user.files[0].appType).toEqual('profile');

    const en = await testClient.app.get(EntityManager);
    const file = await en.findOne(FileEntity, {
      where: { userId: me.userId },
      select: ['name'],
    });

    const srv = await testClient.app.get(FileUploadService);
    srv.deleteFile(file.name);
  });

  it('/ (POST) Test Notifications', async () => {
    const srv = await testClient.app.get(NotificationService);
    const userDevices = await srv.userDevices();
    expect(userDevices.length).toEqual(4);
  });

  it('/ (GET) Get Users Me Data', async () => {
    const register: RegisterUserInputDto = {
      firstName: 'Kames',
      lastName: 'Oduro',
      phone_number: '233542853421',
      password: 'Kwabena4Christ@new44',
      dateOfBirth: '1990-01-01',
      gender: GENDER.male,
      network: NETWORK.mtn,
    };
    await registerUser(register);
    await testClient.login(
      {
        phone: register.phone_number,
        password: register.password,
      },
      { path: '/users/login' },
    );

    const userMe = await testClient.httpRequest('get', '/users/me');
    // console.log('userMe', userMe);
    expect(userMe.user.pin).toBeNull();
    expect(userMe.userId).toBeDefined();
    expect(userMe.emailIdentity).toBeDefined();
    expect(userMe.phoneIdentity).toBeDefined();
    expect(userMe.phoneIdentity.paymentMethod.network).toEqual(NETWORK.mtn);
    expect(userMe.user).toBeDefined();
  });

  it('/ (GET) Change Password', async () => {
    const loginPayload = {
      phone: '233541356631',
      password: 'joekwabena',
    };
    await testClient.login(loginPayload, { path: '/users/login' });

    const resetPasswordData: ResetPasswordDto = {
      phone: loginPayload.phone,
    };

    const resetPassword = await testClient.httpRequest(
      'post',
      '/users/reset-password',
      {
        payload: resetPasswordData,
      },
    );
    expect(resetPassword.message).toEqual('otp_sent');

    const changePasswordData: ChangePasswordDto = {
      phone: loginPayload.phone,
      password: 'newpassword',
    };

    const changePasswordError = await testClient.httpRequest(
      'post',
      '/users/change-password',
      {
        payload: changePasswordData,
      },
    );
    expect(changePasswordError.message).toEqual('otp_not_verified');
    expect(changePasswordError.statusCode).toEqual(400);
    expect(changePasswordError.error).toEqual('Bad Request');

    const em = await testClient.app.get(EntityManager);
    const otp = await em.findOne(OtpEntity, {
      where: { phone: loginPayload.phone },
      order: { createdAt: 'DESC' },
    });
    expect(otp.phone).toEqual(loginPayload.phone);
    expect(otp.email).toBeNull();
    expect(otp.otp).toBeDefined();
    expect(otp.verificationType).toEqual(VerificationType.RESET_PASSWORD);
    expect(otp.status).toEqual(OTP_STATUS.not_verified);
    // verify otp
  });
});
