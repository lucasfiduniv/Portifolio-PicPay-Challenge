import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserType } from '../../domain/enums/user-type.enum';
import { UserRepository } from '../../infrastructure/database/repositories/user.repository';
import { TransactionRepository } from '../../infrastructure/database/repositories/transaction.repository';
import { IAuthorizationService } from '../../domain/interfaces/services/authorization-service.interface';
import { INotificationService } from '../../domain/interfaces/services/notification-service.interface';
import { Transaction } from '../../domain/entities/transaction.entity';
import { TransferDto } from '../dtos/transfer.dto';
import { TransferException } from '../../shared/exceptions/transfer.exception';
import { InsufficientBalanceException } from '../../shared/exceptions/insufficient-balance.exception';
import { UserNotFoundException } from '../../shared/exceptions/user-not-found.exception';
import { UnauthorizedUserTypeException } from '../../shared/exceptions/unauthorized-user-type.exception';
import { ServiceUnavailableException } from '../../shared/exceptions/service-unavailable.exception';

@Injectable()
export class TransactionalTransferUseCase {
  private readonly logger = new Logger(TransactionalTransferUseCase.name);

  constructor(
    private dataSource: DataSource,
    private userRepository: UserRepository,
    private transactionRepository: TransactionRepository,
    private authorizationService: IAuthorizationService,
    private notificationService: INotificationService,
  ) {}

  async execute(transferDto: TransferDto): Promise<Transaction> {
    const { value, payer: payerId, payee: payeeId } = transferDto;

    // Get the users first to validate
    const payer = await this.userRepository.findById(payerId);
    if (!payer) {
      throw new UserNotFoundException('Payer not found');
    }

    const payee = await this.userRepository.findById(payeeId);
    if (!payee) {
      throw new UserNotFoundException('Payee not found');
    }

    if (!payer.canTransfer()) {
      throw new UnauthorizedUserTypeException('Merchant users cannot make transfers');
    }

    if (!payer.hasEnoughBalance(value)) {
      throw new InsufficientBalanceException('Insufficient balance');
    }

    try {
      const isAuthorized = await this.authorizationService.authorize();
      if (!isAuthorized) {
        throw new ServiceUnavailableException('Transaction not authorized');
      }

      // Start a transaction
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Perform the transfer
        payer.debit(value);
        payee.credit(value);

        // Save changes within the transaction
        await this.userRepository.saveWithTransaction(queryRunner, payer);
        await this.userRepository.saveWithTransaction(queryRunner, payee);

        // Create and save the transaction record
        const transaction = new Transaction({
          value,
          payerId,
          payeeId,
          createdAt: new Date(),
        });

        const savedTransaction = await this.transactionRepository.saveWithTransaction(
          queryRunner,
          transaction,
        );

        // Commit the transaction
        await queryRunner.commitTransaction();

        // Send notifications (non-blocking)
        this.sendNotifications(payerId, payeeId, value, payer.fullName, payee.fullName);

        return savedTransaction;
      } catch (error) {
        // Rollback the transaction in case of error
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        // Release the query runner
        await queryRunner.release();
      }
    } catch (error) {
      // Rethrow specific exceptions
      if (
        error instanceof UserNotFoundException ||
        error instanceof UnauthorizedUserTypeException ||
        error instanceof InsufficientBalanceException ||
        error instanceof ServiceUnavailableException
      ) {
        throw error;
      }

      // For other errors, throw a generic transfer exception
      this.logger.error(`Transfer error: ${error.message}`, error.stack);
      throw new TransferException('Failed to process transfer');
    }
  }

  private async sendNotifications(
    payerId: number,
    payeeId: number,
    value: number,
    payerName: string,
    payeeName: string,
  ): Promise<void> {
    try {
      await this.notificationService.notify(
        payerId,
        `You sent $${value} to ${payeeName}`,
      );
      await this.notificationService.notify(
        payeeId,
        `You received $${value} from ${payerName}`,
      );
    } catch (error) {
      // If notification fails, just log it but don't fail the transaction
      this.logger.error(
        `Failed to send notification: ${error.message}`,
        error.stack,
      );
    }
  }
}