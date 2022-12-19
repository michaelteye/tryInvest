import { CreateOtpDto } from 'src/modules/auth/dto/otp.dto';
import { RegisterUserInputDto } from 'src/modules/auth/dto/register-user.dto';
import { GENDER } from 'src/modules/enums/gender.enum';
import {
  DepositInputDto,
  NETWORK,
} from 'src/modules/transactions/dtos/deposit.dto';
import { TestClient } from './utils/test-client';
import { EntityManager } from 'typeorm';
import { TransactionEntity } from '../src/modules/transactions/entities/transaction.entity';
import { TRANSACTION_STATUS } from 'src/modules/enums/transaction.status';
import { TRANSACTION_TYPE } from '../src/modules/enums/transaction-type.enum';
import { AccountTransactionEntity } from '../src/modules/transactions/entities/account-transaction.entity';
import { AccountEntity } from '../src/modules/account/entities/account.entity';

describe('User (e2e)', () => {
  let testClient: TestClient;

  beforeAll(async () => {
    testClient = new TestClient();
    await testClient.init();
  });

  afterAll(async () => {
    await testClient.close();
  });

  enum TRANSACTION_CALLBACK_STATUS {
    PENDING = 'PENDING',
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
  }

  const callbackResponse = async (
    ref: string,
    status: TRANSACTION_CALLBACK_STATUS,
  ) => {
    return {
      transactionRef: ref,
      status: status,
      amount: '0.50',
      currency: 'GHS',
      phoneNumber: '233542853417',
      statusCode: '01',
      paymentMode: 'MTN',
      vendor: 'ITC',
    };
  };

  const sendCallBack = async (payload: any, options?: any) => {
    const opts: any = {};
    opts.payload = payload;
    if (options?.statusCode) opts.statusCode = options.statusCode;
    const callback = await testClient.httpRequest(
      'post',
      '/transactions/callback',
      opts,
    );
    return callback;
  };

  const registerUser = async (payload: any, options?: any) => {
    const opts: any = {};
    opts.payload = payload;
    if (options?.statusCode) opts.statusCode = options.statusCode;
    const register = await testClient.httpRequest(
      'post',
      '/users/signup',
      opts,
    );

    expect(register.token).toBeDefined();
    expect(register.refreshToken).toBeDefined();
    return register;
  };

  const createOtp = async (payload: CreateOtpDto) => {
    await testClient.httpRequest('post', '/otps', {
      payload,
      statusCode: 201,
    });
  };

  const userDeposit = async (deposit: DepositInputDto) => {
    const response = await testClient.httpRequest(
      'post',
      '/transactions/deposit',
      {
        payload: deposit,
      },
    );
    expect(response.reference).toBeDefined();
    expect(response.status).toBe('PENDING');
    return response;
  };

  it('User Withdrawal Test', async () => {
    // create user
    const registerPayload: RegisterUserInputDto = {
      firstName: 'Koby',
      lastName: 'Withdrawal',
      phone_number: '233542853421',
      password: 'good4Christ@',
      dateOfBirth: new Date('1920-01-01'),
      gender: GENDER.male,
      network: NETWORK.mtn,
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

    const userMe = await testClient.httpRequest('get', '/users/me');

    const depositPayload: DepositInputDto = {
      amount: 60.39,
      network: NETWORK.mtn,
    };
    const deposit = await userDeposit(depositPayload);

    // send success callback
    const callbackData = await callbackResponse(
      deposit.reference,
      TRANSACTION_CALLBACK_STATUS.SUCCESS,
    );
    await sendCallBack(callbackData);

    const srv = await testClient.app.get(EntityManager);
    const transaction = await srv.findOne(TransactionEntity, {
      where: { transactionId: deposit.reference },
    });
    expect(transaction).toBeDefined();
    expect(transaction.transactionStatus).toEqual(TRANSACTION_STATUS.success);

    // initiate withdrawal

    const withdrawalPayload: DepositInputDto = {
      amount: 20.5,
      network: NETWORK.mtn,
    };
    const withdrawal = await testClient.httpRequest(
      'post',
      '/transactions/withdrawal',
      {
        payload: withdrawalPayload,
      },
    );
    expect(withdrawal.reference).toBeDefined();
    expect(withdrawal.status).toBe('PENDING');
    const withdrawalTransaction = await srv.findOne(TransactionEntity, {
      where: { transactionId: withdrawal.reference },
    });

    const userInitialAccount = await srv.findOne(AccountEntity, {
      where: { userId: userMe.user.id, name: 'Primary' },
    });

    expect(Number(userInitialAccount.balance)).toEqual(39.89);

    expect(Number(withdrawalTransaction.amount)).toEqual(
      withdrawalPayload.amount,
    );

    expect(withdrawalTransaction.transactionStatus).toEqual(
      TRANSACTION_STATUS.pending,
    );
    expect(withdrawalTransaction.transactionType).toEqual(
      TRANSACTION_TYPE.DEBIT,
    );
    expect(withdrawalTransaction.transactionId).toEqual(withdrawal.reference);

    // send success callback
    const withdrawalCallbackData = await callbackResponse(
      withdrawalTransaction.transactionId,
      TRANSACTION_CALLBACK_STATUS.SUCCESS,
    );
    await sendCallBack(withdrawalCallbackData);

    const withdrawalTransaction2 = await srv.findOne(TransactionEntity, {
      where: { transactionId: withdrawal.reference },
    });
    expect(withdrawalTransaction2).toBeDefined();
    expect(withdrawalTransaction2.transactionType).toEqual(
      TRANSACTION_TYPE.DEBIT,
    );

    const withdrawalAccount = await srv.findOne(AccountEntity, {
      where: { userId: userMe.user.id, name: 'Primary' },
    });
    expect(withdrawalAccount).toBeDefined();
    expect(Number(withdrawalAccount.balance)).toEqual(39.89);

    const withdrawalAccountTransaction = await srv.findOne(
      AccountTransactionEntity,
      {
        where: { referenceId: withdrawal.reference },
      },
    );

    expect(withdrawalAccountTransaction).toBeDefined();
    expect(withdrawalAccountTransaction.accountId).toEqual(
      withdrawalAccount.id,
    );
    expect(withdrawalAccountTransaction.referenceId).toEqual(
      withdrawalTransaction2.transactionId,
    );
    expect(withdrawalAccountTransaction.transactionId).toEqual(
      withdrawalTransaction2.id,
    );
  });

  it('User Withdrawal With Failed Transaction', async () => {
    const loginPayload = {
      phone_number: '233542853421',
      password: 'good4Christ@',
    };

    //login;
    const login = await testClient.httpRequest('post', '/users/login', {
      payload: {
        phone: loginPayload.phone_number,
        password: loginPayload.password,
      },
    });
    testClient.defaultHeaders.Authorization = `Bearer ${login.token}`;

    const userMe = await testClient.httpRequest('get', '/users/me');

    const srv = await testClient.app.get(EntityManager);
    const userInitialAccount = await srv.findOne(AccountEntity, {
      where: { userId: userMe.user.id, name: 'Primary' },
    });

    expect(Number(userInitialAccount.balance)).toEqual(39.89);

    const withdrawalPayload: DepositInputDto = {
      amount: 5.5,
      network: NETWORK.mtn,
    };

    const withdrawal = await testClient.httpRequest(
      'post',
      '/transactions/withdrawal',
      {
        payload: withdrawalPayload,
      },
    );
    expect(withdrawal.reference).toBeDefined();
    expect(withdrawal.status).toBe('PENDING');

    // send failed callback

    const withdrawalCallbackData = await callbackResponse(
      withdrawal.reference,
      TRANSACTION_CALLBACK_STATUS.FAILED,
    );
    await sendCallBack(withdrawalCallbackData);

    const withdrawalTransaction = await srv.findOne(TransactionEntity, {
      where: { transactionId: withdrawal.reference },
    });

    expect(withdrawalTransaction).toBeDefined();
    expect(withdrawalTransaction.transactionStatus).toEqual(
      TRANSACTION_STATUS.failed,
    );
    expect(withdrawalTransaction.transactionType).toEqual(
      TRANSACTION_TYPE.DEBIT,
    );
    expect(withdrawalTransaction.transactionId).toEqual(withdrawal.reference);
    expect(Number(withdrawalTransaction.amount)).toEqual(
      Number(withdrawalPayload.amount),
    );

    const withdrawalAccount = await srv.findOne(AccountEntity, {
      where: { userId: userMe.user.id, name: 'Primary' },
    });
    expect(withdrawalAccount).toBeDefined();
    expect(Number(withdrawalAccount.balance)).toEqual(
      Number(userInitialAccount.balance),
    );
  });
});
