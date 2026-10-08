import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Entry } from '@domain/checkins/types';
import { Habit } from '@domain/habits/habits';
import { addDays, weekStart } from '@domain/shared/dates';
import { MerchantLinks, spendingByCategory } from '@domain/spending/categories';
import { Payment } from '@domain/spending/payments';
import { formatEuros } from '@ui/foundation/i18n/format';
import { useLocale } from '@ui/foundation/i18n/LocaleContext';
import { Palette, spacing, typeScale, useThemedStyles } from '@ui/foundation/theme/theme';
import { Card } from '@ui/kit/Card';
import { Chip } from '@ui/kit/Chip';
import { PairedBarChart } from '@ui/kit/PairedBarChart';
import { PressableScale } from '@ui/kit/PressableScale';
import { Text } from '@ui/kit/Text';

type Props = {
  entries: Entry[];
  habits: Habit[];
  payments: Payment[];
  links: MerchantLinks;
  onLink: (merchant: string, habitId: string | null) => void;
  /** The last day of the week shown. */
  today: string;
  past: boolean;
};

type Period = 'week' | 'last30';

/** How many merchants show before "Show all". */
const TOP_MERCHANTS = 6;

/**
 * Per priced habit: what the check-ins estimate against what was really spent at
 * the merchants linked to it. Below, the period's merchants, each one a tap away
 * from being linked to a habit.
 */
export function EstimateVsSpentCard({ entries, habits, payments, links, onLink, today, past }: Props) {
  const styles = useThemedStyles(makeStyles);
  const { m, locale } = useLocale();
  const [period, setPeriod] = useState<Period>('week');
  const [open, setOpen] = useState<string | null>(null);
  const [all, setAll] = useState(false);
  const from = period === 'week' ? weekStart(today) : addDays(today, -29);
  const result = spendingByCategory(entries, habits, payments, links, from, today);
  // A merchant goes with at most one habit, picked from every habit currently in use.
  const available = habits.filter((h) => !h.archived);
  const euros = (n: number) => formatEuros(n, locale);
  const merchants = result ? (all ? result.merchants : result.merchants.slice(0, TOP_MERCHANTS)) : [];

  return (
    <Card>
      <Text style={styles.title}>{m.compare.title}</Text>
      <View style={styles.chips}>
        <Chip
          label={past ? m.compare.thatWeek : m.compare.thisWeek}
          selected={period === 'week'}
          onPress={() => setPeriod('week')}
        />
        <Chip label={m.compare.last30} selected={period === 'last30'} onPress={() => setPeriod('last30')} />
      </View>

      {!result ? (
        <Text style={styles.muted}>{m.compare.notCovered}</Text>
      ) : (
        <>
          {result.categories.length > 0 ? (
            <PairedBarChart
              firstName={m.compare.estimated}
              secondName={m.compare.spent}
              rows={result.categories.map((cat) => ({
                key: cat.habit.id,
                label: `${cat.habit.emoji} ${cat.habit.name}`,
                first: cat.estimate ?? 0,
                second: cat.spent,
                firstText: cat.estimate === null ? '–' : euros(cat.estimate),
                secondText: euros(cat.spent),
              }))}
            />
          ) : (
            <Text style={styles.muted}>{m.compare.noCategories}</Text>
          )}
          {result.unlinked > 0 && (
            <Text style={styles.body}>{m.compare.unlinked(euros(result.unlinked))}</Text>
          )}

          {result.merchants.length > 0 && (
            <View style={styles.merchants}>
              <Text style={styles.subtitle}>{m.compare.merchantsTitle}</Text>
              <Text style={styles.muted}>{m.compare.merchantsHint}</Text>
              {merchants.map((merchant) => {
                const linked = habits.find((h) => h.id === merchant.habitId);
                return (
                  <View key={merchant.key} style={styles.merchant}>
                    <PressableScale
                      accessibilityRole="button"
                      accessibilityState={{ expanded: open === merchant.key }}
                      onPress={() => setOpen(open === merchant.key ? null : merchant.key)}
                      style={styles.merchantRow}
                    >
                      <View style={styles.flex}>
                        <Text style={styles.body} numberOfLines={1}>
                          {merchant.name}
                        </Text>
                        <Text style={styles.muted}>
                          {m.compare.merchant(euros(merchant.total), merchant.count)}
                        </Text>
                      </View>
                      <Text style={styles.link}>{linked ? `${linked.emoji} ${linked.name}` : '＋'}</Text>
                    </PressableScale>
                    {open === merchant.key && (
                      <View style={styles.chips}>
                        {available.map((h) => (
                          <Chip
                            key={h.id}
                            label={`${h.emoji} ${h.name}`}
                            selected={merchant.habitId === h.id}
                            onPress={() => {
                              onLink(merchant.name, h.id);
                              setOpen(null);
                            }}
                          />
                        ))}
                        <Chip
                          label={m.compare.notAHabit}
                          selected={!linked}
                          onPress={() => {
                            onLink(merchant.name, null);
                            setOpen(null);
                          }}
                        />
                      </View>
                    )}
                  </View>
                );
              })}
              {!all && result.merchants.length > TOP_MERCHANTS && (
                <Chip
                  role="button"
                  label={m.compare.showAll(result.merchants.length)}
                  selected={false}
                  onPress={() => setAll(true)}
                />
              )}
            </View>
          )}
        </>
      )}
    </Card>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    title: { ...typeScale.heading, color: c.text, ...c.heading },
    subtitle: { fontSize: 15, fontWeight: '600', color: c.text },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2) },
    body: { color: c.text, fontSize: 14 },
    muted: { color: c.muted, fontSize: 12, lineHeight: 16 },
    merchants: { gap: spacing(2), marginTop: spacing(2) },
    merchant: { gap: spacing(2) },
    merchantRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(3), paddingVertical: spacing(1) },
    flex: { flex: 1 },
    link: { color: c.accent, fontSize: 14, fontWeight: '600' },
  });
