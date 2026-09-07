export type SeatStatus = 'available' | 'held' | 'booked' | string;

export interface SeatStatusChangedEvent {
  seatKey: string;
  status: SeatStatus;
  holdToken?: string;
}

export interface StreamConnectionEvent {
  type: 'connected' | 'disconnected' | 'error';
  message?: string;
}

export interface MitoeraStreamOptions {
  sessionToken: string;
  eventId: string;
  /** Base URL of the Mitoera API (default: https://api.mitoera.com). */
  baseUrl?: string;
  onSeatUpdate?: (event: SeatStatusChangedEvent) => void;
  onConnection?: (event: StreamConnectionEvent) => void;
  /** Auto-reconnect on connection loss (default: true). */
  reconnect?: boolean;
  /** Delay between reconnect attempts in ms (default: 3000). */
  reconnectDelay?: number;
}

/**
 * Subscribes to real-time seat status updates via SSE.
 *
 * @example
 * const stream = new MitoeraStream({
 *   sessionToken: session.sessionToken,
 *   eventId: 'event-uuid',
 *   onSeatUpdate: ({ seatKey, status }) => { ... },
 * });
 * stream.connect();
 * // later:
 * stream.disconnect();
 */
export class MitoeraStream {
  private es: EventSource | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private closed = false;

  constructor(private readonly options: MitoeraStreamOptions) {}

  connect(): this {
    this.closed = false;
    this.openEventSource();
    return this;
  }

  disconnect(): void {
    this.closed = true;
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.closeEventSource();
  }

  private openEventSource(): void {
    const base = this.options.baseUrl ?? 'https://api.mitoera.com';
    const url  = new URL(`${base}/api/public/stream`);
    url.searchParams.set('sessionToken', this.options.sessionToken);
    url.searchParams.set('eventId',      this.options.eventId);

    this.es = new EventSource(url.toString());

    this.es.addEventListener('open', () => {
      this.options.onConnection?.({ type: 'connected' });
    });

    this.es.addEventListener('seat-update', (e: Event) => {
      try {
        const data = JSON.parse((e as MessageEvent).data) as SeatStatusChangedEvent;
        this.options.onSeatUpdate?.(data);
      } catch {
        // malformed event — ignore
      }
    });

    this.es.addEventListener('error', () => {
      this.options.onConnection?.({ type: 'error' });
      this.closeEventSource();

      if (!this.closed && (this.options.reconnect ?? true)) {
        this.scheduleReconnect();
      } else {
        this.options.onConnection?.({ type: 'disconnected' });
      }
    });
  }

  private closeEventSource(): void {
    this.es?.close();
    this.es = null;
  }

  private scheduleReconnect(): void {
    const delay = this.options.reconnectDelay ?? 3_000;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.closed) this.openEventSource();
    }, delay);
  }
}
