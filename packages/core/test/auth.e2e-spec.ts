import { RegisterUserInputDto } from 'src/modules/auth/dto/register-user.dto';
import { GENDER } from 'src/modules/enums/gender.enum';
import { TestClient } from './utils/test-client';

describe('AppController (e2e)', () => {
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

  it('/ (POST) Refresh Token', async () => {
    const payload: RegisterUserInputDto = {
      firstName: 'Katrick',
      lastName: 'Kduro',
      phone_number: '233542853350',
      password: 'Adom4Christ@',
      dateOfBirth: new Date('1990-11-01'),
      gender: GENDER.male,
    };
    const registered = await registerUser(payload);
    expect(registered.token).toBeDefined();
    expect(registered.refreshToken).toBeDefined();

    const loginPayload = {
      phone: payload.phone_number,
      password: payload.password,
    };
    const login = await testClient.login(loginPayload, {
      path: '/users/login',
    });

    expect(login.token).toBeDefined();
    expect(login.refreshToken).toBeDefined();

    const token = await testClient.httpRequest('post', '/users/refresh_token', {
      payload: {
        token: login.refreshToken,
      },
    });
    expect(token.token).toBeDefined();
    expect(token.refreshToken).toBeDefined();
  });
});
