import { describe, expect, it } from '@jest/globals';

import { parseSettings } from '@domain/settings/settings';
import { parseTimeZone, timeZoneFor, wallClock } from '@domain/settings/timeZone';

describe('time zone setting', () => {
  it('defaults to following the phone', () => {
    expect(parseSettings({}).timeZone).toBe('system');
    expect(parseTimeZone(undefined)).toBe('system');
    expect(parseTimeZone('not a zone')).toBe('system');
    expect(parseTimeZone(42)).toBe('system');
  });

  it('keeps a stored zone', () => {
    expect(parseSettings({ timeZone: 'Atlantic/Azores' }).timeZone).toBe('Atlantic/Azores');
    expect(parseTimeZone('America/Sao_Paulo')).toBe('America/Sao_Paulo');
    expect(parseTimeZone('UTC')).toBe('UTC');
  });

  it('uses the phone zone when automatic', () => {
    expect(timeZoneFor('system', 'Europe/Lisbon')).toBe('Europe/Lisbon');
    expect(timeZoneFor('system', null)).toBeNull();
    expect(timeZoneFor('Asia/Tokyo', 'Europe/Lisbon')).toBe('Asia/Tokyo');
  });
});

describe('wall clock', () => {
  const instant = new Date('2026-10-01T23:30:00Z');

  it('shows an instant in the given zone', () => {
    expect(wallClock(instant, 'UTC')).toEqual({ date: '2026-10-01', time: '23:30' });
    expect(wallClock(instant, 'Europe/Lisbon')).toEqual({ date: '2026-10-02', time: '00:30' });
    expect(wallClock(instant, 'America/New_York')).toEqual({ date: '2026-10-01', time: '19:30' });
  });

  it('falls back to local time without a known zone', () => {
    const local = wallClock(instant, null);
    expect(wallClock(instant, 'Nowhere/Atlantis')).toEqual(local);
    expect(local.time).toMatch(/^\d{2}:\d{2}$/);
  });
});
