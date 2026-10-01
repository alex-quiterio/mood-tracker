import { describe, expect, it } from '@jest/globals';

import { stepCounter } from '../../modules/step-counter';
import { unlockStats } from '../../modules/unlock-stats';

// In tests (like Expo Go) the native modules are missing; every call must fall back safely.
describe('native modules without native code', () => {
  it('step counter reports unsupported and counts nothing', async () => {
    expect(stepCounter.isSupported()).toBe(false);
    expect(stepCounter.hasPermission()).toBe(false);
    expect(await stepCounter.subscribe()).toBe(false);
    expect(await stepCounter.countSteps(new Date(0), new Date())).toBeNull();
  });

  it('unlock stats reports unsupported and counts nothing', async () => {
    expect(unlockStats.isSupported()).toBe(false);
    expect(unlockStats.hasUsageAccess()).toBe(false);
    expect(await unlockStats.countUnlocks(new Date(0), new Date())).toBeNull();
  });
});
