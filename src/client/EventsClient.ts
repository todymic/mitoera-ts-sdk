import type { MitoeraClient } from '../MitoeraClient.js';
import { type EventResponse, parseEventResponse } from '../response/EventResponse.js';
import { SeatStatusMap } from '../response/SeatStatusMap.js';

export class EventsClient {
  constructor(private readonly client: MitoeraClient) {}

  async listAll(): Promise<EventResponse[]> {
    const data = await this.client.get(`${this.client.apiPrefix}/events`);
    const items = (data as Record<string, unknown>)['items'] ?? data;
    return (items as Record<string, unknown>[]).map(parseEventResponse);
  }

  async get(eventId: string): Promise<EventResponse> {
    const data = await this.client.get(`${this.client.apiPrefix}/events/${eventId}`);
    return parseEventResponse(data as Record<string, unknown>);
  }

  async findByIdentifier(identifier: string): Promise<EventResponse> {
    const data = await this.client.get(
      `${this.client.apiPrefix}/events/by-identifier/${identifier}`,
    );
    return parseEventResponse(data as Record<string, unknown>);
  }

  async listSeats(eventId: string, seatKeys?: string[]): Promise<SeatStatusMap> {
    const path = `${this.client.apiPrefix}/events/${eventId}/seats`;
    const data = seatKeys
      ? await this.client.post(path, { seatKeys })
      : await this.client.get(path);
    return new SeatStatusMap(data as Record<string, string>);
  }

  async bulkUpdateSeats(eventId: string, seatKeys: string[], status: string): Promise<number> {
    const data = await this.client.patch(
      `${this.client.apiPrefix}/events/${eventId}/seats`,
      { seatKeys, status },
    );
    return Number((data as Record<string, unknown>)['updated'] ?? seatKeys.length);
  }

  async create(title: string, identifier: string, chartId?: string): Promise<EventResponse> {
    const body: Record<string, string> = { title, identifier };
    if (chartId) body['chartId'] = chartId;
    const data = await this.client.post(`${this.client.apiPrefix}/events`, body);
    return parseEventResponse(data as Record<string, unknown>);
  }

  async update(eventId: string, fields: Record<string, unknown>): Promise<EventResponse> {
    const data = await this.client.put(`${this.client.apiPrefix}/events/${eventId}`, fields);
    return parseEventResponse(data as Record<string, unknown>);
  }

  async linkChart(eventId: string, chartId: string): Promise<void> {
    await this.client.post(`${this.client.apiPrefix}/events/${eventId}/link-chart`, { chartId });
  }

  async delete(eventId: string): Promise<void> {
    await this.client.delete(`${this.client.apiPrefix}/events/${eventId}`);
  }
}
