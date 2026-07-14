export type UiSettings = Record<string, string>;

const uiToApiMap = {
  fine_rate_per_day: 'fineRatePerDay',
  max_borrow_days: 'borrowDays',
  max_books_per_member: 'maxBooksPerMember',
  reservation_expiry_days: 'reservationExpiryDays',
} as const;

type UiSettingKey = keyof typeof uiToApiMap;

export function normalizeSettings(settings: Record<string, unknown> | undefined): UiSettings {
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) return {};

  return {
    fine_rate_per_day: toSettingString(settings.fineRatePerDay ?? settings.fine_rate_per_day),
    max_borrow_days: toSettingString(settings.borrowDays ?? settings.max_borrow_days ?? settings.borrow_days),
    max_books_per_member: toSettingString(settings.maxBooksPerMember ?? settings.max_books_per_member),
    reservation_expiry_days: toSettingString(settings.reservationExpiryDays ?? settings.reservation_expiry_days),
  };
}

export function settingsToApiPayload(values: UiSettings): Record<string, number> {
  return Object.entries(uiToApiMap).reduce<Record<string, number>>((payload, [uiKey, apiKey]) => {
    const value = Number(values[uiKey as UiSettingKey]);
    if (Number.isFinite(value)) payload[apiKey] = value;
    return payload;
  }, {});
}

export function maxBooksPerMember(settings: Record<string, unknown> | undefined): number {
  const normalized = normalizeSettings(settings);
  return Number(normalized.max_books_per_member || 0);
}

function toSettingString(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value);
}
