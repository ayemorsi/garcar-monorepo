import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveAuth,
  saveRefreshToken,
  getRefreshToken,
  clearAuth,
  getAuth,
  isLoggedIn,
} from '@/lib/auth';

const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiIxMjMifQ.fake';
const USER_ID = 'user123';
const REFRESH_TOKEN = 'refresh.token.value';

describe('saveAuth()', () => {
  it('persists token and userId to localStorage', () => {
    saveAuth(TOKEN, USER_ID);

    expect(localStorage.getItem('token')).toBe(TOKEN);
    expect(localStorage.getItem('userId')).toBe(USER_ID);
  });

  it('sets the garkar_token cookie', () => {
    saveAuth(TOKEN, USER_ID);

    expect(document.cookie).toContain('garkar_token=');
    expect(document.cookie).toContain(encodeURIComponent(TOKEN));
  });
});

describe('saveRefreshToken()', () => {
  it('persists the refresh token to localStorage', () => {
    saveRefreshToken(REFRESH_TOKEN);

    expect(localStorage.getItem('refreshToken')).toBe(REFRESH_TOKEN);
  });
});

describe('getRefreshToken()', () => {
  it('returns the stored refresh token', () => {
    localStorage.setItem('refreshToken', REFRESH_TOKEN);

    expect(getRefreshToken()).toBe(REFRESH_TOKEN);
  });

  it('returns null when no refresh token is stored', () => {
    expect(getRefreshToken()).toBeNull();
  });
});

describe('getAuth()', () => {
  it('returns token and userId when both are stored', () => {
    localStorage.setItem('token', TOKEN);
    localStorage.setItem('userId', USER_ID);

    expect(getAuth()).toEqual({ token: TOKEN, userId: USER_ID });
  });

  it('returns null values when nothing is stored', () => {
    expect(getAuth()).toEqual({ token: null, userId: null });
  });
});

describe('isLoggedIn()', () => {
  it('returns true when a token is stored', () => {
    localStorage.setItem('token', TOKEN);

    expect(isLoggedIn()).toBe(true);
  });

  it('returns false when no token is stored', () => {
    expect(isLoggedIn()).toBe(false);
  });
});

describe('clearAuth()', () => {
  it('removes all auth data from localStorage', () => {
    localStorage.setItem('token', TOKEN);
    localStorage.setItem('userId', USER_ID);
    localStorage.setItem('refreshToken', REFRESH_TOKEN);

    clearAuth();

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('userId')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
  });

  it('invalidates the garkar_token cookie (sets max-age=0)', () => {
    saveAuth(TOKEN, USER_ID);
    clearAuth();

    // After clearing, the cookie should be expired/reset
    // jsdom treats setting max-age=0 as deletion; cookie should not contain the token
    const tokenInCookie = document.cookie.includes(encodeURIComponent(TOKEN));
    expect(tokenInCookie).toBe(false);
  });
});
