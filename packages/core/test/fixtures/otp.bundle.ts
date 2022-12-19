import { OtpEntity } from '../../src/modules/auth/entities/otp.entity';
import { fixture } from 'typeorm-fixture-builder';
import { OTP_STATUS } from '../../src/modules/auth/entities/enums/otp-status.enum';
import { VerificationType } from '../../src/modules/enums/verification-type.enum';

export const otpData: OtpEntity[] = [];

const otps = [
  {
    id: '3108e34e-a232-4a79-bee9-8eece5015b61',
    email: 'email1@gmail.com',
    otp: 5211,
    verificationType: VerificationType.REGISTER_USER,
  },
  {
    id: 'eb5fbaba-5378-4a1e-a73e-19c1dd3da70b',
    email: 'email2@gmail.com',
    otp: 5212,
    verificationType: VerificationType.REGISTER_USER,
  },
  {
    id: 'f9d0c20e-9a32-4797-aaf2-b092f24f95af',
    email: 'email3@gmail.com',
    otp: 5213,
    status: OTP_STATUS.verified,
    verificationType: VerificationType.REGISTER_USER,
  },
  {
    id: '95699fef-e6f6-43e1-9a6a-1239264c90b7',
    email: 'email4@gmail.com',
    otp: 5214,
    status: OTP_STATUS.verified,
    verificationType: VerificationType.REGISTER_USER,
  },
  {
    id: '85cf3045-c11a-483f-b54a-8b777fb9afcd',
    email: 'email5@gmail.com',
    otp: 5215,
    status: OTP_STATUS.verified,
    verificationType: VerificationType.REGISTER_USER,
  },

  {
    id: 'b14c5bb5-384f-4b57-b87f-e4b6e24279a3',
    phone: '233542853410',
    otp: 128890,
    verificationType: VerificationType.REGISTER_USER,
  },
  {
    id: '8e0ef4dc-c7f9-4823-9413-324a37eade6f',
    phone: '233542853412',
    otp: 1387,
    verificationType: VerificationType.REGISTER_USER,
  },

  {
    id: 'd5e72eb6-2de2-4a9e-a3dc-dd1b414f8909',
    phone: '233542853413',
    otp: 1289,
    verificationType: VerificationType.REGISTER_USER,
  },
  {
    id: '1a2a158c-5310-4a6f-b0a1-482cb986efa2',
    phone: '233542853414',
    otp: 1389,
    verificationType: VerificationType.REGISTER_USER,
  },
  {
    id: '41348f0a-c58a-4213-a032-804f9d0dd0fa',
    phone: '233542853415',
    otp: 1489,
    verificationType: VerificationType.REGISTER_USER,
  },
  {
    id: '41348f0a-c58a-4213-a032-804f9d0dd0fa',
    phone: '233542853475',
    otp: 1459,
    verificationType: VerificationType.REGISTER_USER,
  },
  {
    id: 'a1841d3a-a0a0-4e01-9f48-3b9a191075e5',
    phone: '233542853416',
    otp: 1589,
    status: OTP_STATUS.verified,
    verificationType: VerificationType.REGISTER_USER,
  },
  {
    id: '4065c87f-1efb-4a42-b853-b7d367123538',
    phone: '233542853418',
    otp: 2789,
    status: OTP_STATUS.verified,
    verificationType: VerificationType.REGISTER_USER,
  },
  {
    id: 'f4ed3fc0-b5da-4d2e-9611-158062b9db1a',
    phone: '233542853419',
    otp: 2783,
    status: OTP_STATUS.verified,
    verificationType: VerificationType.REGISTER_USER,
  },

  // 233542853350

  {
    id: 'afcfa786-8688-4b84-8ff3-60bc62bbe01f',
    phone: '233542853350',
    otp: 2583,
    status: OTP_STATUS.verified,
    verificationType: VerificationType.REGISTER_USER,
  },

  {
    id: 'a5cc2638-5f1f-4a1e-8cd5-45e7de114e38',
    phone: '233542853471',
    otp: 2793,
    status: OTP_STATUS.verified,
    verificationType: VerificationType.REGISTER_USER,
  },
  // for account transactions
  {
    id: 'a78676bf-ffa7-4426-941d-82140eb065f4',
    phone: '233542853481',
    otp: 8793,
    status: OTP_STATUS.verified,
    verificationType: VerificationType.REGISTER_USER,
  },
  {
    id: '53ce0e84-8fb3-4332-a383-572bd5333980',
    phone: '233542443481',
    otp: 5893,
    status: OTP_STATUS.verified,
    verificationType: VerificationType.REGISTER_USER,
  },
  // for account transactions
  {
    id: 'cbb250e0-a15b-4064-9701-540af9dccc8d',
    phone: '233542853421',
    otp: 2983,
    status: OTP_STATUS.verified,
    verificationType: VerificationType.CHANGE_PIN,
  },
  {
    id: '2e732c75-546d-47e5-92c5-5eedd3e4f884',
    phone: '233541356631',
    otp: 8983,
    verificationType: VerificationType.CHANGE_PIN,
  },
];

for (const otp of otps) {
  otpData.push(createOtp(otp));
}

function createOtp(data: any) {
  const otp = new OtpEntity();
  otp.id = data.id;
  if (data.phone) otp.phone = data.phone;
  if (data.email) otp.email = data.email;
  otp.otp = data.otp;
  if (data.status) {
    otp.status = data.status;
  }
  otp.verificationType = data.verificationType;
  return fixture(OtpEntity, otp);
}
