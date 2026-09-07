import type { SeatingChartOptions, SeatInfo, CategoryPrice } from './types.js';

type Env = 'live' | 'test' | 'legacy';

function envFromKey(key: string): Env {
  if (key.startsWith('pk_live_')) return 'live';
  if (key.startsWith('pk_test_')) return 'test';
  return 'legacy';
}

const DEFAULT_API_BASE = 'https://api.mitoera.com';

function apiBase(): string {
  if (typeof document === 'undefined') return DEFAULT_API_BASE;
  const scripts = document.querySelectorAll<HTMLScriptElement>('script[src*="mitoera-widget"]');
  if (scripts.length) {
    try { return new URL(scripts[scripts.length - 1].src).origin; } catch (_) {}
  }
  return DEFAULT_API_BASE;
}

/**
 * Embed du plan de salle Mitoera.
 * Miroir TypeScript de `Mitoera.SeatingChart` depuis `mitoera-widget.js`.
 *
 * @example
 * import { SeatingChart } from '@mitoera/sdk/browser';
 *
 * const chart = new SeatingChart({
 *   divId:        'mitoera-chart',
 *   workspaceKey: 'pk_live_xxx',
 *   event:        'mon-evenement',
 *   onReady:      ({ sessionToken }) => { ... },
 *   onSelectionChange: (seats) => setSelectedSeats(seats),
 *   onCheckout:   (seats) => startPayment(seats),
 * });
 * chart.render();
 *
 * // Plus tard :
 * chart.destroy();
 */
export class SeatingChart {
  private readonly divId: string;
  private readonly workspaceKey: string;
  private readonly eventId: string;
  private readonly sandbox: boolean;
  private readonly showLegend: boolean;
  private readonly showResume: boolean;
  private categoryPrices: Record<string, CategoryPrice>;

  private readonly onReady?: SeatingChartOptions['onReady'];
  private readonly onSeatSelected?: SeatingChartOptions['onSeatSelected'];
  private readonly onSeatDeselected?: SeatingChartOptions['onSeatDeselected'];
  private readonly onSelectionChange?: SeatingChartOptions['onSelectionChange'];
  private readonly onCheckout?: SeatingChartOptions['onCheckout'];

  private readonly _baseUrl: string;
  private _iframe: HTMLIFrameElement | null = null;
  private _fsBtn: HTMLButtonElement | null = null;
  private _sessionToken: string | null = null;
  private _holdToken: string | null = null;
  private _resolvedEventId: string | null = null;
  private _lastSeats: SeatInfo[] = [];
  private _listener: ((e: MessageEvent) => void) | null = null;
  private _onFsChange: (() => void) | null = null;

  constructor(options: SeatingChartOptions) {
    this.divId        = options.divId;
    this.workspaceKey = options.workspaceKey;
    this.eventId      = options.event;

    const env = envFromKey(this.workspaceKey);
    this.sandbox = env === 'test' || (env === 'legacy' && options.sandbox === true);

    this.showLegend     = options.showLegend !== false;
    this.showResume     = options.showResume === true;
    this.categoryPrices = options.categoryPrices ?? {};

    this.onReady           = options.onReady;
    this.onSeatSelected    = options.onSeatSelected;
    this.onSeatDeselected  = options.onSeatDeselected;
    this.onSelectionChange = options.onSelectionChange;
    this.onCheckout        = options.onCheckout;
    this._baseUrl          = options.baseUrl ?? apiBase();
  }

  render(): this {
    const container = document.getElementById(this.divId);
    if (!container) {
      console.error('[Mitoera] div not found:', this.divId);
      return this;
    }

    container.innerHTML = '';
    container.style.cssText += ';overflow:hidden;position:relative;';

    const renderPath = this.sandbox ? '/sandbox-render' : '/render';
    const url = new URL(`${this._baseUrl}${renderPath}`);
    url.searchParams.set('key',   this.workspaceKey);
    url.searchParams.set('event', this.eventId);
    if (this.onCheckout)   url.searchParams.set('checkout', '1');
    if (!this.showLegend)  url.searchParams.set('legend', '0');
    if (this.showResume)   url.searchParams.set('resume', '1');

    const iframe = document.createElement('iframe');
    iframe.src = url.toString();
    const radius = getComputedStyle(container).borderRadius;
    iframe.style.cssText = `width:100%;height:100%;border:none;display:block;border-radius:${radius};`;
    iframe.allow = 'fullscreen';
    iframe.setAttribute('allowfullscreen', '');
    this._iframe = iframe;
    container.appendChild(iframe);

    // Fullscreen button
    const iconExpand = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`;
    const iconShrink = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="10" y1="14" x2="3" y2="21"/><line x1="21" y1="3" x2="14" y2="10"/></svg>`;

    const fsBtn = document.createElement('button');
    fsBtn.type = 'button';
    fsBtn.style.cssText = 'position:absolute;bottom:10px;right:10px;z-index:200;display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border:none;border-radius:999px;background:rgba(255,255,255,0.92);backdrop-filter:blur(4px);box-shadow:0 1px 6px rgba(0,0,0,0.10),0 0 0 1px rgba(0,0,0,0.07);cursor:pointer;font-size:13px;font-weight:500;color:#1f2937;font-family:system-ui,sans-serif;white-space:nowrap;';

    const fsIcon  = document.createElement('span');
    fsIcon.style.display = 'flex';
    const fsLabel = document.createElement('span');

    const setFsState = (inFs: boolean): void => {
      fsIcon.innerHTML    = inFs ? iconShrink : iconExpand;
      fsLabel.textContent = inFs ? 'Quitter le plein écran' : 'Plein écran';
    };
    setFsState(false);
    fsBtn.appendChild(fsIcon);
    fsBtn.appendChild(fsLabel);

    fsBtn.addEventListener('mouseenter', () => { fsBtn.style.background = '#fff'; });
    fsBtn.addEventListener('mouseleave', () => { fsBtn.style.background = 'rgba(255,255,255,0.92)'; });
    fsBtn.addEventListener('click', async () => {
      try {
        if (document.fullscreenElement === container) {
          await document.exitFullscreen();
        } else {
          await container.requestFullscreen();
        }
      } catch (_) {}
    });

    this._onFsChange = () => {
      const inFs = document.fullscreenElement === container;
      setFsState(inFs);
      iframe.style.borderRadius = inFs ? '0' : radius;
      iframe.contentWindow?.postMessage({ type: 'mitoera:fullscreenChange', inFs }, '*');
    };
    document.addEventListener('fullscreenchange', this._onFsChange);
    this._fsBtn = fsBtn;
    container.appendChild(fsBtn);

    // postMessage listener
    this._listener = (e: MessageEvent) => {
      if (e.source !== iframe.contentWindow) return;
      const { type, ...data } = (e.data ?? {}) as Record<string, unknown>;

      switch (type) {
        case 'mitoera:ready':
          this._sessionToken    = data['sessionToken'] as string;
          this._holdToken       = data['holdToken'] as string;
          this._resolvedEventId = data['eventId'] as string;
          this.onReady?.({
            sessionToken: this._sessionToken,
            holdToken:    this._holdToken,
            eventId:      this._resolvedEventId,
          });
          if (Object.keys(this.categoryPrices).length) {
            iframe.contentWindow?.postMessage(
              { type: 'mitoera:setCategoryPrices', prices: this.categoryPrices },
              '*',
            );
          }
          break;

        case 'mitoera:seatSelected':
          this.onSeatSelected?.(data['seat'] as SeatInfo);
          break;

        case 'mitoera:seatDeselected':
          this.onSeatDeselected?.(data['seat'] as SeatInfo);
          break;

        case 'mitoera:selectionChange':
          this._lastSeats = (data['seats'] as SeatInfo[]) ?? [];
          this.onSelectionChange?.(this._lastSeats);
          break;

        case 'mitoera:checkout':
          this.onCheckout?.((data['seats'] as SeatInfo[]) ?? []);
          break;

        case 'mitoera:error':
          console.error('[Mitoera]', data['message']);
          break;
      }
    };
    window.addEventListener('message', this._listener);

    return this;
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  getSelectedSeats(): SeatInfo[] { return this._lastSeats; }
  getSessionToken(): string | null { return this._sessionToken; }
  getHoldToken(): string | null { return this._holdToken; }
  getEventId(): string | null { return this._resolvedEventId; }

  /** Pré-sélectionne des sièges programmatiquement (ex : restauration depuis localStorage). */
  selectSeats(seatKeys: string[]): void {
    if (!this._iframe || !seatKeys.length) return;
    this._iframe.contentWindow?.postMessage({ type: 'mitoera:selectSeats', seatKeys }, '*');
  }

  /** Met à jour les prix par catégorie après le render(). */
  setCategoryPrices(prices: Record<string, CategoryPrice>): void {
    this.categoryPrices = prices;
    this._iframe?.contentWindow?.postMessage(
      { type: 'mitoera:setCategoryPrices', prices },
      '*',
    );
  }

  /** Supprime l'iframe et nettoie tous les écouteurs. */
  destroy(): void {
    if (this._listener)   window.removeEventListener('message', this._listener);
    if (this._onFsChange) document.removeEventListener('fullscreenchange', this._onFsChange);
    this._iframe?.remove();
    this._fsBtn?.remove();
    this._iframe = null;
    this._fsBtn  = null;
  }
}
