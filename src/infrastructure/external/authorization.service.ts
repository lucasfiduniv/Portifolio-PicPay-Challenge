import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { IAuthorizationService } from '../../domain/interfaces/services/authorization-service.interface';

@Injectable()
export class AuthorizationService implements IAuthorizationService {
  async authorize(): Promise<boolean> {
    try {
      const response = await fetch('https://util.devi.tools/api/v2/authorize');
      
      if (!response.ok) {
        throw new HttpException(
          'Authorization service unavailable',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      const data = await response.json();
      return data.message === 'Autorizado';
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to connect to authorization service',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}