import { IsNumber, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TransferDto {
  @ApiProperty({
    description: 'The amount to transfer',
    minimum: 0.01,
    example: 100.00
  })
  @IsNumber()
  @IsPositive()
  value: number;

  @ApiProperty({
    description: 'The ID of the user sending the money',
    example: 1
  })
  @IsNumber()
  payer: number;

  @ApiProperty({
    description: 'The ID of the user receiving the money',
    example: 2
  })
  @IsNumber()
  payee: number;
}