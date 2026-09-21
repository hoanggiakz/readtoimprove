/**
 * Validates and sanitizes a returnUrl parameter to prevent Open Redirect attacks.
 * Only allows same-origin relative paths starting with a single '/' and rejects
 * protocol-relative URLs ('//'), backslashes ('\'), control characters, and external schemes.
 */
export function sanitizeReturnUrl(url: string | null | undefined, fallback: string = '/'): string {
  if (!url || typeof url !== 'string') {
    return fallback;
  }

  const trimmed = url.trim();

  // Reject empty string
  if (trimmed.length === 0) {
    return fallback;
  }

  // Reject protocol-relative URLs (e.g. "//evil.com") and mixed slash attacks (e.g. "/\evil.com")
  if (trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return fallback;
  }

  // Must begin with a single forward slash
  if (!trimmed.startsWith('/')) {
    return fallback;
  }

  // Reject backslashes anywhere in path (browsers often normalize \ to /)
  if (trimmed.includes('\\')) {
    return fallback;
  }

  // Reject URLs containing control characters or whitespace
  if (/[\x00-\x1F\x7F\s]/.test(trimmed)) {
    return fallback;
  }

  // Reject if it attempts to embed a scheme (e.g. "/https://evil.com" or "/javascript:")
  // Check for colon before query or hash
  const pathWithoutQuery = trimmed.split('?')[0].split('#')[0];
  if (pathWithoutQuery.includes(':')) {
    return fallback;
  }

  return trimmed;
}
