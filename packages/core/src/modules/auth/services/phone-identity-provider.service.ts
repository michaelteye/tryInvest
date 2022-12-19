import { Repository } from 'typeorm';
import { PhoneIdentityProviderServiceInterface } from '../interfaces/phone-identity-provider.service.interface';
import { PhoneIdentityInterface } from '../interfaces/phone-identity.interface';
export class PhoneIdentityServiceProvider
  implements PhoneIdentityProviderServiceInterface
{
  constructor(private repo: Repository<PhoneIdentityInterface>) {}

  createIdentity(phone: string): PhoneIdentityInterface {
    return this.repo.create({ phone });
  }

  async saveIdentity(
    identity: PhoneIdentityInterface,
  ): Promise<PhoneIdentityInterface> {
    return this.repo.save(identity);
  }

  async retrieveIdentity(phone: string): Promise<PhoneIdentityInterface> {
    //return this.repo.findOne({ where: { phone: phone }, relations: ['user'] });
    return this.repo.findOne({
      where: { phone: phone },
      relations: ['user'],
    });
  }
}
