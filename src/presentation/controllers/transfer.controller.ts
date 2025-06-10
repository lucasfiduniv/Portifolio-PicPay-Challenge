import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TransferDto } from '../../application/dtos/transfer.dto';
import { TransferUseCase } from '../../application/use-cases/transfer.use-case';
import { Transaction } from '../../domain/entities/transaction.entity';

@ApiTags('transfers')
@Controller('transfer')
export class TransferController {
  constructor(private transferUseCase: TransferUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Transfer money between users' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The transfer has been successfully processed',
    type: Transaction
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input or insufficient balance'
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Unauthorized user type (merchant trying to transfer)'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found'
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'External authorization service unavailable'
  })
  async transfer(@Body() transferDto: TransferDto): Promise<Transaction> {
    return this.transferUseCase.execute(transferDto);
  }
}