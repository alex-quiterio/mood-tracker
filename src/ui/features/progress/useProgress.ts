import { useMemo } from 'react';

import { Entry } from '@domain/checkins/types';
import { Urge } from '@domain/habits/urges';
import { Level, XpCounts, levelFor, titleIndex, totalXp, xpCounts } from '@domain/progress/xp';
import { useVoice } from '@ui/foundation/theme/voiceContext';

export type Progress = { counts: XpCounts; level: Level; title: string; titles: string[] };

/** XP, level and the voice's title for it, from the saved check-ins and urges. */
export function useProgress(entries: Entry[], urges: Urge[], today: string): Progress {
  const voice = useVoice();
  return useMemo(() => {
    const counts = xpCounts(entries, urges, today);
    const level = levelFor(totalXp(counts));
    return {
      counts,
      level,
      title: voice.levels[titleIndex(level.level, voice.levels.length)],
      titles: voice.levels,
    };
  }, [entries, urges, today, voice.levels]);
}
