import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './infrastructure/database/entities/user.entity';
import { TransactionEntity } from './infrastructure/database/entities/transaction.entity';
import { TransferController } from './presentation/controllers/transfer.controller';
import { TransferUseCase } from './application/use-cases/transfer.use-case';
import { UserRepository } from './infrastructure/database/repositories/user.repository';
import { TransactionRepository } from './infrastructure/database/repositories/transaction.repository';
import { AuthorizationService } from './infrastructure/external/authorization.service';
import { NotificationService } from './infrastructure/external/notification.service';
import { USER_REPOSITORY } from './domain/interfaces/repositories/user-repository.interface';
import { TRANSACTION_REPOSITORY } from './domain/interfaces/repositories/transaction-repository.interface';
import { AUTHORIZATION_SERVICE } from './domain/interfaces/services/authorization-service.interface';
import { NOTIFICATION_SERVICE } from './domain/interfaces/services/notification-service.interface';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_DATABASE', 'picpay'),
        entities: [UserEntity, TransactionEntity],
        synchronize: configService.get<boolean>('DB_SYNCHRONIZE', false),
      }),
    }),
    TypeOrmModule.forFeature([UserEntity, TransactionEntity]),
  ],
  controllers: [TransferController],
  providers: [
    TransferUseCase,
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
    {
      provide: TRANSACTION_REPOSITORY,
      useClass: TransactionRepository,
    },
    {
      provide: AUTHORIZATION_SERVICE,
      useClass: AuthorizationService,
    },
    {
      provide: NOTIFICATION_SERVICE,
      useClass: NotificationService,
    },
  ],
})
export class AppModule {}