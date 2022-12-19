import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationEntity } from './entitites/notification.entity';

@Module({
  imports: [TypeOrmModule.forFeature([NotificationEntity]), HttpModule],
  controllers: [],
  providers: [],
})
export class NotificationModule { }
