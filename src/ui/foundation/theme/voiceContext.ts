import { createContext, useContext } from 'react';

import { ActiveVoice, activeVoice } from '@ui/foundation/voices/voices';

export const VoiceContext = createContext<ActiveVoice>(activeVoice('plain', {}));

export const useVoice = () => useContext(VoiceContext);
