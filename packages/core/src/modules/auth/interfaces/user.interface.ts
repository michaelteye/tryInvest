import { PasswordEntity } from '../entities/password.entity';

export interface UserInterface {
  readonly id: string;
  readonly userId?: string;
  readonly password?: string;
  readonly passwordIdentity?: PasswordEntity;
}
