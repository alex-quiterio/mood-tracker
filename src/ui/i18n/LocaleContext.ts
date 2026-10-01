import { createContext, useContext } from 'react';

import { Locale } from '@domain/i18n/locale';
import { Messages, messages } from '@domain/i18n/messages';

export type LocaleValue = { locale: Locale; m: Messages };

export const LocaleContext = createContext<LocaleValue>({ locale: 'en', m: messages('en') });

/** The current language and its text: `const { m, locale } = useLocale()`. */
export const useLocale = () => useContext(LocaleContext);
