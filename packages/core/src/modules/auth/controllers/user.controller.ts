import {
  UseGuards,
  Controller,
  UsePipes,
  ValidationPipe,
  Get,
  Body,
  Post,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

import { EmailIdentityEntity } from '../entities/email-identity.entity';
import { MixedAuthGuard } from '../guards/mixed-auth.guard';
import { RoleAuthGuard, RoleAuth } from '../guards/role-auth.guard';
import { AuthUserRole } from '../types/auth-user.roles';
import { AuthService } from '../services/auth.service';
import { PhoneIdentityEntity } from '../entities/phone-identity.entity';
import { LoginOutput } from '../types/login-output.type';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { UserDto } from '../dto/user.dto';
import { UserService } from '../services/user.service';

@ApiBearerAuth('JWT')
@ApiTags('User Auth / User Onboarding')
@UseGuards(MixedAuthGuard, RoleAuthGuard)
@Controller()
@UsePipes(new ValidationPipe({ transform: true }))
export class UserController {
  constructor(
    private readonly authService: AuthService<
      PhoneIdentityEntity,
      EmailIdentityEntity
    >,
    private service: UserService,
  ) {}

  @RoleAuth(AuthUserRole.User)
  @Get('/users/me')
  @ApiResponse({
    status: 200,
  })
  async me(): Promise<any> {
    return this.authService.me();
  }

  @RoleAuth(AuthUserRole.User)
  @Post('/users/refresh_token')
  @ApiResponse({
    status: 200,
    type: LoginOutput,
  })
  async refreshToken(@Body() data: RefreshTokenDto): Promise<LoginOutput> {
    return this.authService.refreshToken(data.token);
  }

  @RoleAuth(AuthUserRole.User)
  @Get('/users/verify/:username')
  @ApiParam({ name: 'username', required: true, type: String })
  @ApiResponse({
    status: 201,
    type: UserDto,
  })
  async verify(@Param('username') params: any): Promise<UserDto> {
    return this.service.verifyUserByUserName(params);
  }
}
