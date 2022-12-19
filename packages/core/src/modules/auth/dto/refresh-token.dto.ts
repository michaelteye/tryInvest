import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'token',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  token: string;
}
