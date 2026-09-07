import { MitoeraException } from './MitoeraException.js';

export class ApiException extends MitoeraException {
  constructor(
    public readonly statusCode: number,
    public readonly body: unknown,
    message?: string,
  ) {
    super(message ?? `Mitoera API error ${statusCode}`);
    this.name = 'ApiException';
  }

  static fromResponse(statusCode: number, body: unknown): ApiException {
    const msg =
      body && typeof body === 'object' && 'message' in body
        ? String((body as Record<string, unknown>)['message'])
        : `HTTP ${statusCode}`;
    return new ApiException(statusCode, body, msg);
  }
}
