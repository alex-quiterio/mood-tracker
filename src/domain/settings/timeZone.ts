import { localDate } from '@domain/shared/dates';

/** The time zone setting: follow the phone ('system'), or a fixed IANA zone such as "Europe/Lisbon". */
export type TimeZoneSetting = 'system' | string;

/** Zones offered in Settings besides the phone's own. */
export const TIME_ZONES = [
  'Europe/Lisbon',
  'Atlantic/Madeira',
  'Atlantic/Azores',
  'Europe/London',
  'Europe/Madrid',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Athens',
  'America/Sao_Paulo',
  'America/New_York',
  'America/Los_Angeles',
  'Asia/Tokyo',
  'UTC',
];

const ZONE_SHAPE = /^(UTC|[A-Za-z]+(\/[A-Za-z0-9_+-]+)+)$/;

/** A stored time zone setting, or 'system' when it's missing or doesn't look like a zone name. */
export function parseTimeZone(value: unknown): TimeZoneSetting {
  return typeof value === 'string' && ZONE_SHAPE.test(value) ? value : 'system';
}

/** The zone to show times in, or null to use the phone's clock as it is. */
export const timeZoneFor = (setting: TimeZoneSetting, deviceZone: string | null | undefined) =>
  setting === 'system' ? (deviceZone ?? null) : setting;

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * The wall-clock date (YYYY-MM-DD) and time (HH:MM) of an instant in a time zone.
 * Falls back to the phone's local time when there is no zone or the engine doesn't know it.
 */
export function wallClock(instant: Date, timeZone: string | null): { date: string; time: string } {
  if (timeZone) {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      }).formatToParts(instant);
      const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
      return {
        date: `${get('year')}-${get('month')}-${get('day')}`,
        time: `${get('hour')}:${get('minute')}`,
      };
    } catch {
      // Unknown zone or no Intl time zone data: fall through to local time.
    }
  }
  return {
    date: localDate(instant),
    time: `${pad(instant.getHours())}:${pad(instant.getMinutes())}`,
  };
}
