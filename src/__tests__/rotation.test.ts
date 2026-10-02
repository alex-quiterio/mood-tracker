import { describe, expect, it } from '@jest/globals';

import { DEFAULT_SETTINGS, parseSettings } from '@domain/settings/settings';
import { addDays } from '@domain/shared/dates';
import { DEFAULT_ROTATION_VOICES, voiceForDay } from '@domain/voices/rotation';
import { VOICE_IDS } from '@domain/voices/voices';

describe('voice rotation', () => {
  const three = ['rumi', 'laoTzu', 'marcus'] as const;

  it('keeps the chosen voice when off, or with nothing to rotate', () => {
    expect(voiceForDay('off', [...three], 'seneca', '2026-10-02')).toBe('seneca');
    expect(voiceForDay('daily', [], 'seneca', '2026-10-02')).toBe('seneca');
  });

  it('takes turns every day, in the app’s voice order', () => {
    const week = Array.from({ length: 6 }, (_, i) =>
      voiceForDay('daily', [...three], 'plain', addDays('2026-10-02', i)),
    );
    // Order follows VOICE_IDS (laoTzu, marcus, rumi), whatever order they were picked in.
    expect(new Set(week)).toEqual(new Set(three));
    expect(week[3]).toBe(week[0]);
    expect(week[1]).not.toBe(week[0]);
  });

  it('changes every Monday when weekly', () => {
    // 2026-09-28 is a Monday.
    const monday = voiceForDay('weekly', [...three], 'plain', '2026-09-28');
    for (let i = 1; i < 7; i++)
      expect(voiceForDay('weekly', [...three], 'plain', addDays('2026-09-28', i))).toBe(monday);
    expect(voiceForDay('weekly', [...three], 'plain', '2026-10-05')).not.toBe(monday);
    expect(voiceForDay('weekly', [...three], 'plain', '2026-10-04')).toBe(monday);
  });

  it('rotates every voice but Plain by default', () => {
    expect(DEFAULT_ROTATION_VOICES).toEqual(VOICE_IDS.filter((id) => id !== 'plain'));
  });

  it('parses the settings, falling back on anything unknown', () => {
    expect(DEFAULT_SETTINGS.voiceRotation).toBe('off');
    expect(parseSettings({ voiceRotation: 'weekly', rotationVoices: ['rumi', 'nobody'] })).toMatchObject({
      voiceRotation: 'weekly',
      rotationVoices: ['rumi'],
    });
    expect(parseSettings({ voiceRotation: 'hourly', rotationVoices: [] })).toMatchObject({
      voiceRotation: 'off',
      rotationVoices: DEFAULT_ROTATION_VOICES,
    });
  });
});
