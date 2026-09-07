import type { ChartDesignerOptions } from './types.js';

const API_BASE    = 'https://api.mitoera.com/api';
const EDITOR_URL  = 'https://bo.mitoera.com/embed-editor.html';

async function fetchEmbedToken(keyId: string, secret: string, sandbox: boolean): Promise<string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (sandbox) headers['X-Api-Mode'] = 'sandbox';

  const res = await fetch(`${API_BASE}/auth/embed-token`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ keyId, secret }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as Record<string, unknown>;
    throw new Error((body['error'] as string | undefined) ?? `embed-token failed (${res.status})`);
  }

  const data = await res.json() as Record<string, unknown>;
  return data['token'] as string;
}

/**
 * Embed de l'éditeur de plan Mitoera (back-office).
 * Miroir TypeScript de `mitoera.ChartDesigner` depuis `mitoera-editor.js`.
 *
 * @example
 * import { ChartDesigner } from '@mitoera/sdk/browser';
 *
 * const designer = new ChartDesigner({
 *   divId:     'chart-editor',
 *   secretKey: 'pk_live_xxx:sk_xxx',
 *   chartKey:  'uuid-du-plan',
 * });
 * await designer.render();
 */
export class ChartDesigner {
  private readonly divId: string;
  private readonly keyId: string;
  private readonly secret: string;
  private readonly chartKey: string;
  private readonly eventKey: string | null;
  private readonly sandbox: boolean;

  private _iframe: HTMLIFrameElement | null = null;

  constructor(options: ChartDesignerOptions) {
    if (!options.divId || !options.secretKey || !options.chartKey) {
      throw new Error('ChartDesigner: divId, secretKey et chartKey sont requis.');
    }

    const sep = options.secretKey.indexOf(':');
    if (sep === -1) {
      throw new Error('ChartDesigner: secretKey doit être au format "keyId:secret".');
    }

    this.divId    = options.divId;
    this.keyId    = options.secretKey.slice(0, sep);
    this.secret   = options.secretKey.slice(sep + 1);
    this.chartKey = options.chartKey;
    this.eventKey = options.eventKey ?? null;
    this.sandbox  = this.keyId.startsWith('pk_test_');
  }

  async render(): Promise<this> {
    const container = document.getElementById(this.divId);
    if (!container) throw new Error(`ChartDesigner: div#${this.divId} introuvable.`);

    container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-family:sans-serif;color:#666">Chargement…</div>';

    try {
      const token = await fetchEmbedToken(this.keyId, this.secret, this.sandbox);

      const params = new URLSearchParams({ planId: this.chartKey, token });
      if (this.eventKey) params.set('eventId', this.eventKey);
      if (this.sandbox)  params.set('sandbox', '1');

      const iframe = document.createElement('iframe');
      iframe.src = `${EDITOR_URL}?${params.toString()}`;
      iframe.style.cssText = 'width:100%;height:100%;border:none;display:block;';
      iframe.allow = 'fullscreen';

      container.innerHTML = '';
      container.appendChild(iframe);
      this._iframe = iframe;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      container.innerHTML = `<div style="padding:16px;color:#e53e3e;font-family:sans-serif">${msg}</div>`;
    }

    return this;
  }

  destroy(): void {
    const container = document.getElementById(this.divId);
    if (container) container.innerHTML = '';
    this._iframe = null;
  }
}
