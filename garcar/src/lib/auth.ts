export function saveAuth(token: string, userId: string) {
  localStorage.setItem('token', token);
  localStorage.setItem('userId', userId);
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
