export const AUTHORIZATION_SERVICE = 'AUTHORIZATION_SERVICE';

export interface IAuthorizationService {
  authorize(): Promise<boolean>;
}