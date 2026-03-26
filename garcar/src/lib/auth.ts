function setCookie(name: string, value: string, maxAge = 3600) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function clearCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0`;
}

export function saveAuth(token: string, userId: string) {
  localStorage.setItem('token', token);
  localStorage.setItem('userId', userId);
  setCookie('garkar_token', token);
  setCookie('garkar_userId', userId);
}

export function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  clearCookie('garkar_token');
  clearCookie('garkar_userId');
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
