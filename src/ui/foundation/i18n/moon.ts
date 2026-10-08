import { Locale } from '@domain/settings/language';
import { Moon, MoonPhase } from '@domain/moon/phase';

import { messages } from './messages';

/** As seen from the northern hemisphere, where the phone lives. */
const MOON_EMOJI: Record<MoonPhase, string> = {
  new: '🌑',
  waxingCrescent: '🌒',
  firstQuarter: '🌓',
  waxingGibbous: '🌔',
  full: '🌕',
  waningGibbous: '🌖',
  lastQuarter: '🌗',
  waningCrescent: '🌘',
};

/** "🌔" */
export const moonEmoji = (moon: Moon) => MOON_EMOJI[moon.phase];

/** "🌔 Waxing gibbous" */
export const moonLabel = (moon: Moon, locale: Locale = 'en') =>
  `${moonEmoji(moon)} ${messages(locale).moon.phases[moon.phase]}`;

/** "Today's moon: Waxing gibbous, 78% lit" */
export const moonA11y = (moon: Moon, locale: Locale = 'en') => {
  const m = messages(locale).moon;
  return m.a11y(m.phases[moon.phase], Math.round(moon.illumination * 100));
};
