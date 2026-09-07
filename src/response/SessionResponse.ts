export interface SessionResponse {
  sessionToken: string;
  holdToken: string;
  eventId: string;
  expiresIn: number;
}

export function parseSessionResponse(data: Record<string, unknown>): SessionResponse {
  return {
    sessionToken: String(data['sessionToken']),
    holdToken:    String(data['holdToken']),
    eventId:      String(data['eventId']),
    expiresIn:    Number(data['expiresIn']),
  };
}
