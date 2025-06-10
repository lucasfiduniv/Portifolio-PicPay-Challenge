import { HttpException, HttpStatus } from '@nestjs/common';

export class UnauthorizedUserTypeException extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.FORBIDDEN);
  }
}