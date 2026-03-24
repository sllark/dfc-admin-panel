/**
 * Shared auth storage helpers for logout / expired session handling.
 */

export function clearAuthSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('id');
  localStorage.removeItem('username');
}

/**
 * Returns true if JWT is missing, malformed, or past exp claim.
 */
export function isJwtExpired(token) {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1]));
    if (!payload?.exp) return false;
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

/**
 * True when the failed request is a public auth form (do not force redirect).
 */
export function isPublicAuthRequestUrl(url) {
  if (!url) return false;
  const u = String(url);
  return (
    /\/auth\/login/i.test(u) ||
    /\/auth\/register/i.test(u) ||
    /\/forgot-password/i.test(u) ||
    /\/reset-password/i.test(u) ||
    /\/verify-otp/i.test(u)
  );
}
