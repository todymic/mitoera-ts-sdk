import type { MitoeraClient } from '../MitoeraClient.js';
import { type HoldResponse, parseHoldResponse } from '../response/HoldResponse.js';
import { type BookResponse, parseBookResponse } from '../response/BookResponse.js';

export class HoldsClient {
  constructor(private readonly client: MitoeraClient) {}

  async hold(eventId: string, seatKeys: string[], holdToken: string): Promise<HoldResponse> {
    const data = await this.client.post(
      `${this.client.apiPrefix}/events/${eventId}/hold`,
      { seatKeys, holdToken },
    );
    return parseHoldResponse(data as Record<string, unknown>);
  }

  async book(eventId: string, seatKeys: string[], holdToken: string): Promise<BookResponse> {
    const data = await this.client.post(
      `${this.client.apiPrefix}/events/${eventId}/book`,
      { seatKeys, holdToken },
    );
    return parseBookResponse(data as Record<string, unknown>);
  }

  async release(eventId: string, seatKeys: string[], holdToken: string): Promise<void> {
    await this.client.post(
      `${this.client.apiPrefix}/events/${eventId}/release`,
      { seatKeys, holdToken },
    );
  }

  async changeStatus(eventId: string, seatKeys: string[], status: string): Promise<void> {
    await this.client.post(
      `${this.client.apiPrefix}/events/${eventId}/change-status`,
      { seatKeys, status },
    );
  }
}
