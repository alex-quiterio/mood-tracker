import type { Messages } from '@ui/foundation/i18n/messages.types';

import { messages } from './messages';
import { voices } from './voices';

/** Português europeu: the app's text and the voices' words. */
export const pt: Messages = { ...messages, voices };
