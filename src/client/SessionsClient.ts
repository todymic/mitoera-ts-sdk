import type { MitoeraClient } from '../MitoeraClient.js';
import { type SessionResponse, parseSessionResponse } from '../response/SessionResponse.js';

export class SessionsClient {
  constructor(private readonly client: MitoeraClient) {}

  async create(eventId: string): Promise<SessionResponse> {
    const data = await this.client.post(
      `${this.client.apiPrefix}/public/sessions`,
      { eventId },
    );
    return parseSessionResponse(data as Record<string, unknown>);
  }

  async refresh(sessionToken: string): Promise<SessionResponse> {
    const data = await this.client.post(
      `${this.client.apiPrefix}/public/sessions/refresh`,
      { sessionToken },
    );
    return parseSessionResponse(data as Record<string, unknown>);
  }
}
