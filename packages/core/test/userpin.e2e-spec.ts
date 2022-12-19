import {
  UpdateUserPinDto,
  UserPinDto,
} from 'src/modules/userpin/dtos/user-pin.dto';
import { TestClient } from './utils/test-client';
import { CreateOtpDto, OtpDto } from '../src/modules/auth/dto/otp.dto';
import { VerificationType } from 'src/modules/enums/verification-type.enum';

describe('User (e2e)', () => {
  let testClient: TestClient;

  beforeAll(async () => {
    testClient = new TestClient();
    await testClient.init();
  });

  afterAll(async () => {
    await testClient.close();
  });

  const createOtp = async (phone: string, VerificationType) => {
    const otpData: CreateOtpDto = {
      phone: phone,
      verificationType: VerificationType,
    };

    const response = await testClient.httpRequest('post', '/otps', {
      payload: otpData,
    });
    return response;
  };

  const verifyUserPin = async (pin) => {
    const verifyPin = await testClient.httpRequest(
      'get',
      `/users/pin/verify/${pin}`,
    );
    expect(verifyPin.message).toEqual('pin_verified');
    expect(verifyPin.verificationId).toBeDefined();
    return verifyPin;
  };

  it('/ User Pin', async () => {
    const loginPayload = {
      phone: '233541356631',
      password: 'joekwabena',
    };
    await testClient.login(loginPayload, {
      path: '/users/login',
    });

    // create user pin
    const createUserPinPayload: UserPinDto = {
      userPin: 1234,
    };
    const userPinResponse = await testClient.httpRequest('post', '/users/pin', {
      payload: createUserPinPayload,
    });
    expect(userPinResponse.message).toEqual('pin_created');

    // // get user pin on authentication

    const userPinMe = await testClient.httpRequest('get', '/users/me');

    expect(userPinMe.user.pin.pin).toBeUndefined();

    // // verify user pin
    await verifyUserPin(createUserPinPayload.userPin);

    // verify pin with wrong pin
    const wrongPinData = {
      userPin: 1255,
    };

    const verifyWrongPin = await testClient.httpRequest(
      'get',
      `/users/pin/verify/${wrongPinData.userPin}`,
    );
    expect(verifyWrongPin.message).toEqual('invalid_pin');
    expect(verifyWrongPin.statusCode).toEqual(400);

    // create otp
    const otpCreationResponse = await createOtp(
      loginPayload.phone,
      VerificationType.CHANGE_PIN,
    );

    console.log('otpCreation', otpCreationResponse);

    // // update user pin
    const updateUserPinPayload: UpdateUserPinDto = {
      userPin: 1734,
      otp: otpCreationResponse.otp,
    };
    const updateUserPinResponse1 = await testClient.httpRequest(
      'put',
      '/users/pin',
      {
        payload: updateUserPinPayload,
      },
    );

    console.log('updateUserPinResponse', updateUserPinResponse1);
    // expect(updateUserPinResponse1.message).toEqual('phone_not_verified');
    // expect(updateUserPinResponse1.statusCode).toEqual(400);

    // // // verify phone

    // const verifyPhonePayload: OtpDto = {
    //   phone: '233541356631',
    //   otp: 8983,
    //   verificationType: VerificationType.CHANGE_PIN,
    // };

    // const verifyOtp = await testClient.httpRequest('post', '/otps/verify', {
    //   payload: verifyPhonePayload,
    // });

    // expect(verifyOtp.message).toEqual('otp_verified');

    // const updateUserPinPayload2: UpdateUserPinDto = {
    //   userPin: 1734,
    //   otp: otpCreationResponse.otp,
    // };
    // const updateUserPinResponse2 = await testClient.httpRequest(
    //   'put',
    //   '/users/pin',
    //   {
    //     payload: updateUserPinPayload2,
    //   },
    // );
    expect(updateUserPinResponse1.message).toEqual('pin_updated');

    // verify update pin

    await verifyUserPin(updateUserPinPayload.userPin);
  });
});
