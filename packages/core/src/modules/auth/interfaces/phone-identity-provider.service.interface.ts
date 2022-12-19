import { PhoneIdentityInterface } from './phone-identity.interface';

export const PhoneIdentityProviderServiceToken =
  'auth:PhoneIdentityProviderService';

export interface PhoneIdentityProviderServiceInterface {
  createIdentity(phone: string): PhoneIdentityInterface;
  saveIdentity(
    identity: PhoneIdentityInterface,
  ): Promise<PhoneIdentityInterface>;
  retrieveIdentity(phone: string): Promise<PhoneIdentityInterface>;
}
