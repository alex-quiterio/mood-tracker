import { describe, expect, it, jest } from '@jest/globals';
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

import { greetingText } from '@domain/checkins/moments';
import { NAME_MAX_LENGTH, cleanName } from '@domain/settings/settings';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

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
