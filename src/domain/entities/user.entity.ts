import { UserType } from '../enums/user-type.enum';

export class User {
  id: number;
  fullName: string;
  document: string; // CPF or CNPJ
  email: string;
  password: string;
  balance: number;
  type: UserType;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }

  canTransfer(): boolean {
    return this.type === UserType.COMMON;
  }

  hasEnoughBalance(value: number): boolean {
    return this.balance >= value;
  }

  debit(value: number): void {
    if (!this.hasEnoughBalance(value)) {
      throw new Error('Insufficient balance');
    }
    this.balance -= value;
  }

  credit(value: number): void {
    this.balance += value;
  }
}