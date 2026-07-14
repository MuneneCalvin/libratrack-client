import { describe, expect, it } from 'vitest';
import { normalizeSettings, settingsToApiPayload } from '@/lib/settingsContract';

describe('settings contract helpers', () => {
  it('normalizes PHP camelCase settings into UI keys', () => {
    expect(normalizeSettings({
      fineRatePerDay: 10,
      borrowDays: 14,
      maxBooksPerMember: 5,
      reservationExpiryDays: 3,
    })).toEqual({
      fine_rate_per_day: '10',
      max_borrow_days: '14',
      max_books_per_member: '5',
      reservation_expiry_days: '3',
    });
  });

  it('keeps old snake_case settings compatible', () => {
    expect(normalizeSettings({
      fine_rate_per_day: '15',
      borrow_days: '21',
      max_borrow_days: '28',
      max_books_per_member: '6',
      reservation_expiry_days: '4',
    })).toEqual({
      fine_rate_per_day: '15',
      max_borrow_days: '28',
      max_books_per_member: '6',
      reservation_expiry_days: '4',
    });
  });

  it('maps UI keys back to PHP camelCase update payload', () => {
    expect(settingsToApiPayload({
      fine_rate_per_day: '12',
      max_borrow_days: '10',
      max_books_per_member: '7',
      reservation_expiry_days: '2',
    })).toEqual({
      fineRatePerDay: 12,
      borrowDays: 10,
      maxBooksPerMember: 7,
      reservationExpiryDays: 2,
    });
  });
});
