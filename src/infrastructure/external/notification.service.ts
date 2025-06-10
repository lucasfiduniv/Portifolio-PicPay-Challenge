import { Injectable, Logger } from '@nestjs/common';
import { INotificationService } from '../../domain/interfaces/services/notification-service.interface';

@Injectable()
export class NotificationService implements INotificationService {
  private readonly logger = new Logger(NotificationService.name);

  async notify(userId: number, message: string): Promise<void> {
    try {
      const response = await fetch('https://util.devi.tools/api/v1/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, message }),
      });

      if (!response.ok) {
        throw new Error(
          `Notification service responded with status ${response.status}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to send notification to user ${userId}: ${error.message}`,
        error.stack,
      );
      // We don't rethrow the error as per requirements
    }
  }
}