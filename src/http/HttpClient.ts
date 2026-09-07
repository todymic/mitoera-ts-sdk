import { ApiException } from '../exception/ApiException.js';

export class HttpClient {
  constructor(
    private readonly baseUrl: string,
    private readonly timeoutMs: number,
  ) {}

  async get(path: string, headers: Record<string, string>): Promise<unknown> {
    return this.request('GET', path, headers);
  }

  async post(path: string, body: unknown, headers: Record<string, string>): Promise<unknown> {
    return this.request('POST', path, headers, body);
  }

  async put(path: string, body: unknown, headers: Record<string, string>): Promise<unknown> {
    return this.request('PUT', path, headers, body);
  }

  async patch(path: string, body: unknown, headers: Record<string, string>): Promise<unknown> {
    return this.request('PATCH', path, headers, body);
  }

  async delete(path: string, headers: Record<string, string>): Promise<unknown> {
    return this.request('DELETE', path, headers);
  }

  private async request(
    method: string,
    path: string,
    headers: Record<string, string>,
    body?: unknown,
  ): Promise<unknown> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const init: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...headers,
        },
        signal: controller.signal,
      };
      if (body !== undefined) {
        init.body = JSON.stringify(body);
      }

      const res = await fetch(this.baseUrl + path, init);

      const text = await res.text();
      const data = text ? (JSON.parse(text) as unknown) : {};

      if (!res.ok) {
        throw ApiException.fromResponse(res.status, data);
      }

      return data;
    } finally {
      clearTimeout(timer);
    }
  }
}
