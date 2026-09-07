export interface SeatSelectedEvent {
  type: 'seatSelected';
  seatKey: string;
  label: string;
  status: string;
  categoryKey: number | null;
}

export interface SeatDeselectedEvent {
  type: 'seatDeselected';
  seatKey: string;
}

export interface HoldConfirmedEvent {
  type: 'holdConfirmed';
  seatKeys: string[];
  holdToken: string;
  expiresAt: string;
}

export interface SessionExpiredEvent {
  type: 'sessionExpired';
}

export type WidgetEvent =
  | SeatSelectedEvent
  | SeatDeselectedEvent
  | HoldConfirmedEvent
  | SessionExpiredEvent;

export interface MitoeraWidgetOptions {
  /** DOM element or CSS selector where the iframe will be rendered. */
  container: HTMLElement | string;
  sessionToken: string;
  eventId: string;
  /** Base URL of the Mitoera widget host (default: https://widget.mitoera.com). */
  widgetUrl?: string;
  /** Height of the iframe in px (default: 600). */
  height?: number;
  /** Called whenever the widget dispatches an event. */
  onEvent?: (event: WidgetEvent) => void;
  onSeatSelected?: (event: SeatSelectedEvent) => void;
  onSeatDeselected?: (event: SeatDeselectedEvent) => void;
  onHoldConfirmed?: (event: HoldConfirmedEvent) => void;
  onSessionExpired?: (event: SessionExpiredEvent) => void;
}

/**
 * Embeds the Mitoera seat-selection widget into a page via an iframe.
 * Communication is handled with postMessage.
 *
 * @example
 * const widget = new MitoeraWidget({
 *   container: '#seat-map',
 *   sessionToken: session.sessionToken,
 *   eventId: 'event-uuid',
 *   onHoldConfirmed: ({ seatKeys, holdToken }) => { ... },
 * });
 * widget.mount();
 * // later:
 * widget.destroy();
 */
export class MitoeraWidget {
  private iframe: HTMLIFrameElement | null = null;
  private readonly container: HTMLElement;
  private readonly widgetOrigin: string;
  private readonly messageHandler: (e: MessageEvent) => void;

  constructor(private readonly options: MitoeraWidgetOptions) {
    this.container = typeof options.container === 'string'
      ? (document.querySelector(options.container) as HTMLElement)
      : options.container;

    if (!this.container) {
      throw new Error(`MitoeraWidget: container "${options.container}" not found.`);
    }

    const base = options.widgetUrl ?? 'https://widget.mitoera.com';
    this.widgetOrigin = new URL(base).origin;

    this.messageHandler = this.handleMessage.bind(this);
  }

  mount(): this {
    if (this.iframe) return this;

    const base = this.options.widgetUrl ?? 'https://widget.mitoera.com';
    const url  = new URL(`${base}/embed`);
    url.searchParams.set('sessionToken', this.options.sessionToken);
    url.searchParams.set('eventId',      this.options.eventId);

    this.iframe = document.createElement('iframe');
    this.iframe.src               = url.toString();
    this.iframe.style.width       = '100%';
    this.iframe.style.height      = `${this.options.height ?? 600}px`;
    this.iframe.style.border      = 'none';
    this.iframe.allow             = 'fullscreen';
    this.iframe.setAttribute('loading', 'lazy');

    this.container.appendChild(this.iframe);
    window.addEventListener('message', this.messageHandler);

    return this;
  }

  destroy(): void {
    window.removeEventListener('message', this.messageHandler);
    this.iframe?.remove();
    this.iframe = null;
  }

  /** Send a command to the widget (e.g., trigger a hold programmatically). */
  send(command: Record<string, unknown>): void {
    this.iframe?.contentWindow?.postMessage(command, this.widgetOrigin);
  }

  private handleMessage(e: MessageEvent): void {
    if (e.origin !== this.widgetOrigin) return;

    const event = e.data as WidgetEvent;
    this.options.onEvent?.(event);

    switch (event.type) {
      case 'seatSelected':
        this.options.onSeatSelected?.(event);
        break;
      case 'seatDeselected':
        this.options.onSeatDeselected?.(event);
        break;
      case 'holdConfirmed':
        this.options.onHoldConfirmed?.(event);
        break;
      case 'sessionExpired':
        this.options.onSessionExpired?.(event);
        break;
    }
  }
}
