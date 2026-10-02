import { createContext, useContext } from 'react';

import { Locale } from '@domain/settings/language';
import { Messages, messages } from './messages';

/** `timeZone` is the zone check-in times are shown in, or null for the phone's clock. */
export type LocaleValue = { locale: Locale; m: Messages; timeZone: string | null };

export const LocaleContext = createContext<LocaleValue>({ locale: 'en', m: messages('en'), timeZone: null });

/** The current language, its text and time zone: `const { m, locale } = useLocale()`. */
export const useLocale = () => useContext(LocaleContext);
