export interface BookResponse {
  bookedSeats: string[];
  eventId: string;
  bookedAt: Date;
}

export function parseBookResponse(data: Record<string, unknown>): BookResponse {
  return {
    bookedSeats: data['bookedSeats'] as string[],
    eventId:     String(data['eventId']),
    bookedAt:    new Date(String(data['bookedAt'])),
  };
}
