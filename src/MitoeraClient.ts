import { AuthException } from './exception/AuthException.js';
import { HttpClient } from './http/HttpClient.js';
import { HoldsClient } from './client/HoldsClient.js';
import { SessionsClient } from './client/SessionsClient.js';
import { EventsClient } from './client/EventsClient.js';
import { ChartsClient } from './client/ChartsClient.js';
import { CategoriesClient } from './client/CategoriesClient.js';
import { WorkspacesClient } from './client/WorkspacesClient.js';
import { ApiKeysClient } from './client/ApiKeysClient.js';

export interface MitoeraClientOptions {
  keyId: string;
  secret: string;
  baseUrl?: string;
  mode?: 'sandbox' | 'production';
  timeoutMs?: number;
}

/**
 * Point d'entrée unique du SDK Mitoera côté serveur.
 *
 * @example
 * const client = new MitoeraClient({ keyId: 'pk_live_xxx', secret: 'sk_xxx' });
 * await client.holds.hold(eventId, ['A1', 'A2'], holdToken);
 * const session = await client.sessions.create(eventId);
 */
export class MitoeraClient {
  readonly holds: HoldsClient;
  readonly sessions: SessionsClient;
  readonly events: EventsClient;
  readonly charts: ChartsClient;
  readonly categories: CategoriesClient;
  readonly workspaces: WorkspacesClient;
  readonly apiKeys: ApiKeysClient;

  /** @internal — used by sub-clients to prefix every request path. */
  readonly apiPrefix: string;

  private readonly http: HttpClient;
  private readonly credential: string;

  constructor(options: MitoeraClientOptions, http?: HttpClient) {
    if (!options.keyId || !options.secret) {
      throw new AuthException(
        'Both "keyId" (pk_live_… / pk_test_…) and "secret" (sk_…) are required.',
      );
    }

    // The API always lives under /api — sandbox vs. production is an
    // instance-level setting on the server, NOT a different URL prefix.
    // A pk_test_ key hits the same /api/... routes as a pk_live_ key.
    this.apiPrefix  = '/api';
    this.credential = Buffer.from(`${options.keyId}:${options.secret}`).toString('base64');
    this.http       = http ?? new HttpClient(
      options.baseUrl ?? 'https://api.mitoera.com',
      options.timeoutMs ?? 30_000,
    );

    this.holds      = new HoldsClient(this);
    this.sessions   = new SessionsClient(this);
    this.events     = new EventsClient(this);
    this.charts     = new ChartsClient(this);
    this.categories = new CategoriesClient(this);
    this.workspaces = new WorkspacesClient(this);
    this.apiKeys    = new ApiKeysClient(this);
  }

  // ── HTTP verbs — used internally by sub-clients ──────────────────────────

  /** @internal */
  get(path: string): Promise<unknown> {
    return this.http.get(path, this.authHeaders());
  }

  /** @internal */
  post(path: string, body: unknown = {}): Promise<unknown> {
    return this.http.post(path, body, this.authHeaders());
  }

  /** @internal */
  put(path: string, body: unknown = {}): Promise<unknown> {
    return this.http.put(path, body, this.authHeaders());
  }

  /** @internal */
  patch(path: string, body: unknown = {}): Promise<unknown> {
    return this.http.patch(path, body, this.authHeaders());
  }

  /** @internal */
  delete(path: string): Promise<unknown> {
    return this.http.delete(path, this.authHeaders());
  }

  private authHeaders(): Record<string, string> {
    return { Authorization: `Basic ${this.credential}` };
  }
}
