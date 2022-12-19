import { HttpException, Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { UserEntity } from 'src/modules/main/entities/user.entity';
import { EntityManager } from 'typeorm';
import { UserDto } from '../dto/user.dto';
import { AuthUserEntity } from '../entities/auth-user.entity';
import { PhoneIdentityEntity } from '../entities/phone-identity.entity';

@Injectable()
export class UserService {
  constructor(@InjectEntityManager('default') private em: EntityManager) {}

  // const user: AuthUserEntity | any = authUser;
  // user.account = authUser.user.accounts
  //   .filter((account) => account.name === 'Primary')
  //   .reduce((object, item) => Object.assign(object, item));

  // delete user.user.accounts;
  // return user;

  async verifyUserByUserName(userName: string): Promise<UserDto> {
    const getUser = await this.em.find(UserEntity, {
      where: { userName: userName },
      relations: ['accounts', 'files', 'authUser.phoneIdentity'],
    });
    if (getUser.length > 1) {
      throw new HttpException(
        `User with username ${userName}  has duplicate account`,
        400,
      );
    }
    if (getUser.length === 0)
      throw new HttpException(
        `User with username ${userName} does not exist`,
        400,
      );
    const user: UserEntity | any = getUser[0];
    user.account = user.accounts
      .filter((account) => account.name === 'Primary')
      .reduce((object, item) => Object.assign(object, item));
    user.phone = user.authUser.phoneIdentity.phone;
    delete user.accounts;
    delete user.authUser;
    console.log('user verification data', user);
    return user as unknown as UserDto;
  }

  async getUserByPhone(phone: string): Promise<UserEntity> {
    const userPhone = await this.em.findOne(PhoneIdentityEntity, {
      where: { phone: phone },
      relations: ['user', 'user.user.accounts', 'user.user.files'],
    });

    return userPhone.user.user;
  }
}
