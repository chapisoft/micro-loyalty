type CookieOptions = {
  path?: string;
  maxAge?: number; // seconds
  expires?: Date;
  secure?: boolean;
  sameSite?: 'Lax' | 'Strict' | 'None';
};

export function setCookie(name: string, value: string, options: CookieOptions = {}) {
  const parts: string[] = [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`];

  if (options.path) parts.push(`path=${options.path}`);
  else parts.push('path=/');

  if (options.maxAge !== undefined) parts.push(`max-age=${options.maxAge}`);
  if (options.expires) parts.push(`expires=${options.expires.toUTCString()}`);
  if (options.secure) parts.push('secure');
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);

  document.cookie = parts.join('; ');
}

export function getCookie(name: string): string | null {
  const matches = document.cookie.match(new RegExp('(?:^|; )' + encodeURIComponent(name) + '=([^;]*)'));
  return matches ? decodeURIComponent(matches[1]) : null;
}

export function deleteCookie(name: string, path = '/') {
  document.cookie = `${encodeURIComponent(name)}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export default {
  setCookie,
  getCookie,
  deleteCookie,
};
