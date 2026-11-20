import { useState } from 'react';
import { Alert, Share, StyleSheet, View } from 'react-native';

import { clampRange, periodReview } from '@domain/checkins/monthly';
import { Habit } from '@domain/habits/habits';
import { addDays } from '@domain/shared/dates';
import { Button } from '@ui/kit/Button';
import { Card } from '@ui/kit/Card';
import { Chip } from '@ui/kit/Chip';
import { RoundButton } from '@ui/kit/RoundButton';
import { Text } from '@ui/kit/Text';
import { EntriesStore } from '@ui/state/useEntries';
import { fullDate } from '@ui/foundation/i18n/format';
import { useLocale } from '@ui/foundation/i18n/LocaleContext';
import { Palette, spacing, useThemedStyles } from '@ui/foundation/theme/theme';
import { useVoice } from '@ui/foundation/theme/voiceContext';

import { buildMonthlyPrompt } from './monthPrompt';

type Props = {
  store: EntriesStore;
  habits: Habit[];
  habitsInPrompt: boolean;
  today: string;
};

type Range = { from: string; to: string };

/** Pick any stretch of days (up to a year) and send a reflection on it to Claude. */
export function RangeReflectionCard({ store, habits, habitsInPrompt, today }: Props) {
  const styles = useThemedStyles(makeStyles);
  const voice = useVoice();
  const { m, locale } = useLocale();
  const r = m.range;
  const [range, setRange] = useState<Range>({ from: addDays(today, -13), to: today });
  const { from, to } = clampRange(range.from, range.to, today);
  const review = periodReview(store.entries, habits, from, to);

  const presets: { label: string; range: Range }[] = [
    { label: r.last7, range: { from: addDays(today, -6), to: today } },
    { label: r.last90, range: { from: addDays(today, -89), to: today } },
    { label: r.thisYear, range: { from: `${today.slice(0, 4)}-01-01`, to: today } },
  ];

  const move = (end: keyof Range, days: number) =>
    setRange(
      clampRange(
        end === 'from' ? addDays(from, days) : from,
        end === 'to' ? addDays(to, days) : to,
        today,
        end,
      ),
    );

  const reflect = async () => {
    try {
      // Opens Android's share sheet; pick the Claude app. No API calls involved.
      await Share.share({
        message: buildMonthlyPrompt(
          review,
          store.entries,
          voice,
          habitsInPrompt ? habits : null,
          locale,
          store.urges,
          'range',
        ),
      });
    } catch (e) {
      Alert.alert(m.stats.shareFailed, String(e));
    }
  };

  const endRow = (end: keyof Range, label: string) => {
    const date = end === 'from' ? from : to;
    return (
      <View style={styles.row}>
        <View style={styles.dateText}>
          <Text style={styles.endLabel}>{label}</Text>
          <Text style={styles.date}>{fullDate(date, locale)}</Text>
        </View>
        <RoundButton
          label="«"
          accessibilityLabel={`${label}: ${r.weekEarlier}`}
          onPress={() => move(end, -7)}
        />
        <RoundButton
          label="‹"
          accessibilityLabel={`${label}: ${r.dayEarlier}`}
          onPress={() => move(end, -1)}
        />
        <RoundButton
          label="›"
          accessibilityLabel={`${label}: ${r.dayLater}`}
          onPress={() => move(end, 1)}
          disabled={date >= today}
        />
        <RoundButton
          label="»"
          accessibilityLabel={`${label}: ${r.weekLater}`}
          onPress={() => move(end, 7)}
          disabled={date >= today}
        />
      </View>
    );
  };

  return (
    <Card>
      <Text style={styles.title}>{r.title}</Text>
      <Text style={styles.body}>{r.hint}</Text>
      <View style={styles.chips}>
        {presets.map((p) => (
          <Chip
            key={p.label}
            label={p.label}
            selected={p.range.from === from && p.range.to === to}
            onPress={() => setRange(p.range)}
          />
        ))}
      </View>
      {endRow('from', r.from)}
      {endRow('to', r.to)}
      <Text style={styles.body}>
        {r.days(review.days.length)} · {r.checkIns(review.logged)}
      </Text>
      <Button title={r.reflect} onPress={reflect} disabled={review.logged === 0} />
      <Text style={styles.hint}>{r.reflectHint}</Text>
    </Card>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    title: { fontSize: 18, fontWeight: '600', color: c.text },
    body: { color: c.muted, lineHeight: 20 },
    hint: { color: c.muted, fontSize: 13, textAlign: 'center' },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(1) },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing(2) },
    dateText: { flex: 1 },
    endLabel: { color: c.muted, fontSize: 13 },
    date: { color: c.text, fontSize: 16, fontWeight: '500' },
  });
