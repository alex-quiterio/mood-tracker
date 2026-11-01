import type { ComponentType } from 'react';

import type { ModuleId, ModuleInput } from '@domain/habitModules/modules';

import { TriggerEcologyView } from './triggerEcology/TriggerEcologyView';

/** What every module's view is handed by the host; it never reaches for app state itself. */
export type ModuleViewProps = {
  input: ModuleInput;
  /** The module's saved state, already parsed by its own `parseState`. */
  state: unknown;
  onStateChange: (state: unknown) => void;
};

/** Each module's view. A `Record`, so a module registered in the domain without a view is a type error. */
export const MODULE_VIEWS: Record<ModuleId, ComponentType<ModuleViewProps>> = {
  'trigger-ecology': TriggerEcologyView,
};
