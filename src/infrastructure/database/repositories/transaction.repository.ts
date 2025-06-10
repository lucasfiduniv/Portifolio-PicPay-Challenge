import { Injectable } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ITransactionRepository } from '../../../domain/interfaces/repositories/transaction-repository.interface';
import { Transaction } from '../../../domain/entities/transaction.entity';
import { TransactionEntity } from '../entities/transaction.entity';

@Injectable()
export class TransactionRepository implements ITransactionRepository {
  constructor(
    @InjectRepository(TransactionEntity)
    private transactionEntityRepository: Repository<TransactionEntity>,
    private dataSource: DataSource,
  ) {}

  async save(transaction: Transaction): Promise<Transaction> {
    const transactionEntity = this.mapToEntity(transaction);
    const savedEntity = await this.transactionEntityRepository.save(
      transactionEntity,
    );
    return this.mapToDomain(savedEntity);
  }

  async saveWithTransaction(
    queryRunner: any,
    transaction: Transaction,
  ): Promise<Transaction> {
    const transactionEntity = this.mapToEntity(transaction);
    const savedEntity = await queryRunner.manager.save(
      TransactionEntity,
      transactionEntity,
    );
    return this.mapToDomain(savedEntity);
  }

  private mapToDomain(entity: TransactionEntity): Transaction {
    return new Transaction({
      id: entity.id,
      value: entity.value,
      payerId: entity.payerId,
      payeeId: entity.payeeId,
      createdAt: entity.createdAt,
    });
  }

  private mapToEntity(domain: Transaction): TransactionEntity {
    const entity = new TransactionEntity();
    entity.id = domain.id;
    entity.value = domain.value;
    entity.payerId = domain.payerId;
    entity.payeeId = domain.payeeId;
    entity.createdAt = domain.createdAt;
    return entity;
  }
}