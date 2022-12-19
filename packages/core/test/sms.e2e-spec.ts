import { TestClient } from './utils/test-client';
import { SmsService } from '../src/modules/shared/services/sms.service';

describe('OTP (e2e)', () => {
  let testClient: TestClient;

  beforeAll(async () => {
    testClient = new TestClient();
    await testClient.init();
  });

  afterAll(async () => {
    await testClient.close();
  });

  it('Send OTP SMS', async () => {
    const smsService = testClient.app.get(SmsService);
    const response = await smsService.sendSms(
      'BEZO',
      '233542853417',
      'Your Bezo Otp Is 14412',
    );

    expect(response.code).toEqual('ok');
    expect(response.message).toEqual('Successfully Sent');
  });
});
