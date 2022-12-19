import { Module } from '@nestjs/common';
import { SeederService } from './services/seeder.service';

@Module({
  providers: [SeederService],
})
export class SeederModule {}
