import {
  UseGuards,
  Controller,
  UsePipes,
  ValidationPipe,
  Get,
  Req,
  Put,
  Post,
  Body,
  Param,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiResponse, ApiParam } from '@nestjs/swagger';
import {
  PinResponseDto,
  UserPinDto,
} from 'src/modules/userpin/dtos/user-pin.dto';
import { MixedAuthGuard } from 'src/modules/auth/guards/mixed-auth.guard';
import {
  RoleAuthGuard,
  RoleAuth,
} from 'src/modules/auth/guards/role-auth.guard';
import { AuthUserRole } from 'src/modules/auth/types/auth-user.roles';

@ApiBearerAuth('JWT')
@ApiTags('User Pin / Transaction Pin')
@UseGuards(MixedAuthGuard, RoleAuthGuard)
@Controller('users/notification')
@UsePipes(new ValidationPipe({ transform: true }))
export class NotificationController {
  constructor() {}

  // verify pin
  @RoleAuth(AuthUserRole.User)
  @Get('')
  @ApiResponse({
    status: 200,
  })
  async getNotifications(): Promise<any> {
    // return await this.service.verifyUserPin(pin);
  }

  // update user notification
}
