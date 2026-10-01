import { describe, expect, it } from '@jest/globals';

import { uniqueId } from '@domain/shared/ids';
import { average } from '@domain/shared/math';

describe('average', () => {
  it('is the mean, or null for nothing', () => {
    expect(average([2, 3, 4])).toBe(3);
    expect(average([])).toBeNull();
  });
});

describe('uniqueId', () => {
  it('slugs the label and avoids taken ids', () => {
    expect(uniqueId('Read before bed', [], 'habit')).toBe('read-before-bed');
    expect(uniqueId('Walk', ['walk', 'walk-2'], 'habit')).toBe('walk-3');
    expect(uniqueId('  ☕ ', [], 'habit')).toBe('habit');
    expect(uniqueId('☕', ['habit'], 'habit')).toBe('habit-2');
  });
});
