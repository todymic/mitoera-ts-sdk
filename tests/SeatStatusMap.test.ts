import { describe, it, expect } from '@jest/globals';
import { SeatStatusMap } from '../src/response/SeatStatusMap.js';

describe('SeatStatusMap', () => {
  const map = new SeatStatusMap({ A1: 'available', A2: 'held', A3: 'booked', A4: 'available' });

  it('available() returns only available seats', () => {
    expect(map.available()).toEqual(expect.arrayContaining(['A1', 'A4']));
    expect(map.available()).toHaveLength(2);
  });

  it('held() returns only held seats', () => {
    expect(map.held()).toEqual(['A2']);
  });

  it('booked() returns only booked seats', () => {
    expect(map.booked()).toEqual(['A3']);
  });

  it('isAvailable() checks a specific key', () => {
    expect(map.isAvailable('A1')).toBe(true);
    expect(map.isAvailable('A2')).toBe(false);
  });

  it('size returns total seat count', () => {
    expect(map.size).toBe(4);
  });

  it('is iterable', () => {
    const entries = [...map];
    expect(entries).toHaveLength(4);
    expect(entries[0]).toEqual(['A1', 'available']);
  });
});
