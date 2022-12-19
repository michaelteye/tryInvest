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
import { uuid } from 'uuidv4';
import {
  PinVerificationResponseDto,
  UserPinDto,
} from '../src/modules/userpin/dtos/user-pin.dto';

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

  it('User Deposit to default wallet', async () => {
    // create user
    const registerPayload: RegisterUserInputDto = {
      firstName: 'Samuel',
      lastName: 'New',
      phone_number: '233542853471',
      password: 'SAdom4Christ@',
      dateOfBirth: new Date('1990-01-01'),
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

    // create user pin
    const userPinPayload: UserPinDto = {
      userPin: 7423,
    };

    const createdPin = await testClient.httpRequest('post', '/users/pin', {
      payload: userPinPayload,
    });

    expect(createdPin).toBeDefined();
    expect(createdPin.message).toEqual('pin_created');

    // verify pin

    const verifyPinResponse: PinVerificationResponseDto =
      await testClient.httpRequest(
        'get',
        `/users/pin/verify/${userPinPayload.userPin}`,
      );

    expect(verifyPinResponse).toBeDefined();
    expect(verifyPinResponse.message).toEqual('pin_verified');
    expect(verifyPinResponse.verificationId).toBeDefined();

    const depositPayload: DepositInputDto = {
      verificationId: verifyPinResponse.verificationId,
      amount: 20.39,
      network: NETWORK.mtn,
    };
    const deposit = await testClient.httpRequest(
      'post',
      '/transactions/deposit',
      {
        payload: depositPayload,
      },
    );
    console.log('deposit', deposit);
    expect(deposit.reference).toBeDefined();
    expect(deposit.status).toBe('PENDING');

    // transaction status
    const status: TransactionEntity = await testClient.httpRequest(
      'get',
      `/transactions/status/${deposit.reference}`,
    );
    expect(status.transactionStatus).toEqual(TRANSACTION_STATUS.pending);
    expect(status.transactionId).toEqual(deposit.reference);

    // success callback
    {
      const callbackData = await callbackResponse(
        deposit.reference,
        TRANSACTION_CALLBACK_STATUS.SUCCESS,
      );

      await testClient.httpRequest('post', '/transactions/callback', {
        payload: callbackData,
      });

      const srv = await testClient.app.get(EntityManager);
      const transaction = await srv.findOne(TransactionEntity, {
        where: { transactionId: deposit.reference },
      });
      expect(transaction).toBeDefined();
      expect(transaction.transactionStatus).toBe(TRANSACTION_STATUS.success);
      expect(Number(parseFloat(String(transaction.amount)))).toBe(
        Number(depositPayload.amount),
      );
      expect(transaction.transactionType).toEqual(TRANSACTION_TYPE.CREDIT);
      expect(transaction.transactionId).toEqual(deposit.reference);

      const userAccount = await srv.findOne(AccountEntity, {
        where: { userId: userMe.user.id, name: 'Primary' },
      });

      const accountTransaction = await srv.findOne(AccountTransactionEntity, {
        where: { referenceId: transaction.transactionId },
      });

      expect(accountTransaction).toBeDefined();
      expect(accountTransaction.transactionId).toEqual(transaction.id);
      expect(accountTransaction.accountId).toEqual(userAccount.id);
      expect(Number(accountTransaction.initialBalance)).toEqual(0);
      expect(accountTransaction.currentBalance).toEqual(userAccount.balance);
    }
  });

  it('User Deposit to default wallet With Failed Transaction', async () => {
    // create user
    const registerPayload: RegisterUserInputDto = {
      firstName: 'Samuel',
      lastName: 'Samuel Another',
      phone_number: '233542853418',
      password: 'SVdom4Christ@',
      dateOfBirth: new Date('1920-21-01'),
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

    // create user pin
    const userPinPayload: UserPinDto = {
      userPin: 7223,
    };

    const createdPin = await testClient.httpRequest('post', '/users/pin', {
      payload: userPinPayload,
    });

    expect(createdPin).toBeDefined();
    expect(createdPin.message).toEqual('pin_created');

    // verify pin

    const verifyPinResponse: PinVerificationResponseDto =
      await testClient.httpRequest(
        'get',
        `/users/pin/verify/${userPinPayload.userPin}`,
      );

    expect(verifyPinResponse).toBeDefined();
    expect(verifyPinResponse.message).toEqual('pin_verified');
    expect(verifyPinResponse.verificationId).toBeDefined();

    const depositPayload: DepositInputDto = {
      verificationId: verifyPinResponse.verificationId,
      amount: 50.0,
      network: NETWORK.mtn,
    };

    const deposit = await testClient.httpRequest(
      'post',
      '/transactions/deposit',
      {
        payload: depositPayload,
      },
    );
    expect(deposit.reference).toBeDefined();
    expect(deposit.status).toBe('PENDING');

    // get transaction status

    const status: TransactionEntity = await testClient.httpRequest(
      'get',
      `/transactions/status/${deposit.reference}`,
    );

    expect(status.transactionId).toEqual(deposit.reference);
    expect(status.transactionStatus).toEqual(TRANSACTION_STATUS.pending);

    // failed callback
    {
      const callbackData = await callbackResponse(
        deposit.reference,
        TRANSACTION_CALLBACK_STATUS.FAILED,
      );

      await testClient.httpRequest('post', '/transactions/callback', {
        payload: callbackData,
      });

      const srv = await testClient.app.get(EntityManager);
      const transaction = await srv.findOne(TransactionEntity, {
        where: { transactionId: deposit.reference },
      });
      expect(transaction).toBeDefined();
      expect(transaction.transactionStatus).toBe(TRANSACTION_STATUS.failed);
      expect(Number(parseFloat(String(transaction.amount)))).toBe(
        Number(depositPayload.amount),
      );
      expect(transaction.transactionType).toEqual(TRANSACTION_TYPE.CREDIT);
      expect(transaction.transactionId).toEqual(deposit.reference);

      const userAccount = await srv.findOne(AccountEntity, {
        where: { userId: userMe.user.id, name: 'Primary' },
      });

      expect(Number(userAccount.balance)).toEqual(0);

      const accountTransaction = await srv.findOne(AccountTransactionEntity, {
        where: { referenceId: transaction.transactionId },
      });

      expect(accountTransaction).toBeNull();
    }
  });
});
