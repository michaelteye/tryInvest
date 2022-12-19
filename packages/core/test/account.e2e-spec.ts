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
import { TransferToAccountDto } from '../src/modules/account/dtos/transfer-account.dto';
import { AccountService } from '../src/modules/account/services/account.service';
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

  it('User Transfer to Another Account', async () => {
    // create user
    const registerPayload: RegisterUserInputDto = {
      firstName: 'Tamuel',
      lastName: 'New',
      phone_number: '233542853481',
      password: 'TAdom4Christ@',
      dateOfBirth: new Date('1990-01-01'),
      gender: GENDER.male,
      network: NETWORK.mtn,
    };

    const registerPayload2: RegisterUserInputDto = {
      firstName: 'Vamuel',
      lastName: 'New',
      phone_number: '233542443481',
      password: 'VAdom4Christ@',
      dateOfBirth: new Date('1990-11-01'),
      gender: GENDER.male,
      network: NETWORK.mtn,
    };

    const registered = await registerUser(registerPayload);
    expect(registered.token).toBeDefined();
    expect(registered.refreshToken).toBeDefined();

    // create user 2
    const registered2 = await registerUser(registerPayload2);
    expect(registered2.token).toBeDefined();
    expect(registered2.refreshToken).toBeDefined();

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
      userPin: 9423,
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
      amount: 50,
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

    {
      // transfer to user 2
      // get user 2 account
      //login;
      const user2Login = await testClient.httpRequest('post', '/users/login', {
        payload: {
          phone: registerPayload2.phone_number,
          password: registerPayload2.password,
        },
      });
      expect(user2Login.token).toBeDefined();
      expect(user2Login.refreshToken).toBeDefined();
      testClient.defaultHeaders.Authorization = `Bearer ${user2Login.token}`;

      const user2Me = await testClient.httpRequest('get', '/users/me');
      const user2UserName = user2Me.user.userName;

      // get user 2 data
      const user2data = await testClient.httpRequest(
        'get',
        `/users/verify/${user2UserName}`,
      );

      console.log('user2data', user2data);
      expect(user2data.account).toBeDefined();
      expect(user2data.userName).toEqual(user2UserName);

      const user2Account = user2data.account;

      const newLogin = await testClient.httpRequest('post', '/users/login', {
        payload: {
          phone: registerPayload.phone_number,
          password: registerPayload.password,
        },
      });

      testClient.defaultHeaders.Authorization = `Bearer ${newLogin.token}`;

      const verifyPinResponse2: PinVerificationResponseDto =
        await testClient.httpRequest(
          'get',
          `/users/pin/verify/${userPinPayload.userPin}`,
        );

      expect(verifyPinResponse2).toBeDefined();
      expect(verifyPinResponse2.message).toEqual('pin_verified');
      expect(verifyPinResponse2.verificationId).toBeDefined();

      //   // initiate transfer
      const transfer: TransferToAccountDto = {
        transferAccountId: user2Account.id,
        amount: 10,
        verificationId: verifyPinResponse2.verificationId,
      };

      await testClient.httpRequest('post', '/accounts/user/transfer', {
        payload: transfer,
      });

      const em = await testClient.app.get(EntityManager);
      const transferredToAccount = await em.findOne(AccountEntity, {
        where: { id: user2Account.id },
      });

      expect(Number(transferredToAccount.balance)).toEqual(
        Number(parseFloat('10')),
      );
      const transfereeAccount = await em.findOne(AccountEntity, {
        where: { userId: userMe.user.id, name: 'Primary' },
      });
      expect(Number(transfereeAccount.balance)).toEqual(Number('40'));
    }
  });

  // handle transfer to another account
});
