/**
 * Redacts common secret-bearing fields from structured objects before logging or persistence.
 */

const REDACTED = '[REDACTED]';
const SENSITIVE_KEY_PATTERN =
  /authorization|cookie|api[-_]?key|token|secret|password|clientSecret|accessToken|refreshToken/i;

function redactEntry(key: string, value: unknown): unknown {
  if (SENSITIVE_KEY_PATTERN.test(key)) {
    return REDACTED;
  }

  return redactSensitiveFields(value);
}

export function redactSensitiveFields(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactSensitiveFields(item));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entryValue]) => [
        key,
        redactEntry(key, entryValue),
      ])
    );
  }

  return value;
}

export function stringifyRedacted(value: unknown): string {
  try {
    return JSON.stringify(redactSensitiveFields(value));
  } catch {
    return JSON.stringify({ error: 'Failed to serialize payload' });
  }
}
