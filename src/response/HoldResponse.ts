export interface HoldResponse {
  holdToken: string;
  seatKeys: string[];
  expiresAt: Date;
  durationSeconds: number;
}

export function parseHoldResponse(data: Record<string, unknown>): HoldResponse {
  return {
    holdToken:       String(data['holdToken']),
    seatKeys:        data['seatKeys'] as string[],
    expiresAt:       new Date(String(data['expiresAt'])),
    durationSeconds: Number(data['durationSeconds']),
  };
}
