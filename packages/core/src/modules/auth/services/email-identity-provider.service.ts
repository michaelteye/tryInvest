import { Repository } from 'typeorm';
import { EmailIdentityProviderServiceInterface } from '../interfaces/email-identity-provider.service.interface';
import { EmailIdentityInterface } from '../interfaces/email-identity.inteface';
export class EmailIdentityServiceProvider
  implements EmailIdentityProviderServiceInterface {
  constructor(private repo: Repository<EmailIdentityInterface>) {}

  createIdentity(email: string): EmailIdentityInterface {
    return this.repo.create({ email });
  }

  async saveIdentity(
    identity: EmailIdentityInterface,
  ): Promise<EmailIdentityInterface> {
    return this.repo.save(identity);
  }

  async retrieveIdentity(email: string): Promise<EmailIdentityInterface> {
    return this.repo.findOne({ where: { email: email }, relations: ['user'] });
  }
}
