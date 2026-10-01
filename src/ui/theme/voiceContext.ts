import { createContext, useContext } from 'react';

import { ActiveVoice, activeVoice } from '../../domain/voices/voices';

export const VoiceContext = createContext<ActiveVoice>(activeVoice('plain', {}));

export const useVoice = () => useContext(VoiceContext);
