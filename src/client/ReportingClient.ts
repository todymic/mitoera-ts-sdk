import type { MitoeraClient } from '../MitoeraClient.js';

export interface MonthlyUsage {
  month: string;
  totalSeats: number;
  [key: string]: unknown;
}

export interface EventUsage {
  eventId: string;
  totalSeats: number;
  [key: string]: unknown;
}

export interface WorkspaceUsage {
  workspaceId: string;
  totalSeats: number;
  [key: string]: unknown;
}

/** @internal Accessed via client.reporting */
export class ReportingClient {
  constructor(private readonly client: MitoeraClient) {}

  /**
   * Monthly seat usage grouped by month.
   * GET /api/reporting/seats/monthly
   */
  async monthly(params?: { userId?: string; year?: number }): Promise<MonthlyUsage[]> {
    return this.client.get(this.buildUrl('/seats/monthly', params)) as Promise<MonthlyUsage[]>;
  }

  /**
   * Seat usage grouped by event for a given month.
   * GET /api/reporting/seats/by-event
   */
  async byEvent(params?: { userId?: string; year?: number; month?: number }): Promise<EventUsage[]> {
    return this.client.get(this.buildUrl('/seats/by-event', params)) as Promise<EventUsage[]>;
  }

  /**
   * Detailed seat list for a single event.
   * GET /api/reporting/seats/event/{eventId}
   */
  async seatList(eventId: string): Promise<Record<string, unknown>> {
    return this.client.get(
      `${this.client.apiPrefix}/reporting/seats/event/${encodeURIComponent(eventId)}`,
    ) as Promise<Record<string, unknown>>;
  }

  /**
   * All workspaces with their seat counts for a given month.
   * GET /api/reporting/seats/workspaces
   */
  async workspaces(params?: { year?: number; month?: number }): Promise<WorkspaceUsage[]> {
    return this.client.get(this.buildUrl('/seats/workspaces', params)) as Promise<WorkspaceUsage[]>;
  }

  private buildUrl(path: string, params?: Record<string, string | number | undefined>): string {
    const base = `${this.client.apiPrefix}/reporting${path}`;
    if (!params) return base;

    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');

    return qs ? `${base}?${qs}` : base;
  }
}
