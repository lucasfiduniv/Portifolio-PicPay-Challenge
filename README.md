# PicPay Backend Challenge

A NestJS implementation of the PicPay backend challenge, featuring a payment transfer system with user management, transaction processing, and external service integration.

## Architecture

The application follows clean architecture principles with:

- **Domain Layer**: Core business entities, interfaces, and rules
- **Application Layer**: Use cases that orchestrate the domain
- **Infrastructure Layer**: Implementation details like repositories and external services
- **Presentation Layer**: Controllers for API endpoints

## How to Run with Docker

```bash
# Clone the repository
git clone <repository-url>
cd picpay-challenge

# Start the Docker containers
docker-compose up -d
```

The application will be available at http://localhost:3000.

You can access Adminer at http://localhost:8080 with the following credentials:
- System: PostgreSQL
- Server: postgres
- Username: postgres
- Password: postgres
- Database: picpay

## How to Run Tests

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:cov
```

## API Documentation

### Transfer Money

**Endpoint**: `POST /transfer`

**Request Body**:
```json
{
  "value": 100.0,
  "payer": 1,
  "payee": 2
}
```

**Success Response** (Status Code: 201):
```json
{
  "id": 1,
  "value": 100.0,
  "payerId": 1,
  "payeeId": 2,
  "createdAt": "2023-01-01T00:00:00.000Z"
}
```

**Error Responses**:
- 400: Insufficient balance
- 403: Unauthorized user type (merchant trying to transfer)
- 404: User not found
- 503: External authorization service unavailable

## Database Structure

The application uses PostgreSQL with the following schema:

### Users Table

- `id`: Serial Primary Key
- `full_name`: String
- `document`: String (CPF/CNPJ) - Unique
- `email`: String - Unique
- `password`: String
- `balance`: Decimal
- `type`: Enum ('COMMON', 'MERCHANT')

### Transactions Table

- `id`: Serial Primary Key
- `value`: Decimal
- `payer_id`: Foreign Key to Users
- `payee_id`: Foreign Key to Users
- `created_at`: Timestamp

## Business Rules

1. Common users can transfer money to both common users and merchants
2. Merchant users can only receive money
3. Users must have sufficient balance to make a transfer
4. External authorization service is consulted before each transfer
5. Users are notified after a successful transfer