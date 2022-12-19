import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserPinEntity } from './entities/userpin.entity';
import { UserPinService } from './services/userpin.service';
//import { AuthModule } from '../auth/auth.module';
import { UserPinController } from './controllers/userpin.controller';
import { HttpModule } from '@nestjs/axios';
import { SharedModule } from '../shared/shared.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([UserPinEntity]),
    HttpModule,
    SharedModule,
  ],
  controllers: [UserPinController],
  providers: [UserPinService],
  exports: [UserPinService],
})
export class UserPinModule {}
