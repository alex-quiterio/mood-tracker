import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { SLEEP_HOURS_MAX, sleepOverTime } from '@domain/checkins/sleep';
import { Entry } from '@domain/checkins/types';
import { dayOfMonth } from '@domain/shared/dates';
import { formatAverage, formatHours, weekdayShort } from '@ui/foundation/i18n/format';
import { useLocale } from '@ui/foundation/i18n/LocaleContext';
import { Palette, radius, spacing, useThemedStyles } from '@ui/foundation/theme/theme';
import { Card } from '@ui/kit/Card';
import { Text } from '@ui/kit/Text';

type Props = { entries: Entry[]; today: string };

/** Bedtime, hours slept and the morning's mood for the last two weeks; neutral numbers, nothing graded. */
export function SleepOverTime({ entries, today }: Props) {
  const styles = useThemedStyles(makeStyles);
  const { m, locale } = useLocale();
  // Folded to its title and the one comparison; the nights open on a tap.
  const [open, setOpen] = useState(false);
  const { nights, moodAfterGood, moodAfterShorter } = sleepOverTime(entries, today);
  if (nights.length === 0) return null;

  return (
    <Card>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((v) => !v)}
        style={styles.header}
      >
        <Text style={styles.title}>{m.sleep.overTimeTitle}</Text>
        <Text style={styles.chevron}>{open ? '⌃' : '⌄'}</Text>
      </Pressable>
      {open && <Text style={styles.muted}>{m.sleep.overTimeHint}</Text>}
      {moodAfterGood !== null && moodAfterShorter !== null && (
        <Text style={styles.text}>
          {m.sleep.moodAfter(formatAverage(moodAfterGood, locale), formatAverage(moodAfterShorter, locale))}
        </Text>
      )}
      {open &&
        nights.map((n) => {
          const day = `${weekdayShort(n.date, locale)} ${dayOfMonth(n.date)}`;
          const hours = n.hours === null ? '' : formatHours(n.hours, locale);
          return (
            <View
              key={n.date}
              style={styles.row}
              accessible
              accessibilityLabel={m.sleep.nightA11y(day, n.bedtime ?? '', hours, n.mood)}
            >
              <Text style={styles.day}>{day}</Text>
              <Text style={styles.bed}>{n.bedtime ?? '–'}</Text>
              <View style={styles.track}>
                {n.hours !== null && (
                  <View style={[styles.bar, { width: `${(n.hours / SLEEP_HOURS_MAX) * 100}%` }]} />
                )}
              </View>
              <Text style={styles.hours}>{hours ? m.sleep.hours(hours) : '–'}</Text>
              <Text style={styles.mood}>{n.mood}</Text>
            </View>
          );
        })}
    </Card>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    chevron: { color: c.muted, fontSize: 16 },
    title: { color: c.text, fontSize: 15, fontWeight: '700' },
    muted: { color: c.muted, fontSize: 12 },
    text: { color: c.text, fontSize: 14 },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing(2) },
    day: { width: 52, color: c.muted, fontSize: 12 },
    bed: { width: 42, color: c.text, fontSize: 12 },
    track: { flex: 1, height: 8, borderRadius: radius.pill, backgroundColor: c.border, overflow: 'hidden' },
    bar: { height: 8, borderRadius: radius.pill, backgroundColor: c.accent },
    hours: { width: 48, textAlign: 'right', color: c.text, fontSize: 12 },
    mood: { width: 16, textAlign: 'right', color: c.muted, fontSize: 12 },
  });
