export class MitoeraException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MitoeraException';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
