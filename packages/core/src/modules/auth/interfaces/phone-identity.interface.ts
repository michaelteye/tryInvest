import { UserEntity } from 'src/modules/main/entities/user.entity';
import { AuthUserEntity } from '../entities/auth-user.entity';

export interface PhoneIdentityInterface {
  id?: string;
  user: AuthUserEntity;
  phone: string;
}
