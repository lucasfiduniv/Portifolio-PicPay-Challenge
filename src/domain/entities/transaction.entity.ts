import { ApiProperty } from '@nestjs/swagger';

export class Transaction {
  @ApiProperty({
    description: 'The unique identifier of the transaction',
    example: 1
  })
  id: number;

  @ApiProperty({
    description: 'The amount transferred',
    example: 100.00
  })
  value: number;

  @ApiProperty({
    description: 'The ID of the user who sent the money',
    example: 1
  })
  payerId: number;

  @ApiProperty({
    description: 'The ID of the user who received the money',
    example: 2
  })
  payeeId: number;

  @ApiProperty({
    description: 'The timestamp when the transaction was created',
    example: '2025-01-01T00:00:00.000Z'
  })
  createdAt: Date;

  constructor(partial: Partial<Transaction>) {
    Object.assign(this, partial);
  }
}