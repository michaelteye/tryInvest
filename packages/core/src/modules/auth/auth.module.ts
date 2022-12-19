import { AdminAuthController } from './controllers/admin.controller';

import { Module } from '@nestjs/common';
import { ApiKeyIdentityEntity } from './entities/api-key-identity.entity';
import { MixedAuthGuard } from './guards/mixed-auth.guard';
import { RoleAuthGuard } from './guards/role-auth.guard';

import { ConfigType } from '@nestjs/config';
import { globalConfig } from '../../config';
import { JwtStrategy } from './guards/jwt.strategy';

import { EmailIdentityProviderServiceToken } from './interfaces/email-identity-provider.service.interface';
import { EmailIdentityServiceProvider } from './services/email-identity-provider.service';
import { UserProviderServiceToken } from './interfaces/user-identity-provider.service.interface';
import { UserIdentityProviderService } from './services/user-identity-provider.service';
import { PasswordEncoderService } from './services/password-encorder.service';
import { RefreshTokenEntity } from './entities/refresh-token.entity';
import { JwtManagerService } from './services/jwt-manager.service';
import { AdminIdentityService } from './services/admin.service';
import { AuthUserEntity } from './entities/auth-user.entity';

import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { EmailIdentityEntity } from './entities/email-identity.entity';
import { PhoneIdentityEntity } from './entities/phone-identity.entity';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { PhoneIdentityProviderServiceToken } from './interfaces/phone-identity-provider.service.interface';
import { PhoneIdentityServiceProvider } from './services/phone-identity-provider.service';
import { OtpEntity } from './entities/otp.entity';
import { OtpController } from './controllers/otp.controller';
import { SmsService } from '../shared/services/sms.service';
import { HttpModule } from '@nestjs/axios';
import { FileUploadModule } from '../fileupload/fileupload.module';
import { UserController } from './controllers/user.controller';
import { EncryptionService } from './services/encryption.service';
import { UserService } from './services/user.service';
import { CreateAdminCommand } from './commands/create-admin.command';
import { UserPinModule } from '../userpin/userpin.module';
import { NotificationService } from '../notifications/services/notification.service';

@Module({
  imports: [
    HttpModule,
    JwtModule.registerAsync({
      inject: [globalConfig.KEY],
      useFactory: async (cfg: ConfigType<typeof globalConfig>) => {
        return {
          secret: cfg.auth.jwt.secret,
          signOptions: {
            expiresIn: cfg.auth.accessToken.expiresIn,
          },
        };
      },
    }),
    TypeOrmModule.forFeature([
      ApiKeyIdentityEntity,
      RefreshTokenEntity,
      AuthUserEntity,
      EmailIdentityEntity,
      PhoneIdentityEntity,
      OtpEntity,
    ]),
    FileUploadModule,
  ],
  controllers: [
    AdminAuthController,
    AuthController,
    UserController,
    OtpController,
  ],
  providers: [
    // services
    AuthService,
    AdminIdentityService,
    JwtManagerService,
    PasswordEncoderService,
    SmsService,
    EncryptionService,
    UserService,
    // token providers

    RoleAuthGuard,
    MixedAuthGuard,
    NotificationService,

    // strategy
    JwtStrategy,

    // commands
    CreateAdminCommand,

    {
      provide: EmailIdentityProviderServiceToken,
      useFactory: (em: EntityManager) => {
        return new EmailIdentityServiceProvider(
          em.getRepository(EmailIdentityEntity),
        );
      },
      inject: [EntityManager],
    },
    {
      provide: UserProviderServiceToken,
      useFactory: (em: EntityManager) => {
        return new UserIdentityProviderService(
          em.getRepository(AuthUserEntity),
        );
      },
      inject: [EntityManager],
    },
    {
      provide: PhoneIdentityProviderServiceToken,
      useFactory: (em: EntityManager) => {
        return new PhoneIdentityServiceProvider(
          em.getRepository(PhoneIdentityEntity),
        );
      },
      inject: [EntityManager],
    },
  ],
  exports: [
    // services
    AuthService,
    PasswordEncoderService,
    EmailIdentityProviderServiceToken,
    UserProviderServiceToken,
    JwtManagerService,
    RoleAuthGuard,
    MixedAuthGuard,

    // strategy
    JwtStrategy,
  ],
})
export class AuthModule { }
