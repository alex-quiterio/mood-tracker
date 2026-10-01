import { describe, expect, it } from '@jest/globals';

import { parseEntry } from '@domain/checkins/entries';
import { clampSleepHours, isEmptySleep, parseSleep, sameSleep, sleepWeek } from '@domain/checkins/sleep';
import { weeklyStats } from '@domain/checkins/stats';
import { Entry } from '@domain/checkins/types';
import { LOCK_AFTER_MS, shouldLockOnReturn } from '@domain/settings/lock';
import { formatHours } from '@ui/i18n/format';
import { describeSleep, promptSleepText } from '@ui/i18n/sleep';
import { buildReflectionPrompt } from '@ui/reflection/prompt';
import { VOICES, voiceFor } from '@ui/voices/voices';

const today = '2026-10-01';
const entry = (date: string, slot: Entry['slot'], mood: Entry['mood'], sleep?: Entry['sleep']): Entry => ({
  date,
  slot,
  mood,
  recordedAt: `${date}T08:00:00.000Z`,
  ...(sleep ? { sleep } : {}),
});

describe('sleep', () => {
  it('rounds hours to half hours within 0–14', () => {
    expect(clampSleepHours(7.3)).toBe(7.5);
    expect(clampSleepHours(7.2)).toBe(7);
    expect(clampSleepHours(-1)).toBe(0);
    expect(clampSleepHours(20)).toBe(14);
  });

  it('parses quality and hours, empty as nothing and bad values as invalid', () => {
    expect(parseSleep({ quality: 4, hours: 7.4 })).toEqual({ quality: 4, hours: 7.5 });
    expect(parseSleep({ hours: 6 })).toEqual({ hours: 6 });
    expect(parseSleep({})).toBeUndefined();
    expect(parseSleep({ quality: 6 })).toBeNull();
    expect(parseSleep({ hours: 'lots' })).toBeNull();
    expect(parseEntry({ ...entry(today, 'morning', 3), sleep: { quality: 9 } })).toBeNull();
    expect(parseEntry(entry(today, 'morning', 3, { quality: 2, hours: 5 }))?.sleep).toEqual({
      quality: 2,
      hours: 5,
    });
  });

  it('compares and recognizes empty logs', () => {
    expect(isEmptySleep({})).toBe(true);
    expect(sameSleep({ hours: 7 }, { hours: 7 })).toBe(true);
    expect(sameSleep({ hours: 7 }, undefined)).toBe(false);
    expect(sameSleep(undefined, {})).toBe(true);
  });

  it('summarizes the week and compares days after good and short nights', () => {
    const entries = [
      entry('2026-09-30', 'morning', 4, { quality: 4, hours: 8 }),
      entry('2026-09-30', 'evening', 5),
      entry(today, 'morning', 2, { quality: 2, hours: 5 }),
      entry(today, 'evening', 3),
      entry('2026-09-20', 'morning', 1, { hours: 3 }), // outside the week
    ];
    expect(sleepWeek(entries, today)).toEqual({
      nights: 2,
      averageQuality: 3,
      averageHours: 6.5,
      moodAfterGood: 4.5,
      moodAfterShort: 2.5,
    });
  });
});

describe('sleep in words', () => {
  it('formats hours per language', () => {
    expect(formatHours(8)).toBe('8');
    expect(formatHours(7.5)).toBe('7.5');
    expect(formatHours(7.5, 'pt-PT')).toBe('7,5');
  });

  it('describes a night briefly', () => {
    expect(describeSleep({ quality: 4, hours: 7.5 })).toBe('🌙 7.5 h · Well');
    expect(describeSleep({ hours: 6 }, 'pt-PT')).toBe('🌙 6 h');
    expect(describeSleep({})).toBe('');
    expect(promptSleepText({ quality: 4, hours: 7.5 })).toBe('7.5h, sleep 4/5');
  });

  it('always goes into the Claude prompt', () => {
    const entries = [
      entry('2026-09-30', 'morning', 4, { quality: 4, hours: 8 }),
      entry(today, 'morning', 2, { quality: 2, hours: 5 }),
    ];
    const prompt = buildReflectionPrompt(weeklyStats(entries, today), VOICES.plain);
    expect(prompt).toContain('morning: 4/5; slept 8h, sleep 4/5');
    expect(prompt).toContain('Sleep this week: 6.5h a night on average, quality 3.0/5.');
    expect(prompt).toContain('Average mood on days after 7h+ of sleep: 4.0; after under 6h: 2.0.');
    const pt = buildReflectionPrompt(weeklyStats(entries, today), voiceFor('plain', 'pt-PT'), null, 'pt-PT');
    expect(pt).toContain('manhã: 4/5; dormi 8 h, sono 4/5');
    expect(pt).toContain('Sono desta semana: 6,5 h por noite em média');
  });

  it('leaves sleep out of the prompt when none was logged', () => {
    expect(buildReflectionPrompt(weeklyStats([entry(today, 'morning', 3)], today))).not.toMatch(
      /slept|Sleep/,
    );
  });
});

describe('app lock', () => {
  const away = Date.UTC(2026, 9, 1, 9, 0);

  it('locks again after a minute away, only when on', () => {
    expect(shouldLockOnReturn(true, away, away + LOCK_AFTER_MS)).toBe(true);
    expect(shouldLockOnReturn(true, away, away + LOCK_AFTER_MS - 1)).toBe(false);
    expect(shouldLockOnReturn(false, away, away + 10 * LOCK_AFTER_MS)).toBe(false);
    expect(shouldLockOnReturn(true, null, away)).toBe(false);
    expect(LOCK_AFTER_MS).toBe(60_000);
  });
});
