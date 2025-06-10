import { Test } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { TransferUseCase } from '../../src/application/use-cases/transfer.use-case';
import { User } from '../../src/domain/entities/user.entity';
import { UserType } from '../../src/domain/enums/user-type.enum';
import { TransferDto } from '../../src/application/dtos/transfer.dto';
import { USER_REPOSITORY, IUserRepository } from '../../src/domain/interfaces/repositories/user-repository.interface';
import { TRANSACTION_REPOSITORY, ITransactionRepository } from '../../src/domain/interfaces/repositories/transaction-repository.interface';
import { AUTHORIZATION_SERVICE, IAuthorizationService } from '../../src/domain/interfaces/services/authorization-service.interface';
import { NOTIFICATION_SERVICE, INotificationService } from '../../src/domain/interfaces/services/notification-service.interface';
import { InsufficientBalanceException } from '../../src/shared/exceptions/insufficient-balance.exception';
import { UnauthorizedUserTypeException } from '../../src/shared/exceptions/unauthorized-user-type.exception';
import { UserNotFoundException } from '../../src/shared/exceptions/user-not-found.exception';
import { ServiceUnavailableException } from '../../src/shared/exceptions/service-unavailable.exception';

describe('TransferUseCase', () => {
  let transferUseCase: TransferUseCase;
  let userRepository: jest.Mocked<IUserRepository>;
  let transactionRepository: jest.Mocked<ITransactionRepository>;
  let authorizationService: jest.Mocked<IAuthorizationService>;
  let notificationService: jest.Mocked<INotificationService>;
  let loggerSpy: jest.SpyInstance;

  const commonUser = new User({
    id: 1,
    fullName: 'John Common',
    document: '12345678900',
    email: 'john@example.com',
    password: 'password123',
    balance: 1000,
    type: UserType.COMMON,
  });

  const merchantUser = new User({
    id: 2,
    fullName: 'Acme Store',
    document: '12345678000190',
    email: 'acme@store.com',
    password: 'password123',
    balance: 500,
    type: UserType.MERCHANT,
  });

  const anotherCommonUser = new User({
    id: 3,
    fullName: 'Jane Common',
    document: '98765432100',
    email: 'jane@example.com',
    password: 'password123',
    balance: 200,
    type: UserType.COMMON,
  });

  beforeEach(async () => {
    loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    
    const moduleRef = await Test.createTestingModule({
      providers: [
        TransferUseCase,
        {
          provide: USER_REPOSITORY,
          useValue: {
            findById: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: TRANSACTION_REPOSITORY,
          useValue: {
            save: jest.fn(),
          },
        },
        {
          provide: AUTHORIZATION_SERVICE,
          useValue: {
            authorize: jest.fn(),
          },
        },
        {
          provide: NOTIFICATION_SERVICE,
          useValue: {
            notify: jest.fn(),
          },
        },
      ],
    }).compile();

    transferUseCase = moduleRef.get<TransferUseCase>(TransferUseCase);
    userRepository = moduleRef.get(USER_REPOSITORY) as jest.Mocked<IUserRepository>;
    transactionRepository = moduleRef.get(TRANSACTION_REPOSITORY) as jest.Mocked<ITransactionRepository>;
    authorizationService = moduleRef.get(AUTHORIZATION_SERVICE) as jest.Mocked<IAuthorizationService>;
    notificationService = moduleRef.get(NOTIFICATION_SERVICE) as jest.Mocked<INotificationService>;
  });

  afterEach(() => {
    loggerSpy.mockRestore();
  });

  it('should transfer money successfully between two common users', async () => {
    // Arrange
    const transferDto: TransferDto = {
      value: 100,
      payer: commonUser.id,
      payee: anotherCommonUser.id,
    };

    userRepository.findById.mockImplementation(async (id) => {
      if (id === commonUser.id) return commonUser;
      if (id === anotherCommonUser.id) return anotherCommonUser;
      return null;
    });

    authorizationService.authorize.mockResolvedValue(true);
    notificationService.notify.mockResolvedValue();
    transactionRepository.save.mockResolvedValue({
      id: 1,
      value: transferDto.value,
      payerId: transferDto.payer,
      payeeId: transferDto.payee,
      createdAt: new Date(),
    });

    // Act
    await transferUseCase.execute(transferDto);

    // Assert
    expect(userRepository.save).toHaveBeenCalledTimes(2);
    expect(transactionRepository.save).toHaveBeenCalledTimes(1);
    expect(notificationService.notify).toHaveBeenCalledTimes(2);
  });

  it('should throw when payer not found', async () => {
    // Arrange
    const transferDto: TransferDto = {
      value: 100,
      payer: 999, // Non-existent user
      payee: anotherCommonUser.id,
    };

    userRepository.findById.mockImplementation(async (id) => {
      if (id === anotherCommonUser.id) return anotherCommonUser;
      return null;
    });

    // Act & Assert
    await expect(transferUseCase.execute(transferDto)).rejects.toThrow(
      UserNotFoundException,
    );
  });

  it('should throw when payee not found', async () => {
    // Arrange
    const transferDto: TransferDto = {
      value: 100,
      payer: commonUser.id,
      payee: 999, // Non-existent user
    };

    userRepository.findById.mockImplementation(async (id) => {
      if (id === commonUser.id) return commonUser;
      return null;
    });

    // Act & Assert
    await expect(transferUseCase.execute(transferDto)).rejects.toThrow(
      UserNotFoundException,
    );
  });

  it('should throw when merchant tries to transfer', async () => {
    // Arrange
    const transferDto: TransferDto = {
      value: 100,
      payer: merchantUser.id,
      payee: commonUser.id,
    };

    userRepository.findById.mockImplementation(async (id) => {
      if (id === merchantUser.id) return merchantUser;
      if (id === commonUser.id) return commonUser;
      return null;
    });

    // Act & Assert
    await expect(transferUseCase.execute(transferDto)).rejects.toThrow(
      UnauthorizedUserTypeException,
    );
  });

  it('should throw when payer has insufficient balance', async () => {
    // Arrange
    const transferDto: TransferDto = {
      value: 2000, // More than balance
      payer: commonUser.id,
      payee: anotherCommonUser.id,
    };

    userRepository.findById.mockImplementation(async (id) => {
      if (id === commonUser.id) return commonUser;
      if (id === anotherCommonUser.id) return anotherCommonUser;
      return null;
    });

    // Act & Assert
    await expect(transferUseCase.execute(transferDto)).rejects.toThrow(
      InsufficientBalanceException,
    );
  });

  it('should throw when authorization service denies the transfer', async () => {
    // Arrange
    const transferDto: TransferDto = {
      value: 100,
      payer: commonUser.id,
      payee: anotherCommonUser.id,
    };

    userRepository.findById.mockImplementation(async (id) => {
      if (id === commonUser.id) return commonUser;
      if (id === anotherCommonUser.id) return anotherCommonUser;
      return null;
    });

    authorizationService.authorize.mockResolvedValue(false);

    // Act & Assert
    await expect(transferUseCase.execute(transferDto)).rejects.toThrow(
      ServiceUnavailableException,
    );
  });

  it('should complete transfer even if notification service fails', async () => {
    // Arrange
    const transferDto: TransferDto = {
      value: 100,
      payer: commonUser.id,
      payee: anotherCommonUser.id,
    };

    userRepository.findById.mockImplementation(async (id) => {
      if (id === commonUser.id) return commonUser;
      if (id === anotherCommonUser.id) return anotherCommonUser;
      return null;
    });

    authorizationService.authorize.mockResolvedValue(true);
    notificationService.notify.mockRejectedValue(new Error('Notification failed'));
    transactionRepository.save.mockResolvedValue({
      id: 1,
      value: transferDto.value,
      payerId: transferDto.payer,
      payeeId: transferDto.payee,
      createdAt: new Date(),
    });

    // Act
    const result = await transferUseCase.execute(transferDto);

    // Assert
    expect(result).toBeDefined();
    expect(userRepository.save).toHaveBeenCalledTimes(2);
    expect(transactionRepository.save).toHaveBeenCalledTimes(1);
  });
});