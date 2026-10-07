import { StyleSheet, View } from 'react-native';
import { Text } from '@ui/kit/Text';

import {
  SLEEP_HOURS_MAX,
  SLEEP_HOURS_START,
  SLEEP_HOURS_STEP,
  Sleep,
  clampSleepHours,
} from '@domain/checkins/sleep';
import { MOODS } from '@domain/checkins/types';
import { Chip } from '@ui/kit/Chip';
import { RoundButton } from '@ui/kit/RoundButton';
import { formatHours } from '@ui/foundation/i18n/format';
import { useLocale } from '@ui/foundation/i18n/LocaleContext';
import { Palette, spacing, useThemedStyles } from '@ui/foundation/theme/theme';

type Props = { sleep: Sleep; onChange: (sleep: Sleep) => void };

/** Last night's sleep, on the morning check-in: how it was, and roughly how long, in half hours. */
export function SleepLogger({ sleep, onChange }: Props) {
  const styles = useThemedStyles(makeStyles);
  const { m, locale } = useLocale();
  // Hours start blank; the first tap on − or + starts from a typical night.
  const step = (delta: number) =>
    onChange({ ...sleep, hours: clampSleepHours((sleep.hours ?? SLEEP_HOURS_START - delta) + delta) });

  return (
    <View style={styles.root}>
      <Text style={styles.heading}>{m.sleep.title}</Text>
      <View style={styles.chips} accessibilityRole="radiogroup">
        {MOODS.map((q) => (
          <Chip
            key={q}
            label={m.sleep.quality[q]}
            selected={sleep.quality === q}
            onPress={() => onChange({ ...sleep, quality: sleep.quality === q ? undefined : q })}
          />
        ))}
      </View>
      <View style={styles.hoursRow}>
        <Text style={styles.label}>{m.sleep.hoursLabel}</Text>
        <RoundButton
          label="−"
          accessibilityLabel={m.sleep.fewerHours}
          onPress={() => step(-SLEEP_HOURS_STEP)}
          disabled={sleep.hours === 0}
        />
        <Text style={styles.hours}>
          {sleep.hours === undefined ? '–' : m.sleep.hours(formatHours(sleep.hours, locale))}
        </Text>
        <RoundButton
          label="+"
          accessibilityLabel={m.sleep.moreHours}
          onPress={() => step(SLEEP_HOURS_STEP)}
          disabled={sleep.hours === SLEEP_HOURS_MAX}
        />
      </View>
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { gap: spacing(2), paddingTop: spacing(1), borderTopWidth: 1, borderTopColor: c.border },
    heading: {
      fontSize: 12,
      fontWeight: '600',
      color: c.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: spacing(2),
    },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2) },
    hoursRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(2) },
    label: { flex: 1, fontSize: 15, color: c.text },
    hours: { minWidth: 56, textAlign: 'center', fontSize: 17, fontWeight: '700', color: c.text },
  });
