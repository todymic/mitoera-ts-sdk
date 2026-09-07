import { jest, describe, it, expect } from '@jest/globals';
import { MitoeraClient } from '../src/MitoeraClient.js';
import { ChartsClient } from '../src/client/ChartsClient.js';
import { HttpClient } from '../src/http/HttpClient.js';

function makeMocks() {
  const http = {
    get: jest.fn(), post: jest.fn(), put: jest.fn(), patch: jest.fn(), delete: jest.fn(),
  } as unknown as HttpClient;
  const client = new MitoeraClient({ keyId: 'pk_live_test', secret: 'sk_xxx' }, http);
  return {
    get:    http.get    as ReturnType<typeof jest.fn>,
    post:   http.post   as ReturnType<typeof jest.fn>,
    put:    http.put    as ReturnType<typeof jest.fn>,
    delete: http.delete as ReturnType<typeof jest.fn>,
    charts: new ChartsClient(client),
  };
}

const chartPayload = {
  id: 'chart-1', name: 'Salle Zénith', objects: [],
  updatedAt: '2025-01-01T00:00:00+00:00', status: 'draft',
  pendingChanges: false, publishedSnapshot: null,
};

describe('ChartsClient', () => {
  it('get() fetches /api/charts/:id', async () => {
    const { get, charts } = makeMocks();
    get.mockResolvedValue(chartPayload);

    const result = await charts.get('chart-1');
    expect(get).toHaveBeenCalledWith('/api/charts/chart-1', expect.any(Object));
    expect(result.name).toBe('Salle Zénith');
    expect(result.status).toBe('draft');
  });

  it('create() posts name and returns ChartResponse', async () => {
    const { post, charts } = makeMocks();
    post.mockResolvedValue(chartPayload);

    const result = await charts.create('Salle Zénith');
    expect(post).toHaveBeenCalledWith('/api/charts', { name: 'Salle Zénith' }, expect.any(Object));
    expect(result.id).toBe('chart-1');
  });

  it('publish() posts to /publish endpoint', async () => {
    const { post, charts } = makeMocks();
    post.mockResolvedValue({ ...chartPayload, status: 'published' });

    const result = await charts.publish('chart-1');
    expect(post).toHaveBeenCalledWith('/api/charts/chart-1/publish', {}, expect.any(Object));
    expect(result.status).toBe('published');
  });

  it('setObjects() puts to /objects endpoint', async () => {
    const { put, charts } = makeMocks();
    const objects = [{ type: 'seat', key: 'A1' }];
    put.mockResolvedValue({ ...chartPayload, objects });

    const result = await charts.setObjects('chart-1', objects);
    expect(put).toHaveBeenCalledWith(
      '/api/charts/chart-1/objects', { objects }, expect.any(Object),
    );
    expect(result.objects).toHaveLength(1);
  });

  it('delete() calls delete endpoint', async () => {
    const { delete: del, charts } = makeMocks();
    del.mockResolvedValue({});

    await charts.delete('chart-1');
    expect(del).toHaveBeenCalledWith('/api/charts/chart-1', expect.any(Object));
  });
});
