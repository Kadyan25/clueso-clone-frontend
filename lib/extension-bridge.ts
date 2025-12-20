// lib/extension-bridge.ts

export function sendJwtToExtension(jwt: string | null | undefined) {
  if (typeof window === 'undefined') return;
  if (!jwt) return;

  window.postMessage({ jwt }, window.location.origin);
}
