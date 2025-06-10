import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { UserType } from '../../../domain/enums/user-type.enum';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ unique: true })
  document: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  balance: number;

  @Column({
    type: 'enum',
    enum: UserType,
    default: UserType.COMMON,
  })
  type: UserType;
}