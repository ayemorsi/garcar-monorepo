import '@testing-library/jest-dom';

// Set env var used by src/lib/env.ts before any module loads
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:5001/api';

// Mock localStorage and cookies (jsdom provides localStorage but not document.cookie setter well)
beforeEach(() => {
  localStorage.clear();
  // Reset document.cookie
  Object.defineProperty(document, 'cookie', {
    writable: true,
    value: '',
    configurable: true,
  });
});
