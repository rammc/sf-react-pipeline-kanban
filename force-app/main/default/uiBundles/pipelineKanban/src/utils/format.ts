/**
 * Locale-aware formatters for the Kanban view.
 *
 * Salesforce's GraphQL API returns Currency and Date fields with a
 * `value` (raw, machine-friendly) and a `displayValue` (server-formatted
 * using the user's locale and CurrencyIsoCode). We deliberately read
 * `value` and format on the client with Intl — this keeps the locale
 * decision explicit, observable, and easy to override per view.
 *
 * Alternative path: read Amount.displayValue / CloseDate.displayValue
 * directly if the locale must always match the server profile.
 */

const CURRENCY_FORMAT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const DATE_FORMAT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return '—';
  return CURRENCY_FORMAT.format(amount);
}

export function formatCloseDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return DATE_FORMAT.format(new Date(iso));
}

/** Two-letter initials for the avatar fallback ("Marc Benioff" → "MB"). */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map(part => part[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');
}
