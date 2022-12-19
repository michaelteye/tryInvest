import { AuthUserEntity } from '../../../modules/auth/entities/auth-user.entity';
import { EmailIdentityEntity } from '../../../modules/auth/entities/email-identity.entity';
import { PasswordEncoderService } from '../../../modules/auth/services/password-encorder.service';
import { AuthUserRole } from '../../../modules/auth/types/auth-user.roles';
import { EntityManager } from 'typeorm';
import { UserEntity } from '../entities/user.entity';
import { tabulateAuthUsers } from './utils';
import { AdminEntity } from '../entities/admin.entity';
import { Command, Console } from 'nestjs-console';

@Console()
export class CreateAdminCommand {
  constructor(
    private em: EntityManager,
    private passwordEncoder: PasswordEncoderService,
  ) {}

  @Command({
    command: 'create:admin',
    options: [
      {
        flags: '--email <email>',
        required: true,
      },
      {
        flags: '--password <password>',
        required: true,
      },
      {
        flags: '--displayName <displayName>',
        required: true,
      },
    ],
  })
  async execute(opts) {
    try {
      return await this._execute(opts);
    } catch (e) {
      console.error(e);
      return 1;
    }
  }

  async _execute(opts: {
    email: string;
    password: string;
    organizationSlug: string;
    displayName: string;
  }) {
    console.log(opts);
    // Create AuthUser
    const authUser = new AuthUserEntity();
    authUser.roles = [AuthUserRole.SuperAdmin];
    authUser.password = this.passwordEncoder.encodePassword(opts.password);

    const emailIdentity = new EmailIdentityEntity();
    emailIdentity.email = opts.email;
    emailIdentity.emailValidated = true;

    authUser.emailIdentity = emailIdentity;

    // create admin

    const admin = new AdminEntity();
    admin.authUser = authUser;

    // // Create user
    const user = new UserEntity();
    user.firstName = opts.displayName;
    authUser.user = user;

    await this.em.save([user, authUser, admin]);

    tabulateAuthUsers([authUser]);

    // return 0;
  }
}
