import { Injectable, Logger, Inject } from '@nestjs/common';
import { UserType } from '../../domain/enums/user-type.enum';
import { IUserRepository, USER_REPOSITORY } from '../../domain/interfaces/repositories/user-repository.interface';
import { ITransactionRepository, TRANSACTION_REPOSITORY } from '../../domain/interfaces/repositories/transaction-repository.interface';
import { IAuthorizationService, AUTHORIZATION_SERVICE } from '../../domain/interfaces/services/authorization-service.interface';
import { INotificationService, NOTIFICATION_SERVICE } from '../../domain/interfaces/services/notification-service.interface';
import { Transaction } from '../../domain/entities/transaction.entity';
import { TransferDto } from '../dtos/transfer.dto';
import { TransferException } from '../../shared/exceptions/transfer.exception';
import { InsufficientBalanceException } from '../../shared/exceptions/insufficient-balance.exception';
import { UserNotFoundException } from '../../shared/exceptions/user-not-found.exception';
import { UnauthorizedUserTypeException } from '../../shared/exceptions/unauthorized-user-type.exception';
import { ServiceUnavailableException } from '../../shared/exceptions/service-unavailable.exception';

@Injectable()
export class TransferUseCase {
  private readonly logger = new Logger(TransferUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY)
    private userRepository: IUserRepository,
    @Inject(TRANSACTION_REPOSITORY)
    private transactionRepository: ITransactionRepository,
    @Inject(AUTHORIZATION_SERVICE)
    private authorizationService: IAuthorizationService,
    @Inject(NOTIFICATION_SERVICE)
    private notificationService: INotificationService,
  ) {}

  async execute(transferDto: TransferDto): Promise<Transaction> {
    const { value, payer: payerId, payee: payeeId } = transferDto;

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

      // Perform the transfer
      payer.debit(value);
      payee.credit(value);

      // Save changes
      await this.userRepository.save(payer);
      await this.userRepository.save(payee);

      // Create and save the transaction
      const transaction = new Transaction({
        value,
        payerId,
        payeeId,
        createdAt: new Date(),
      });

      const savedTransaction = await this.transactionRepository.save(transaction);

      // Send notifications
      try {
        await this.notificationService.notify(
          payerId,
          `You sent $${value} to ${payee.fullName}`,
        );
        await this.notificationService.notify(
          payeeId,
          `You received $${value} from ${payer.fullName}`,
        );
      } catch (error) {
        // If notification fails, just log it but don't fail the transaction
        this.logger.error(
          `Failed to send notification: ${error.message}`,
          error.stack,
        );
      }

      return savedTransaction;
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
      throw new TransferException('Failed to process transfer');
    }
  }
}