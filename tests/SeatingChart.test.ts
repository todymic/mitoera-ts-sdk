import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { SeatingChart } from '../src/browser/SeatingChart.js';

// ── Minimal DOM stubs ───────────────────────────────────────────────────────

function makeContainer() {
  return {
    innerHTML: '',
    style: { cssText: '' },
    appendChild: jest.fn(),
    requestFullscreen: jest.fn(),
  } as unknown as HTMLElement;
}

function mockDocument(container: HTMLElement) {
  const listeners: Record<string, EventListener[]> = {};

  return {
    getElementById: jest.fn().mockReturnValue(container),
    createElement: jest.fn().mockImplementation((tag: string) => {
      const el: Record<string, unknown> = {
        tagName: tag.toUpperCase(),
        style: { cssText: '' },
        src: '',
        allow: '',
        setAttribute: jest.fn(),
        appendChild: jest.fn(),
        addEventListener: jest.fn(),
        remove: jest.fn(),
        innerHTML: '',
        textContent: '',
        contentWindow: {
          postMessage: jest.fn(),
        },
      };
      return el as unknown as HTMLElement;
    }),
    querySelectorAll: jest.fn().mockReturnValue([]),
    addEventListener: jest.fn((ev: string, fn: EventListener) => {
      listeners[ev] = listeners[ev] ?? [];
      listeners[ev].push(fn);
    }),
    removeEventListener: jest.fn(),
    fullscreenElement: null,
    exitFullscreen: jest.fn(),
    _listeners: listeners,
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('SeatingChart', () => {
  let origDoc: Document;
  let origWin: Window & typeof globalThis;
  let msgListeners: ((e: MessageEvent) => void)[];

  beforeEach(() => {
    origDoc = global.document;
    origWin = global.window;
    msgListeners = [];
  });

  afterEach(() => {
    global.document = origDoc;
    global.window   = origWin;
  });

  function setupDom(options: { keyId?: string } = {}) {
    const container = makeContainer();
    const doc = mockDocument(container);
    global.document = doc as unknown as Document;
    global.window = {
      addEventListener: jest.fn((_: string, fn: EventListener) => {
        msgListeners.push(fn as (e: MessageEvent) => void);
      }),
      removeEventListener: jest.fn(),
      getComputedStyle: jest.fn().mockReturnValue({ borderRadius: '8px' }),
    } as unknown as Window & typeof globalThis;
    global.getComputedStyle = jest.fn().mockReturnValue({ borderRadius: '8px' }) as unknown as typeof getComputedStyle;
    return { container, doc };
  }

  it('uses sandbox prefix when key starts with pk_test_', () => {
    const { doc } = setupDom();
    const chart = new SeatingChart({
      divId: 'map', workspaceKey: 'pk_test_abc', baseUrl: 'https://api.mitoera.com', event: 'evt-1',
    });
    chart.render();

    const iframeEl = (doc.createElement as ReturnType<typeof jest.fn>).mock.results
      .find((r: { value: { tagName: string } }) => r.value?.tagName === 'IFRAME')?.value as { src: string } | undefined;

    expect(iframeEl?.src).toContain('/sandbox-render');
  });

  it('uses production prefix for pk_live_ key', () => {
    const { doc } = setupDom();
    const chart = new SeatingChart({
      divId: 'map', workspaceKey: 'pk_live_abc', baseUrl: 'https://api.mitoera.com', event: 'evt-1',
    });
    chart.render();

    const iframeEl = (doc.createElement as ReturnType<typeof jest.fn>).mock.results
      .find((r: { value: { tagName: string } }) => r.value?.tagName === 'IFRAME')?.value as { src: string } | undefined;

    expect(iframeEl?.src).toContain('/render');
    expect(iframeEl?.src).not.toContain('sandbox');
  });

  it('calls onReady when mitoera:ready message is received', () => {
    setupDom();
    const onReady = jest.fn();
    const chart = new SeatingChart({
      divId: 'map', workspaceKey: 'pk_live_abc', baseUrl: 'https://api.mitoera.com', event: 'evt-1', onReady,
    });
    chart.render();

    const readyPayload = { type: 'mitoera:ready', sessionToken: 'st-1', holdToken: 'ht-1', eventId: 'uuid-1' };
    // simulate iframe message — source must match contentWindow
    const iframe = (global.document.createElement as ReturnType<typeof jest.fn>).mock.results
      .find((r: { value: { tagName: string } }) => r.value?.tagName === 'IFRAME')?.value as { contentWindow: unknown } | undefined;

    msgListeners.forEach(fn => fn({ source: iframe?.contentWindow, data: readyPayload } as unknown as MessageEvent));

    expect(onReady).toHaveBeenCalledWith({ sessionToken: 'st-1', holdToken: 'ht-1', eventId: 'uuid-1' });
    expect(chart.getSessionToken()).toBe('st-1');
    expect(chart.getHoldToken()).toBe('ht-1');
    expect(chart.getEventId()).toBe('uuid-1');
  });

  it('calls onSelectionChange and updates getSelectedSeats()', () => {
    setupDom();
    const onSelectionChange = jest.fn();
    const chart = new SeatingChart({
      divId: 'map', workspaceKey: 'pk_live_abc', baseUrl: 'https://api.mitoera.com', event: 'evt-1', onSelectionChange,
    });
    chart.render();

    const seats = [{ seatKey: 'A1', catId: 'cat-1', catColor: '#fff', catName: 'VIP' }];
    const iframe = (global.document.createElement as ReturnType<typeof jest.fn>).mock.results
      .find((r: { value: { tagName: string } }) => r.value?.tagName === 'IFRAME')?.value as { contentWindow: unknown } | undefined;

    msgListeners.forEach(fn => fn({
      source: iframe?.contentWindow,
      data: { type: 'mitoera:selectionChange', seats },
    } as unknown as MessageEvent));

    expect(onSelectionChange).toHaveBeenCalledWith(seats);
    expect(chart.getSelectedSeats()).toEqual(seats);
  });

  it('addUrl checkout=1 param when onCheckout is provided', () => {
    const { doc } = setupDom();
    const chart = new SeatingChart({
      divId: 'map', workspaceKey: 'pk_live_abc', baseUrl: 'https://api.mitoera.com', event: 'evt-1', onCheckout: jest.fn(),
    });
    chart.render();

    const iframeEl = (doc.createElement as ReturnType<typeof jest.fn>).mock.results
      .find((r: { value: { tagName: string } }) => r.value?.tagName === 'IFRAME')?.value as { src: string } | undefined;

    expect(iframeEl?.src).toContain('checkout=1');
  });

  it('destroy() removes listeners', () => {
    setupDom();
    const chart = new SeatingChart({
      divId: 'map', workspaceKey: 'pk_live_abc', baseUrl: 'https://api.mitoera.com', event: 'evt-1',
    });
    chart.render();
    chart.destroy();

    expect((global.window.removeEventListener as ReturnType<typeof jest.fn>).mock.calls.length).toBeGreaterThan(0);
  });
});
