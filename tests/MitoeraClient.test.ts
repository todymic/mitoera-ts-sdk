import { jest, describe, it, expect } from '@jest/globals';
import { MitoeraClient } from '../src/MitoeraClient.js';
import { AuthException } from '../src/exception/AuthException.js';
import { HttpClient } from '../src/http/HttpClient.js';

function makeHttp() {
  return {
    get:    jest.fn(),
    post:   jest.fn(),
    put:    jest.fn(),
    patch:  jest.fn(),
    delete: jest.fn(),
  } as unknown as HttpClient;
}

describe('MitoeraClient', () => {
  it('auto-detects sandbox from pk_test_ prefix', () => {
    const client = new MitoeraClient({ keyId: 'pk_test_abc', secret: 'sk_xxx' });
    expect(client.apiPrefix).toBe('/sandbox-api');
  });

  it('auto-detects production from pk_live_ prefix', () => {
    const client = new MitoeraClient({ keyId: 'pk_live_abc', secret: 'sk_xxx' });
    expect(client.apiPrefix).toBe('/api');
  });

  it('explicit mode overrides key prefix', () => {
    const client = new MitoeraClient({ keyId: 'pk_live_abc', secret: 'sk_xxx', mode: 'sandbox' });
    expect(client.apiPrefix).toBe('/sandbox-api');
  });

  it('throws AuthException when keyId is missing', () => {
    expect(() => new MitoeraClient({ keyId: '', secret: 'sk_xxx' })).toThrow(AuthException);
  });

  it('throws AuthException when secret is missing', () => {
    expect(() => new MitoeraClient({ keyId: 'pk_live_abc', secret: '' })).toThrow(AuthException);
  });

  it('exposes all sub-clients as properties', () => {
    const client = new MitoeraClient({ keyId: 'pk_live_abc', secret: 'sk_xxx' }, makeHttp());
    expect(client.holds).toBeDefined();
    expect(client.sessions).toBeDefined();
    expect(client.events).toBeDefined();
    expect(client.charts).toBeDefined();
    expect(client.categories).toBeDefined();
    expect(client.workspaces).toBeDefined();
    expect(client.apiKeys).toBeDefined();
  });
});
