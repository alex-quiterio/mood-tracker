import { StyleSheet, Switch, Text, View } from 'react-native';

import { useLocale } from '@ui/foundation/i18n/LocaleContext';
import { Palette, useColors, useThemedStyles } from '@ui/foundation/theme/theme';

type Props = { value: boolean; onChange: (include: boolean) => void };

/** "Include my habits" in the Claude prompts. One setting, shown next to each reflect button. */
export function HabitsInPromptSwitch({ value, onChange }: Props) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { m } = useLocale();
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{m.stats.includeHabits}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: c.accent, false: c.border }}
        thumbColor={c.surface}
        accessibilityLabel={m.stats.includeHabitsA11y}
      />
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    label: { color: c.text, fontSize: 15 },
  });
