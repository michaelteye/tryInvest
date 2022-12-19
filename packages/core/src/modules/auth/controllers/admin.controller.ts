import {
  Controller,
  UsePipes,
  ValidationPipe,
  Post,
  Req,
  Body,
  BadRequestException,
  UseGuards,
  Get,
} from '@nestjs/common';
import { ApiTags, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EmailPasswordLoginInput } from '../dto/email-login.dto';
import { AuthUserEntity } from '../entities/auth-user.entity';
import { AdminIdentityService } from '../services/admin.service';
import { EmailIdentityEntity } from '../entities/email-identity.entity';
import { LoginOutput } from '../types/login-output.type';
import { JwtManagerService } from '../services/jwt-manager.service';
import { MixedAuthGuard } from '../guards/mixed-auth.guard';
import { RoleAuth, RoleAuthGuard } from '../guards/role-auth.guard';
import { AuthUserRole } from '../types/auth-user.roles';

@Controller()
@UsePipes(new ValidationPipe({ transform: true }))
@ApiBearerAuth('JWT')
@ApiTags('Admin Auth')
export class AdminAuthController {
  constructor(
    private readonly adminService: AdminIdentityService<
      AuthUserEntity,
      EmailIdentityEntity
    >,
    private readonly jwtManager: JwtManagerService,
  ) {}

  @Post('/admin/login')
  @ApiResponse({
    status: 200,
    description: 'The record has been successfully created.',
    type: LoginOutput,
  })
  async login(
    @Req() req: any,
    @Body() dto: EmailPasswordLoginInput,
  ): Promise<LoginOutput> {
    const { user, identity } = await this.adminService.authenticate(dto);
    // if (!identity.emailValidated) {
    //   throw new BadRequestException('email_not_validated');
    // }
    const result = new LoginOutput();
    result.token = await this.jwtManager.issueAccessToken(user);
    result.refreshToken = await this.jwtManager.generateRefreshToken(user);
    return result;
  }

  @UseGuards(MixedAuthGuard)
  @Get('/admin/me')
  @ApiResponse({
    status: 200,
  })
  async me(): Promise<any> {
    return this.adminService.me();
  }
}
