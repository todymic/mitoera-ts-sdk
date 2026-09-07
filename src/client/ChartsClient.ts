import type { MitoeraClient } from '../MitoeraClient.js';
import { type ChartResponse, parseChartResponse } from '../response/ChartResponse.js';

export class ChartsClient {
  constructor(private readonly client: MitoeraClient) {}

  async listAll(): Promise<ChartResponse[]> {
    const data = await this.client.get(`${this.client.apiPrefix}/charts`);
    const items = (data as Record<string, unknown>)['items'] ?? data;
    return (items as Record<string, unknown>[]).map(parseChartResponse);
  }

  async get(chartId: string): Promise<ChartResponse> {
    const data = await this.client.get(`${this.client.apiPrefix}/charts/${chartId}`);
    return parseChartResponse(data as Record<string, unknown>);
  }

  async create(name: string): Promise<ChartResponse> {
    const data = await this.client.post(`${this.client.apiPrefix}/charts`, { name });
    return parseChartResponse(data as Record<string, unknown>);
  }

  async update(chartId: string, fields: Record<string, unknown>): Promise<ChartResponse> {
    const data = await this.client.put(`${this.client.apiPrefix}/charts/${chartId}`, fields);
    return parseChartResponse(data as Record<string, unknown>);
  }

  async setObjects(chartId: string, objects: unknown[]): Promise<ChartResponse> {
    const data = await this.client.put(
      `${this.client.apiPrefix}/charts/${chartId}/objects`,
      { objects },
    );
    return parseChartResponse(data as Record<string, unknown>);
  }

  async publish(chartId: string): Promise<ChartResponse> {
    const data = await this.client.post(`${this.client.apiPrefix}/charts/${chartId}/publish`);
    return parseChartResponse(data as Record<string, unknown>);
  }

  async markPending(chartId: string): Promise<ChartResponse> {
    const data = await this.client.post(`${this.client.apiPrefix}/charts/${chartId}/mark-pending`);
    return parseChartResponse(data as Record<string, unknown>);
  }

  async delete(chartId: string): Promise<void> {
    await this.client.delete(`${this.client.apiPrefix}/charts/${chartId}`);
  }
}
