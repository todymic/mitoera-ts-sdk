import { jest, describe, it, expect } from '@jest/globals';
import { MitoeraClient } from '../src/MitoeraClient.js';
import { HoldsClient } from '../src/client/HoldsClient.js';
import { HttpClient } from '../src/http/HttpClient.js';
import { ApiException } from '../src/exception/ApiException.js';

function makeMocks() {
  const http = {
    get: jest.fn(), post: jest.fn(), put: jest.fn(), patch: jest.fn(), delete: jest.fn(),
  } as unknown as HttpClient;
  const client = new MitoeraClient({ keyId: 'pk_live_test', secret: 'sk_xxx' }, http);
  return { http: http as { post: ReturnType<typeof jest.fn> }, holds: new HoldsClient(client) };
}

const holdPayload = {
  holdToken: 'ht-1', seatKeys: ['A1', 'A2'],
  expiresAt: '2025-12-31T12:10:00+00:00', durationSeconds: 600,
};

describe('HoldsClient', () => {
  it('hold() posts to /api/events/:id/hold', async () => {
    const { http, holds } = makeMocks();
    http.post.mockResolvedValue(holdPayload);

    const result = await holds.hold('event-1', ['A1', 'A2'], 'ht-1');

    expect(http.post).toHaveBeenCalledWith(
      '/api/events/event-1/hold',
      { seatKeys: ['A1', 'A2'], holdToken: 'ht-1' },
      expect.any(Object),
    );
    expect(result.holdToken).toBe('ht-1');
    expect(result.durationSeconds).toBe(600);
  });

  it('book() posts to /api/events/:id/book and returns BookResponse', async () => {
    const { http, holds } = makeMocks();
    http.post.mockResolvedValue({
      bookedSeats: ['A1', 'A2'], eventId: 'event-1', bookedAt: '2025-12-31T12:00:00+00:00',
    });

    const result = await holds.book('event-1', ['A1', 'A2'], 'ht-1');
    expect(result.bookedSeats).toEqual(['A1', 'A2']);
    expect(result.eventId).toBe('event-1');
  });

  it('release() posts to /api/events/:id/release', async () => {
    const { http, holds } = makeMocks();
    http.post.mockResolvedValue({});

    await holds.release('event-1', ['A1'], 'ht-1');
    expect(http.post).toHaveBeenCalledWith(
      '/api/events/event-1/release',
      { seatKeys: ['A1'], holdToken: 'ht-1' },
      expect.any(Object),
    );
  });

  it('propagates ApiException from the HTTP layer', async () => {
    const { http, holds } = makeMocks();
    http.post.mockRejectedValue(ApiException.fromResponse(409, { message: 'Seat already held' }));

    await expect(holds.hold('event-1', ['A1'], 'ht-1')).rejects.toThrow(ApiException);
  });

  it('uses sandbox prefix when client is in sandbox mode', async () => {
    const http = {
      get: jest.fn(), post: jest.fn() as ReturnType<typeof jest.fn>, put: jest.fn(), patch: jest.fn(), delete: jest.fn(),
    } as unknown as HttpClient;
    (http.post as ReturnType<typeof jest.fn>).mockResolvedValue(holdPayload);

    const sandbox = new MitoeraClient({ keyId: 'pk_test_abc', secret: 'sk_xxx' }, http);
    const holds   = new HoldsClient(sandbox);

    await holds.hold('event-1', ['A1'], 'ht-1');
    expect(http.post).toHaveBeenCalledWith(
      '/api/events/event-1/hold',
      expect.any(Object),
      expect.any(Object),
    );
  });
});
