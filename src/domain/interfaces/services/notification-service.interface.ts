export const NOTIFICATION_SERVICE = 'NOTIFICATION_SERVICE';

export interface INotificationService {
  notify(userId: number, message: string): Promise<void>;
}