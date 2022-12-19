import { AppRequestContext } from '../../../utils/app-request.context';
import { getAppContextALS } from '../../../utils/context';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  EmailIdentityProviderServiceToken,
  EmailIdentityProviderServiceInterface,
} from '../interfaces/email-identity-provider.service.interface';
import { EmailIdentityInterface } from '../interfaces/email-identity.inteface';
import {
  UserProviderServiceToken,
  UserProviderServiceInterface,
} from '../interfaces/user-identity-provider.service.interface';

import { UserInterface } from '../interfaces/user.interface';
import { PasswordEncoderService } from './password-encorder.service';

export interface AuthenticateInput {
  email: string;
  password: string;
}

//export class EmailIdentityService<UserEntity extends UserInterface = UserInterface, Identity extends EmailIdentityInterface = EmailIdentityInterface> {

@Injectable()
export class AdminIdentityService<
  UserEntity extends UserInterface = UserInterface,
  EmailIdentity extends EmailIdentityInterface = EmailIdentityInterface,
> {
  @Inject(EmailIdentityProviderServiceToken)
  private readonly emailProvider: EmailIdentityProviderServiceInterface;

  @Inject(UserProviderServiceToken)
  private readonly userProvider: UserProviderServiceInterface;

  @Inject(PasswordEncoderService)
  private readonly encoder: PasswordEncoderService;

  async authenticate(
    input: AuthenticateInput,
  ): Promise<{ user: UserEntity; identity: EmailIdentity }> {
    const identity = (await this.emailProvider.retrieveIdentity(
      input.email,
    )) as EmailIdentity;
    if (!identity) {
      throw new BadRequestException('missing_identity');
    }
    console.log('identity', identity);
    const user = (await this.userProvider.retrieveUser(identity)) as UserEntity;
    console.log('user', user);
    if (!user) {
      throw new BadRequestException('missing_user');
    }
    if (
      this.encoder.verifyPassword(
        input.password,
        user.passwordIdentity.password,
      )
    ) {
      return { user: user, identity: identity };
    } else {
      throw new BadRequestException('wrong_credentials');
    }
  }

  async me() {
    const ctx = getAppContextALS<AppRequestContext>();
    return ctx.authUser;
  }
}
