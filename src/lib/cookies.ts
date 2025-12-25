export interface CookieObject {
  name: string;
  value: string;
  domain: string;
  path: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
}

/**
 * Parse cookies from browser DevTools tab-separated format to JSON array
 *
 * Input format (from Chrome DevTools → Application → Cookies → Copy):
 * name\tvalue\tdomain\tpath\texpires\tsize\thttpOnly\tsecure\tsameSite\t...\n
 *
 * Example:
 * _dribbble_session	abc123...	dribbble.com	/	Session	521	✓	✓	Lax
 * user_session_token	xyz789...	dribbble.com	/	2026-01-07	54	✓	✓	Lax
 */
export function parseCookieString(cookieString: string): CookieObject[] {
  if (!cookieString || !cookieString.trim()) {
    return [];
  }

  const lines = cookieString.trim().split('\n');
  const cookies: CookieObject[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Split by tab character
    const parts = trimmedLine.split('\t');

    // Need at least name, value, domain, path (first 4 columns)
    if (parts.length >= 4) {
      const name = parts[0].trim();
      const value = parts[1].trim();
      const domain = parts[2].trim();
      const path = parts[3].trim();

      // Skip if any required field is empty
      if (name && value && domain) {
        // Parse optional flags from Chrome DevTools format
        // Columns: name, value, domain, path, expires, size, httpOnly, secure, sameSite
        const httpOnly = parts[6]?.trim() === '✓';
        const secure = parts[7]?.trim() === '✓';
        const sameSiteRaw = parts[8]?.trim();
        const sameSite = sameSiteRaw === 'Strict' || sameSiteRaw === 'Lax' || sameSiteRaw === 'None'
          ? sameSiteRaw
          : undefined;

        // Strip surrounding quotes from value (Chrome exports some values with quotes)
        const cleanValue = value.replace(/^["']|["']$/g, '');

        const cookie: CookieObject = {
          name,
          value: cleanValue,
          domain: domain.startsWith('.') ? domain : domain,
          path: path || '/',
        };

        // Only add optional fields if they have values (Playwright is strict about this)
        if (secure) cookie.secure = true;
        if (httpOnly) cookie.httpOnly = true;
        if (sameSite) cookie.sameSite = sameSite;

        cookies.push(cookie);
      }
    }
  }

  return cookies;
}

/**
 * Validate cookie string format
 * Returns true if it looks like valid tab-separated cookie data
 */
export function isValidCookieFormat(cookieString: string): boolean {
  if (!cookieString || !cookieString.trim()) {
    return true; // Empty is valid (no cookies)
  }

  const lines = cookieString.trim().split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Each line should have tab-separated values
    const parts = trimmedLine.split('\t');
    if (parts.length < 4) {
      return false;
    }
  }

  return true;
}

/**
 * Convert cookie objects to a summary string for display
 */
export function getCookieSummary(cookies: CookieObject[]): string {
  if (cookies.length === 0) {
    return 'No cookies';
  }

  const domains = [...new Set(cookies.map(c => c.domain))];
  return `${cookies.length} cookie${cookies.length === 1 ? '' : 's'} for ${domains.join(', ')}`;
}
