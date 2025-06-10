import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('transactions')
export class TransactionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  value: number;

  @Column({ name: 'payer_id' })
  payerId: number;

  @Column({ name: 'payee_id' })
  payeeId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}