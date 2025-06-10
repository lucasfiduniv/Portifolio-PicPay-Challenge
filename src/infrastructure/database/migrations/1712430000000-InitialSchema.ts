import { MigrationInterface, QueryRunner } from 'typeorm';
import { UserType } from '../../../domain/enums/user-type.enum';

export class InitialSchema1712430000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table
    await queryRunner.query(`
      CREATE TYPE "user_type_enum" AS ENUM('${UserType.COMMON}', '${UserType.MERCHANT}');
      
      CREATE TABLE "users" (
        "id" SERIAL PRIMARY KEY,
        "full_name" VARCHAR(255) NOT NULL,
        "document" VARCHAR(20) NOT NULL UNIQUE,
        "email" VARCHAR(255) NOT NULL UNIQUE,
        "password" VARCHAR(255) NOT NULL,
        "balance" DECIMAL(10,2) DEFAULT 0 NOT NULL,
        "type" user_type_enum DEFAULT '${UserType.COMMON}' NOT NULL
      );
    `);

    // Create transactions table
    await queryRunner.query(`
      CREATE TABLE "transactions" (
        "id" SERIAL PRIMARY KEY,
        "value" DECIMAL(10,2) NOT NULL,
        "payer_id" INTEGER NOT NULL REFERENCES users(id),
        "payee_id" INTEGER NOT NULL REFERENCES users(id),
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `);

    // Insert seed data
    await queryRunner.query(`
      INSERT INTO "users" (full_name, document, email, password, balance, type)
      VALUES 
        ('John Common', '12345678900', 'john@example.com', 'password123', 1000.00, '${UserType.COMMON}'),
        ('Jane Common', '98765432100', 'jane@example.com', 'password123', 500.00, '${UserType.COMMON}'),
        ('Acme Store', '12345678000190', 'acme@store.com', 'password123', 0.00, '${UserType.MERCHANT}');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "transactions"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "user_type_enum"`);
  }
}