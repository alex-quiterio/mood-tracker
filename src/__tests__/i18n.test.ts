import { describe, expect, it } from '@jest/globals';

import { weeklyStats } from '@domain/checkins/stats';
import { Entry } from '@domain/checkins/types';
import { PRESET_HABITS } from '@domain/habits/habits';
import { localizeHabit } from '@ui/i18n/habits';
import { en } from '@ui/i18n/locales/en';
import {
  formatDecimal,
  formatEuros,
  formatInteger,
  longDate,
  monthTitle,
  weekdayInitials,
  weekdayShort,
} from '@ui/i18n/format';
import { localeFor, resolveLocale } from '@domain/settings/language';
import { messages } from '@ui/i18n/messages';
import { pt } from '@ui/i18n/locales/pt';
import { formatSteps } from '@ui/i18n/signals';
import { buildReflectionPrompt } from '@ui/reflection/prompt';
import { DEFAULT_QUOTES } from '@domain/voices/quotes';
import { VOICE_IDS } from '@domain/voices/voices';
import { VOICES, activeVoice, localizeVoice } from '@ui/voices/voices';
import { VOICES_PT } from '@ui/voices/locales/pt';

describe('locale', () => {
  it('maps any Portuguese to pt-PT and everything else to English', () => {
    expect(resolveLocale('pt-PT')).toBe('pt-PT');
    expect(resolveLocale('pt-BR')).toBe('pt-PT');
    expect(resolveLocale('en-GB')).toBe('en');
    expect(resolveLocale('nl-NL')).toBe('en');
    expect(resolveLocale(undefined)).toBe('en');
  });

  it('follows the phone unless a language is chosen', () => {
    expect(localeFor('system', 'pt-PT')).toBe('pt-PT');
    expect(localeFor('en', 'pt-PT')).toBe('en');
    expect(localeFor('pt-PT', 'en-US')).toBe('pt-PT');
  });
});

describe('formatting', () => {
  it('uses Portuguese separators and symbol placement', () => {
    expect(formatDecimal(3.5, 1, 'pt-PT')).toBe('3,5');
    expect(formatInteger(12480, 'pt-PT')).toBe('12 480');
    expect(formatSteps(12480, 'pt-PT')).toBe('12 480');
    expect(formatEuros(8.25, 'pt-PT')).toBe('8,25 €');
    expect(formatEuros(12, 'pt-PT')).toBe('12 €');
    expect(formatEuros(1250, 'pt-PT')).toBe('1 250 €');
    expect(formatEuros(8.25)).toBe('€8.25');
  });

  it('names days and months in Portuguese', () => {
    expect(weekdayShort('2026-10-01', 'pt-PT')).toBe('qui');
    expect(weekdayInitials('pt-PT')).toEqual(['S', 'T', 'Q', 'Q', 'S', 'S', 'D']);
    expect(monthTitle(2026, 9, 'pt-PT')).toBe('Outubro de 2026');
    expect(monthTitle(2026, 9, 'en')).toBe('October 2026');
    expect(longDate('2026-10-01', 'pt-PT')).toBe('quinta-feira, 1 de outubro');
    expect(longDate('2026-10-01', 'en')).toBe('Thursday, 1 October');
  });
});

/** Every string leaf of a catalog, with its path. Functions are called with sample arguments. */
function leaves(value: unknown, path = ''): [string, string][] {
  if (typeof value === 'string') return [[path, value]];
  if (typeof value === 'function') {
    // A numeric string works for both text (toLowerCase) and number templates.
    const args = Array.from({ length: value.length }, () => '3');
    return [[path, String((value as (...a: unknown[]) => unknown)(...args))]];
  }
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k));
  }
  return [];
}

describe('the Portuguese catalogue', () => {
  // Names, numbers and emoji-only strings read the same in both languages.
  const SAME_IN_BOTH = new Set([
    'settings.languages.en',
    'settings.languages.pt-PT',
    'practice.patterns.relax.name',
    'practice.minutesOption',
    'streak',
    'prompt.answerIn',
    'checkin.dayA11y',
    'stats.cellA11y',
  ]);

  it('has every entry English has', () => {
    expect(leaves(pt).map(([p]) => p)).toEqual(leaves(en).map(([p]) => p));
  });

  it('is actually translated', () => {
    const english = new Map(leaves(en));
    const untranslated = leaves(pt).filter(
      ([path, text]) =>
        text !== '' && text === english.get(path) && !SAME_IN_BOTH.has(path) && /[a-z]{3}/i.test(text),
    );
    expect(untranslated).toEqual([]);
  });

  it('asks Claude to answer in European Portuguese', () => {
    expect(messages('pt-PT').prompt.answerIn).toMatch(/português de Portugal/);
    expect(messages('en').prompt.answerIn).toBe('');
  });
});

describe('voices in Portuguese', () => {
  it.each(VOICE_IDS)('%s is fully translated', (id) => {
    const t = VOICES_PT[id];
    for (const field of [t.name, t.tagline, t.comfort, t.breathDone, t.claude.ask])
      expect(field.trim()).not.toBe('');
    expect(t.claude.ask.match(/\{signals\}/g)).toHaveLength(1);
    expect(Object.values(t.moodLabels)).toHaveLength(5);
    expect(Object.values(t.notePrompts).every((p) => p.trim() !== '')).toBe(true);
    if (id !== 'plain') expect(t.claude.intro).not.toBe(VOICES[id].claude.intro);
  });

  it('keeps emojis, colours and quotes as they are', () => {
    const v = localizeVoice(VOICES.marcus, 'pt-PT');
    expect(v.name).toBe('Marco Aurélio');
    expect(v.moodEmoji).toBe(VOICES.marcus.moodEmoji);
    expect(activeVoice('marcus', {}, 'pt-PT').quotes).toBe(DEFAULT_QUOTES.marcus);
    expect(localizeVoice(VOICES.marcus, 'en')).toBe(VOICES.marcus);
  });
});

describe('preset habits in Portuguese', () => {
  const making = PRESET_HABITS.find((h) => h.id === 'making')!;

  it('take the translation while untouched', () => {
    expect(localizeHabit(PRESET_HABITS[0], 'pt-PT')).toMatchObject({ name: 'Cigarros', unit: 'cigarros' });
    expect(localizeHabit(making, 'pt-PT').options![0].label).toBe('Cozinhar');
  });

  it('keep your own names and options', () => {
    const renamed = { ...PRESET_HABITS[0], name: 'Tabaco' };
    expect(localizeHabit(renamed, 'pt-PT').name).toBe('Tabaco');
    const custom = {
      ...making,
      options: [...making.options!, { id: 'garden', label: 'Gardening', emoji: '🌻' }],
    };
    expect(localizeHabit(custom, 'pt-PT').options!.at(-1)!.label).toBe('Gardening');
    expect(
      localizeHabit({ id: 'mine', name: 'Read', emoji: '📖', kind: 'grow', unit: '' }, 'pt-PT').name,
    ).toBe('Read');
  });
});

describe('the Claude prompt in Portuguese', () => {
  const entry: Entry = {
    date: '2026-10-01',
    slot: 'morning',
    mood: 2,
    recordedAt: '2026-10-01T08:00:00.000Z',
    note: 'cansado',
  };
  const prompt = buildReflectionPrompt(
    weeklyStats([entry], '2026-10-01'),
    localizeVoice(VOICES.buddha, 'pt-PT'),
    null,
    'pt-PT',
  );

  it('is written in Portuguese, framed by the voice, and asks for a Portuguese answer', () => {
    expect(prompt.startsWith(VOICES_PT.buddha.claude.intro)).toBe(true);
    expect(prompt).toContain('Aqui estão os meus registos de humor');
    expect(prompt).toContain('  manhã: 2/5 — "cansado"');
    expect(prompt).toContain('  tarde: sem registo');
    expect(prompt).toContain('qui 2026-10-01');
    expect(prompt).toContain('Médias: manhã 2,0');
    expect(prompt.trim().endsWith('Responde em português de Portugal.')).toBe(true);
    expect(prompt).not.toContain('{signals}');
  });
});
