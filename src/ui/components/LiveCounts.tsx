import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@ui/components/Card';
import { Palette, spacing, useThemedStyles } from '@ui/theme/theme';
import { formatSince } from '@domain/signals/format';
import { useLocale } from '@ui/i18n/LocaleContext';

export type LiveCount = {
  icon: string;
  /** Already formatted, e.g. "12,480". */
  value: string;
  unit: string;
  from: Date;
  /** e.g. "Usually about 15". */
  usual: string | null;
};

/** Live unlocks and steps since the last check-in, side by side at the top of the check-in screen. */
export function LiveCounts({ counts, today }: { counts: LiveCount[]; today: string }) {
  const styles = useThemedStyles(makeStyles);
  const { m, locale } = useLocale();
  if (counts.length === 0) return null;

  return (
    <Card style={styles.card}>
      {counts.map((c, i) => (
        <View
          key={c.unit}
          style={[styles.block, i > 0 && styles.divider]}
          accessibilityLabel={m.signals.since(`${c.value} ${c.unit}`, formatSince(c.from, today, locale))}
        >
          <View style={styles.valueRow}>
            <Text style={styles.icon}>{c.icon}</Text>
            <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
              {c.value}
            </Text>
          </View>
          <Text style={styles.title}>{m.signals.since(c.unit, formatSince(c.from, today, locale))}</Text>
          <Text style={styles.subtitle}>{c.usual ?? m.checkin.savedWithNext}</Text>
        </View>
      ))}
    </Card>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    card: { flexDirection: 'row', paddingVertical: spacing(3), paddingHorizontal: 0, gap: 0 },
    block: { flex: 1, paddingHorizontal: spacing(4) },
    divider: { borderLeftWidth: 1, borderLeftColor: c.border },
    valueRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(2) },
    icon: { fontSize: 20 },
    value: { flexShrink: 1, fontSize: 30, fontWeight: '800', color: c.accent, fontVariant: ['tabular-nums'] },
    title: { fontSize: 14, fontWeight: '600', color: c.text, marginTop: 2 },
    subtitle: { fontSize: 12, color: c.muted, marginTop: 2 },
  });
