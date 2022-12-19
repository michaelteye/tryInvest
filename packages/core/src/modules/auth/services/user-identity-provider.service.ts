import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { BaseIdentityInterface } from '../interfaces/base-identity.interface';
import { UserProviderServiceInterface } from '../interfaces/user-identity-provider.service.interface';
import { UserInterface } from '../interfaces/user.interface';

@Injectable()
export class UserIdentityProviderService
  implements UserProviderServiceInterface
{
  constructor(private repo: Repository<UserInterface>) {}

  retrieveUser(identity: BaseIdentityInterface): Promise<UserInterface> {
    // TODO Handle one to one situations, where the identity might not have the user property (as it is on the user side!)
    return this.repo.findOne({
      where: { id: identity.userId },
      relations: ['passwordIdentity', 'user'],
    });
  }
}
