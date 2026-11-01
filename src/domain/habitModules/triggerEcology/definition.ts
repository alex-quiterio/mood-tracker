import type { HabitModule } from '@domain/habitModules/modules';

import { parseTriggerEcologyState } from './experiments';

/**
 * Trigger ecology: for cannabis, what surrounds an urge (feelings, place, company,
 * the body, a short night), how urges turn into doses or pass, when they come, and
 * what follows, with small experiments to test a hunch about one trigger.
 */
export const TRIGGER_ECOLOGY: HabitModule = {
  id: 'trigger-ecology',
  // English and Portuguese words for it; accents and case don't matter ("Canábis" is "canabis").
  keywords: ['weed', 'cannabis', 'canabis', 'marijuana', 'marihuana', 'ganza', 'charro', 'haxixe'],
  kinds: ['reduce', 'balance'],
  data: {
    required: ['doses'],
    optional: ['urges', 'feelings', 'context', 'moods', 'sleep'],
  },
  capabilities: [
    'emotionalTriggers',
    'environmentalTriggers',
    'physiologicalTriggers',
    'urgesAndDoses',
    'pauses',
    'rhythm',
    'combinations',
    'beforeAfter',
    'experiments',
  ],
  collects: { urgeContext: ['alone', 'withOthers', 'home', 'out', 'work', 'screens', 'hungry', 'inPain'] },
  parseState: parseTriggerEcologyState,
};
