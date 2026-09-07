import { MitoeraException } from './MitoeraException.js';

export class AuthException extends MitoeraException {
  constructor(message: string) {
    super(message);
    this.name = 'AuthException';
  }
}
