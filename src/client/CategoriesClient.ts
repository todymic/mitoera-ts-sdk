import type { MitoeraClient } from '../MitoeraClient.js';
import { type CategoryResponse, parseCategoryResponse } from '../response/CategoryResponse.js';

export class CategoriesClient {
  constructor(private readonly client: MitoeraClient) {}

  async listForChart(chartId: string): Promise<CategoryResponse[]> {
    const data = await this.client.get(`${this.client.apiPrefix}/charts/${chartId}/categories`);
    const items = (data as Record<string, unknown>)['items'] ?? data;
    return (items as Record<string, unknown>[]).map(parseCategoryResponse);
  }

  async get(chartId: string, categoryKey: number): Promise<CategoryResponse> {
    const data = await this.client.get(
      `${this.client.apiPrefix}/charts/${chartId}/categories/${categoryKey}`,
    );
    return parseCategoryResponse(data as Record<string, unknown>);
  }

  async create(chartId: string, name: string, color: string): Promise<CategoryResponse> {
    const data = await this.client.post(
      `${this.client.apiPrefix}/charts/${chartId}/categories`,
      { name, color },
    );
    return parseCategoryResponse(data as Record<string, unknown>);
  }

  async update(
    chartId: string,
    categoryKey: number,
    fields: Record<string, unknown>,
  ): Promise<CategoryResponse> {
    const data = await this.client.put(
      `${this.client.apiPrefix}/charts/${chartId}/categories/${categoryKey}`,
      fields,
    );
    return parseCategoryResponse(data as Record<string, unknown>);
  }

  async delete(chartId: string, categoryKey: number): Promise<void> {
    await this.client.delete(
      `${this.client.apiPrefix}/charts/${chartId}/categories/${categoryKey}`,
    );
  }
}
