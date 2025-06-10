import { Transaction } from '../../entities/transaction.entity';

export const TRANSACTION_REPOSITORY = 'TRANSACTION_REPOSITORY';

export interface ITransactionRepository {
  save(transaction: Transaction): Promise<Transaction>;
}