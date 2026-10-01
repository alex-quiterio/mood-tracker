import { createContext, useContext } from 'react';

import { Locale } from '@domain/settings/language';
import { Messages, messages } from '@ui/i18n/messages';

export type LocaleValue = { locale: Locale; m: Messages };

export const LocaleContext = createContext<LocaleValue>({ locale: 'en', m: messages('en') });

/** The current language and its text: `const { m, locale } = useLocale()`. */
export const useLocale = () => useContext(LocaleContext);
