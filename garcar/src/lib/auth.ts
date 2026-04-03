export function saveAuth(token: string, userId: string) {
  localStorage.setItem('token', token);
  localStorage.setItem('userId', userId);
  // Also set cookie so the middleware (proxy.ts) can read it server-side
  document.cookie = `garkar_token=${encodeURIComponent(token)}; path=/; max-age=3600; SameSite=Lax`;
}

export function saveRefreshToken(refreshToken: string) {
  localStorage.setItem('refreshToken', refreshToken);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refreshToken');
}

export function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  localStorage.removeItem('refreshToken');
  document.cookie = 'garkar_token=; path=/; max-age=0; SameSite=Lax';
}

export function getAuth() {
  if (typeof window === 'undefined') return { token: null, userId: null };
  return {
    token: localStorage.getItem('token'),
    userId: localStorage.getItem('userId'),
  };
}

export function isLoggedIn() {
  return !!getAuth().token;
}
