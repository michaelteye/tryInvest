import { RegisterUserInputDto } from 'src/modules/auth/dto/register-user.dto';
import { GENDER } from 'src/modules/enums/gender.enum';
import { TestClient } from './utils/test-client';
import { SavingsGoalInputDto } from '../src/modules/savings-goal/dtos/savings-goal.dto';
import { FREQUENCY_TYPE } from '../src/modules/main/entities/enums/savingsfrequency.enum';
import { faker } from '@faker-js/faker';

describe('Savings Goal (e2e)', () => {
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

  const getWallets = async (): Promise<any[]> => {
    const wallet = await testClient.httpRequest('get', '/user/wallets', {
      statusCode: 200,
    });
    return wallet;
  };

  const accountTypes = async () => {
    const accountTypes = await testClient.httpRequest(
      'get',
      '/user/account-types',
    );
    expect(accountTypes.length).toEqual(2);
    expect(accountTypes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          name: 'Flexi Save',
        }),
        expect.objectContaining({
          id: expect.any(String),
          name: 'Bezo Lock',
        }),
      ]),
    );
    return accountTypes;
  };

  const savingsGoalTypes = async () => {
    const savingsGoalTypes = await testClient.httpRequest(
      'get',
      '/user/goal-types',
    );
    return savingsGoalTypes;
  };

  it('Create A savings Account', async () => {
    const registerPayload: RegisterUserInputDto = {
      firstName: 'Samuel',
      lastName: 'New',
      phone_number: '233542853471',
      password: 'SAdom4Christ@',
      dateOfBirth: new Date('1990-01-01'),
      gender: GENDER.male,
    };

    const registered = await registerUser(registerPayload);
    expect(registered.token).toBeDefined();
    expect(registered.refreshToken).toBeDefined();

    //login;
    const login = await testClient.httpRequest('post', '/users/login', {
      payload: {
        phone: registerPayload.phone_number,
        password: registerPayload.password,
      },
    });
    expect(login.token).toBeDefined();
    expect(login.refreshToken).toBeDefined();
    testClient.defaultHeaders.Authorization = `Bearer ${login.token}`;

    // get wallets

    // create savings account
    const savingsPayload: SavingsGoalInputDto = {
      name: 'My Savings',
      walletId: faker.helpers.arrayElement(
        (await getWallets()).map((w) => w.id),
      ),
      goalTypeId: faker.helpers.arrayElement(
        (await savingsGoalTypes()).map((w) => w.id),
      ),
      accountTypeId: faker.helpers.arrayElement(
        (await accountTypes()).map((w) => w.id),
      ),
      period: 0,
      frequency: FREQUENCY_TYPE.monthly,
      amount: 102000,
      startDate: new Date(),
    };

    const savingsGoal = await testClient.httpRequest(
      'post',
      '/users/saving-goals',
      {
        payload: savingsPayload,
      },
    );

    expect(savingsGoal.name).toEqual(savingsPayload.name);
    expect(savingsGoal.account.walletId).toEqual(savingsPayload.walletId);
    expect(savingsGoal.account.accountTypeId).toEqual(
      savingsPayload.accountTypeId,
    );
    expect(savingsGoal.account.balance).toEqual('0.00');
    expect(parseFloat(String(savingsGoal.amount))).toEqual(
      parseFloat(savingsPayload.amount.toString()),
    );
  });

  it('Get all Savings Goals', async () => {
    const loginPayload = {
      phone: '233541356631',
      password: 'joekwabena',
    };
    await testClient.login(loginPayload, {
      path: '/users/login',
    });

    const savingsGoals = await testClient.httpRequest(
      'get',
      '/user/goal-types',
    );
    expect(savingsGoals.length).toBeGreaterThan(0);
  });
});
