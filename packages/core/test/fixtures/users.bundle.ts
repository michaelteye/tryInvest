import { AuthUserEntity } from '../../src/modules/auth/entities/auth-user.entity';
import { PhoneIdentityEntity } from '../../src/modules/auth/entities/phone-identity.entity';
import { AuthUserRole } from '../../src/modules/auth/types/auth-user.roles';
import { UserEntity } from '../../src/modules/main/entities/user.entity';
import { fixture } from 'typeorm-fixture-builder';
import * as bcrypt from 'bcrypt';
import { EmailIdentityEntity } from '../../src/modules/auth/entities/email-identity.entity';
import { AdminEntity } from '../../src/modules/main/entities/admin.entity';
import { DeviceEntity } from '../../src/modules/main/entities/device.entity';
import { STATUS } from 'src/modules/auth/entities/enums/status.enum';
import { PasswordEntity } from '../../src/modules/auth/entities/password.entity';
import { PaymentMethodEntity } from '../../src/modules/main/entities/paymentmethod.entity';
import { PAYMENT_TYPE } from 'src/modules/main/entities/enums/paymenttype.enum';
import { PHONETYPE } from '../../src/modules/auth/entities/enums/phone-type';

export const userData: AuthUserEntity[] = [];

const users = [
  {
    id: 'b14c5bb5-384f-4b57-b87f-e4b6e24279a3',
    user: {
      firstName: 'Patrick',
      lastName: 'Ato',
      phone: '23354297363',
      email: 'patrick@gmail.com',
      referralCode: '123456',
      deviceId: '89270f5f-cdb9-4a43-a7a3-a725715ac040',
    },
    password: encodePassword('patrick'),
    roles: [AuthUserRole.SuperAdmin],
  },
  {
    id: '8e0ef4dc-c7f9-4823-9413-324a37eade6f',
    user: {
      firstName: 'Kwabena',
      lastName: 'James',
      phone: '23354134463',
      email: 'kwabena@gmail.com',
      referralCode: '153456',
      userDeviceId: '420ae9f1-1acd-4f37-9ee7-864630a36ea8',
    },
    password: encodePassword('kwabena'),
    roles: [AuthUserRole.User],
  },
  {
    id: '5f3bed78-012e-4502-8c83-0b49d09eb676',
    user: {
      firstName: 'Joe',
      lastName: 'James',
      phone: '233541356631',
      email: 'joe@gmail.com',
      referralCode: '123476',
      userDeviceId: '4502ec1e-2da6-490b-9ab3-951e6de4cf1c',
    },
    password: encodePassword('joekwabena'),
    roles: [AuthUserRole.User],
  },
];

for (const user of users) {
  userData.push(createUser(user));
}

function createUser(data: any) {
  const user = new UserEntity();
  user.firstName = data.user.firstName;
  user.lastName = data.user.lastName;
  user.referralCode = data.user.referralCode;
  //user.phone = fixture(PhoneIdentityEntity, { id: 'fb5c117b-cdfb-4803-9a03-af410bf3d93f', phone: data.user.phone });
  const device = new DeviceEntity();
  device.deviceId = data.user.deviceId;
  user.devices = [device];

  const phoneIdentity = new PhoneIdentityEntity();
  phoneIdentity.phone = data.user.phone;
  phoneIdentity.status = STATUS.enabled;
  phoneIdentity.verifiedAt = new Date();
  phoneIdentity.phoneType = PHONETYPE.transaction;

  const payment = new PaymentMethodEntity();
  payment.paymentType = PAYMENT_TYPE.mobile_money;

  phoneIdentity.paymentMethod = payment;

  // user.userPaymentMethods = [payment];

  const emailIdentity = new EmailIdentityEntity();
  emailIdentity.email = data.user.email;
  emailIdentity.emailValidated = true;

  const password = new PasswordEntity();
  password.password = data.password;

  const auth = new AuthUserEntity();
  auth.passwordIdentity = password;
  auth.roles = data.roles;
  auth.emailIdentity = emailIdentity;
  auth.phoneIdentity = phoneIdentity;

  if (data.roles.includes(AuthUserRole.SuperAdmin)) {
    const admin = new AdminEntity();
    auth.admin = admin;
  }

  auth.user = user;
  return fixture(AuthUserEntity, auth);
}

function encodePassword(password: string) {
  const rounds = process.env.NODE_ENV === 'test' ? 1 : 10;
  return bcrypt.hashSync(password, rounds);
}
