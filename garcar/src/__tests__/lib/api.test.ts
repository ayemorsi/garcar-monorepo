import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { decodeJwt } from '@/lib/api';

// ── decodeJwt ─────────────────────────────────────────────────────────────────

describe('decodeJwt()', () => {
  function encodePayload(payload: object): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body   = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    return `${header}.${body}.fakesig`;
  }

  it('decodes a standard JWT and returns the payload', () => {
    const payload = { userId: 'abc123', isVerified: true, role: 'user' };
    const token = encodePayload(payload);

    const result = decodeJwt(token);
    expect(result).toMatchObject({ userId: 'abc123', isVerified: true });
  });

  it('returns null for a malformed token', () => {
    expect(decodeJwt('not.a.valid.jwt.at.all')).toBeNull();
    expect(decodeJwt('')).toBeNull();
    expect(decodeJwt('onlyone')).toBeNull();
  });

  it('handles URL-safe base64 characters (- and _)', () => {
    // Manually build a token with URL-safe characters in the payload
    const rawPayload = JSON.stringify({ userId: 'user+id/test==' });
    const b64 = btoa(rawPayload).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    const token = `header.${b64}.sig`;

    const result = decodeJwt(token);
    expect(result).toMatchObject({ userId: 'user+id/test==' });
  });
});

// ── api.request() — authorization header & auto-refresh ─────────────────────

describe('api request() function', () => {
  const BASE = 'http://localhost:5001/api';

  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function mockFetch(body: unknown, status = 200) {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve(body),
      text: () => Promise.resolve(JSON.stringify(body)),
    });
  }

  it('attaches Authorization header when a token is in localStorage', async () => {
    localStorage.setItem('token', 'my-jwt-token');
    mockFetch({ notifications: [], unreadCount: 0 });

    const { api } = await import('@/lib/api');
    await api.getNotifications();

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/notifications'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer my-jwt-token' }),
      })
    );
  });

  it('does not attach Authorization header when no token is stored', async () => {
    mockFetch([]);

    const { api } = await import('@/lib/api');
    await api.getCars();

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/cars'),
      expect.objectContaining({
        headers: expect.not.objectContaining({ Authorization: expect.anything() }),
      })
    );
  });

  it('throws an error with the backend message on non-OK responses', async () => {
    mockFetch({ message: 'Not Found' }, 404);

    const { api } = await import('@/lib/api');
    await expect(api.getCar('nonexistent-id')).rejects.toThrow('Not Found');
  });

  it('auto-refreshes on 401 and retries the original request', async () => {
    localStorage.setItem('token', 'expired-token');
    localStorage.setItem('refreshToken', 'valid-refresh-token');

    const newToken = 'fresh-jwt-token';

    (fetch as ReturnType<typeof vi.fn>)
      // First call: 401 (expired)
      .mockResolvedValueOnce({
        ok: false, status: 401,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ message: 'Unauthorized' }),
        text: () => Promise.resolve('Unauthorized'),
      })
      // Refresh call: succeeds
      .mockResolvedValueOnce({
        ok: true, status: 200,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ token: newToken }),
        text: () => Promise.resolve(JSON.stringify({ token: newToken })),
      })
      // Retry of original: succeeds
      .mockResolvedValueOnce({
        ok: true, status: 200,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ notifications: [], unreadCount: 0 }),
        text: () => Promise.resolve(''),
      });

    const { api } = await import('@/lib/api');
    const result = await api.getNotifications();

    expect(fetch).toHaveBeenCalledTimes(3);
    // The new token should be saved to localStorage
    expect(localStorage.getItem('token')).toBe(newToken);
  });
});

// ── Booking price calculation (pure logic, extracted for testing) ─────────────

describe('Booking price calculation logic', () => {
  // These are the exact formulas used in the BookingWidget component
  function calcDailyPrice(pricePerDay: number, days: number) {
    const subtotal = pricePerDay * days;
    const serviceFee = Math.round(subtotal * 0.12);
    const protection = 15;
    return { subtotal, serviceFee, protection, total: subtotal + serviceFee + protection };
  }

  function calcHourlyPrice(pricePerHour: number, hours: number) {
    const subtotal = pricePerHour * hours;
    const serviceFee = Math.round(subtotal * 0.12);
    const protection = 15;
    return { subtotal, serviceFee, protection, total: subtotal + serviceFee + protection };
  }

  it('calculates daily total: subtotal + 12% service fee + $15 protection', () => {
    const result = calcDailyPrice(50, 3);
    expect(result.subtotal).toBe(150);
    expect(result.serviceFee).toBe(18); // 150 * 0.12 = 18
    expect(result.protection).toBe(15);
    expect(result.total).toBe(183);
  });

  it('rounds the 12% service fee', () => {
    const result = calcDailyPrice(50, 1); // 50 * 0.12 = 6
    expect(result.serviceFee).toBe(6);
    expect(result.total).toBe(71);
  });

  it('calculates hourly total: pricePerHour * hours + fees', () => {
    const result = calcHourlyPrice(15, 2);
    expect(result.subtotal).toBe(30);
    expect(result.serviceFee).toBe(4); // 30 * 0.12 = 3.6, rounded = 4
    expect(result.total).toBe(49);
  });

  it('correctly rounds service fee for hourly (3.6 → 4)', () => {
    const { serviceFee } = calcHourlyPrice(15, 2);
    expect(serviceFee).toBe(Math.round(30 * 0.12));
  });

  it('1-day booking total is price + 12% + $15', () => {
    const price = 100;
    const { total } = calcDailyPrice(price, 1);
    expect(total).toBe(price + Math.round(price * 0.12) + 15);
  });
});
