import { MODULE_IDS, type HabitModule, type ModuleId } from './modules';
import { TRIGGER_ECOLOGY } from './triggerEcology/definition';

/** Every habit module, by id. Being a `Record`, a new id in MODULE_IDS is a type error here until it's registered. */
export const MODULES: Record<ModuleId, HabitModule> = {
  'trigger-ecology': TRIGGER_ECOLOGY,
};

export const isModuleId = (v: unknown): v is ModuleId => MODULE_IDS.includes(v as ModuleId);
