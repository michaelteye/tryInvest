import { TestClient } from './utils/test-client';
import { CreateOtpDto, OtpDto } from '../src/modules/auth/dto/otp.dto';
import { VerificationType } from 'src/modules/enums/verification-type.enum';
import { AuthService } from '../src/modules/auth/services/auth.service';
import { EntityManager } from 'typeorm';
import { OtpEntity } from '../src/modules/auth/entities/otp.entity';
import { otpData } from './fixtures/otp.bundle';

describe('OTP (e2e)', () => {
  let testClient: TestClient;

  beforeAll(async () => {
    testClient = new TestClient();
    await testClient.init();
  });

  afterAll(async () => {
    await testClient.close();
  });

  const isEmail = (email) => {
    const regexEmail = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (email.match(regexEmail)) {
      return true;
    }
    return false;
  };

  const isPhone = (phone) => {
    return phone.match(/\d/g).length === 12;
  };

  type REGISTER = {
    email?: string;
    phone?: string;
    password: string;
  };

  it('should create phone otp', async () => {
    const otpData: CreateOtpDto = {
      phone: '233546546546',
      verificationType: VerificationType.REGISTER_USER,
    };

    const otpResponse = await testClient.httpRequest('post', '/otps', {
      payload: otpData,
    });

    console.log('otpResponse', otpResponse);

    const em = await testClient.app.get(EntityManager);
    const otp: Partial<OtpEntity> = await em.findOne('OtpEntity', {
      where: {
        phone: otpData.phone,
        verificationType: otpData.verificationType,
      },
    });
    expect(otp.phone).toEqual(otpData.phone);
    expect(otp.verificationType).toEqual(otpData.verificationType);
    expect(isPhone(otp.phone)).toBeTruthy();
    expect(otp.status).toEqual('not_verified');
  });

  it('should verify phone wrong otp', async () => {
    const data: OtpDto = {
      phone: '233542853410',
      otp: 123456,
      verificationType: VerificationType.REGISTER_USER,
    };

    await testClient.httpRequest('post', '/otps/verify', {
      payload: data,
      expectErrorCode: 400,
    });
    expect(testClient.responseBody.statusCode).toEqual(400);
    expect(testClient.responseBody.message).toEqual('invalid_otp');
    expect(testClient.responseBody.error).toEqual('Bad Request');
  });

  it('should verify phone valid otp', async () => {
    const data: OtpDto = {
      phone: '233542853413',
      otp: 1289,
      verificationType: VerificationType.REGISTER_USER,
    };

    const otpVerified = await testClient.httpRequest('post', '/otps/verify', {
      payload: data,
    });
    expect(otpVerified.message).toEqual('otp_verified');

    const em = await testClient.app.get(EntityManager);
    const otpVerify: Partial<OtpEntity> = await em.findOne('OtpEntity', {
      where: {
        phone: data.phone,
        otp: data.otp,
        verificationType: data.verificationType,
      },
    });
    expect(otpVerify.status).toEqual('verified');
    expect(otpVerify.phone).toEqual(data.phone);
    expect(otpVerify.otp).toEqual(data.otp);
  });

  it('Should throw error when creating otp with both email and phone', async () => {
    const data: OtpDto = {
      phone: '233542853413',
      email: 'patrick@gmail.com',
      otp: 1289,
      verificationType: VerificationType.REGISTER_USER,
    };

    const otpVerified = await testClient.httpRequest('post', '/otps', {
      payload: data,
    });

    expect(otpVerified.statusCode).toEqual(400);
    expect(otpVerified.message).toEqual('phone_or_email_only');
    expect(otpVerified.error).toEqual('Bad Request');
  });

  // it('Should throw error when phone number already exist', async () => {
  //   const data: CreateOtpDto = {
  //     phone: '233541356631',
  //     verificationType: VerificationType.REGISTER_USER,
  //   };

  //   const otpVerified = await testClient.httpRequest('post', '/otps', {
  //     payload: data,
  //   });
  //   expect(otpVerified.statusCode).toEqual(400);
  //   expect(otpVerified.message).toEqual('account_already_exist');
  //   expect(otpVerified.error).toEqual('Bad Request');
  // });
});
