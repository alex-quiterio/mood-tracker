import { StyleSheet, Text, View } from 'react-native';

import { Palette, spacing, useThemedStyles } from '@ui/foundation/theme/theme';
import { useLocale } from '@ui/foundation/i18n/LocaleContext';

import { RoundButton } from './RoundButton';

type Props = { value: number; min?: number; max: number; onChange: (n: number) => void };

/** − value + for a small whole number. */
export function Stepper({ value, min = 0, max, onChange }: Props) {
  const styles = useThemedStyles(makeStyles);
  const { m } = useLocale();
  return (
    <View style={styles.row}>
      <RoundButton
        label="−"
        accessibilityLabel={m.common.less}
        onPress={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
      />
      <Text style={styles.value}>{value}</Text>
      <RoundButton
        label="+"
        accessibilityLabel={m.common.more}
        onPress={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
      />
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing(2) },
    value: { minWidth: 28, textAlign: 'center', fontSize: 16, fontWeight: '700', color: c.text },
  });
