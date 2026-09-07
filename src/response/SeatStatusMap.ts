export type SeatStatus = 'available' | 'held' | 'booked' | string;

export class SeatStatusMap implements Iterable<[string, SeatStatus]> {
  private readonly map: Map<string, SeatStatus>;

  constructor(raw: Record<string, SeatStatus>) {
    this.map = new Map(Object.entries(raw));
  }

  get(seatKey: string): SeatStatus | undefined { return this.map.get(seatKey); }
  has(seatKey: string): boolean                { return this.map.has(seatKey); }
  get size(): number                           { return this.map.size; }

  isAvailable(seatKey: string): boolean { return this.map.get(seatKey) === 'available'; }
  isHeld(seatKey: string): boolean      { return this.map.get(seatKey) === 'held'; }
  isBooked(seatKey: string): boolean    { return this.map.get(seatKey) === 'booked'; }

  available(): string[] { return this.byStatus('available'); }
  held(): string[]      { return this.byStatus('held'); }
  booked(): string[]    { return this.byStatus('booked'); }

  byStatus(status: SeatStatus): string[] {
    return [...this.map.entries()]
      .filter(([, s]) => s === status)
      .map(([k]) => k);
  }

  [Symbol.iterator](): Iterator<[string, SeatStatus]> {
    return this.map.entries();
  }

  toRecord(): Record<string, SeatStatus> {
    return Object.fromEntries(this.map);
  }
}
