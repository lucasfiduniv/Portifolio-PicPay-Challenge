import { Injectable } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { IUserRepository } from '../../../domain/interfaces/repositories/user-repository.interface';
import { User } from '../../../domain/entities/user.entity';
import { UserEntity } from '../entities/user.entity';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private userEntityRepository: Repository<UserEntity>,
    private dataSource: DataSource,
  ) {}

  async findById(id: number): Promise<User | null> {
    const userEntity = await this.userEntityRepository.findOne({
      where: { id },
    });

    if (!userEntity) {
      return null;
    }

    return this.mapToDomain(userEntity);
  }

  async save(user: User): Promise<User> {
    const userEntity = this.mapToEntity(user);
    const savedEntity = await this.userEntityRepository.save(userEntity);
    return this.mapToDomain(savedEntity);
  }

  async saveWithTransaction(
    queryRunner: any,
    user: User,
  ): Promise<User> {
    const userEntity = this.mapToEntity(user);
    const savedEntity = await queryRunner.manager.save(UserEntity, userEntity);
    return this.mapToDomain(savedEntity);
  }

  private mapToDomain(entity: UserEntity): User {
    return new User({
      id: entity.id,
      fullName: entity.fullName,
      document: entity.document,
      email: entity.email,
      password: entity.password,
      balance: entity.balance,
      type: entity.type,
    });
  }

  private mapToEntity(domain: User): UserEntity {
    const entity = new UserEntity();
    entity.id = domain.id;
    entity.fullName = domain.fullName;
    entity.document = domain.document;
    entity.email = domain.email;
    entity.password = domain.password;
    entity.balance = domain.balance;
    entity.type = domain.type;
    return entity;
  }
}