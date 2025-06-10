import { User } from '../../entities/user.entity';

export const USER_REPOSITORY = 'USER_REPOSITORY';

export interface IUserRepository {
  findById(id: number): Promise<User | null>;
  save(user: User): Promise<User>;
}