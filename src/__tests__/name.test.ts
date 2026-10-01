import { describe, expect, it, jest } from '@jest/globals';

import { greetingText } from '../moments';
import { NAME_MAX_LENGTH, cleanName } from '../storage';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

describe('name', () => {
  it('is trimmed, shortened, and empty when not a string', () => {
    expect(cleanName('  Alex  ')).toBe('Alex');
    expect(cleanName('x'.repeat(100))).toHaveLength(NAME_MAX_LENGTH);
    expect(cleanName(undefined)).toBe('');
    expect(cleanName(42)).toBe('');
  });

  it('is used in the greeting when set', () => {
    expect(greetingText('morning', 'Alex')).toBe('Good morning, Alex');
    expect(greetingText('evening', '')).toBe('Good evening');
  });
});
