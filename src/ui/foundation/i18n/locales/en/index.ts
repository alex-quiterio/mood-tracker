import type { Messages } from '@ui/foundation/i18n/messages.types';

import { messages } from './messages';
import { voices } from './voices';

/** English: the app's text and the voices' words. */
export const en: Messages = { ...messages, voices };
