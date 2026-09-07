import type { MitoeraClient } from '../MitoeraClient.js';
import {
  type ApiKeyResponse,
  type ApiKeyCreatedResponse,
  parseApiKeyResponse,
  parseApiKeyCreatedResponse,
} from '../response/ApiKeyResponse.js';

export class ApiKeysClient {
  constructor(private readonly client: MitoeraClient) {}

  async listAll(): Promise<ApiKeyResponse[]> {
    const data = await this.client.get(`${this.client.apiPrefix}/api-keys`);
    const items = (data as Record<string, unknown>)['items'] ?? data;
    return (items as Record<string, unknown>[]).map(parseApiKeyResponse);
  }

  async create(name: string, scope: 'PUBLIC' | 'BACKOFFICE' = 'PUBLIC'): Promise<ApiKeyCreatedResponse> {
    const data = await this.client.post(`${this.client.apiPrefix}/api-keys`, { name, scope });
    return parseApiKeyCreatedResponse(data as Record<string, unknown>);
  }

  async delete(apiKeyId: string): Promise<void> {
    await this.client.delete(`${this.client.apiPrefix}/api-keys/${apiKeyId}`);
  }
}
