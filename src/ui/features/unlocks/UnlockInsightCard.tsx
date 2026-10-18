import { useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@ui/kit/Text';

import { Card } from '@ui/kit/Card';
import { CapturedDay, dailyUnlocks, unlockWindows } from '@domain/signals/dailyUnlocks';
import {
  MIN_COMPLETE_DAYS,
  UNLOCK_BENCHMARKS,
  moodUnlockPattern,
  unlockInsight,
} from '@domain/signals/unlockBenchmarks';
import { Entry } from '@domain/checkins/types';
import { formatDecimal } from '@ui/foundation/i18n/format';
import { useLocale } from '@ui/foundation/i18n/LocaleContext';
import { Palette, spacing, useThemedStyles, typeScale } from '@ui/foundation/theme/theme';

type Props = {
  entries: Entry[];
  capturedDays: CapturedDay[];
  /** The last day of the rolling week. */
  until: string;
  /** True when the week ends yesterday, i.e. this week rather than a past one. */
  lately: boolean;
};

/**
 * Daily unlocks over a rolling week beside typical adults, then the person's own
 * pattern by mood. Information only: no warning colours, no advice.
 */
export function UnlockInsightCard({ entries, capturedDays, until, lately }: Props) {
  const styles = useThemedStyles(makeStyles);
  const { m, locale } = useLocale();
  const t = m.unlockInsight;
  const [aboutOpen, setAboutOpen] = useState(false);
  const insight = useMemo(
    () => unlockInsight(dailyUnlocks(entries, capturedDays), until),
    [entries, capturedDays, until],
  );
  const pattern = useMemo(() => moodUnlockPattern(unlockWindows(entries)), [entries]);

  return (
    <Card>
      <Text style={styles.title}>{t.title}</Text>
      {insight.kind === 'notEnough' ? (
        <View>
          <Text style={styles.lead}>{t.notEnough}</Text>
          <Text style={styles.muted}>{t.notEnoughDetail(insight.completeDays, MIN_COMPLETE_DAYS)}</Text>
        </View>
      ) : (
        <View style={styles.block}>
          <Text style={styles.lead}>
            {t.average(String(Math.round(insight.average)), lately)} {t.typical(insight.median)}
          </Text>
          <Text style={styles.body}>{t.bands[insight.band]}</Text>
          {insight.estimatedDays > 0 && (
            <Text style={styles.muted}>{t.estimated(insight.estimatedDays)}</Text>
          )}
        </View>
      )}

      {pattern && (
        <View style={styles.block}>
          <Text style={styles.subtitle}>{t.patternTitle}</Text>
          <Text style={styles.body}>{t.patternLow(formatDecimal(pattern.low.perHour, 1, locale))}</Text>
          <Text style={styles.body}>{t.patternHigh(formatDecimal(pattern.high.perHour, 1, locale))}</Text>
          <Text style={styles.muted}>{t.patternHint}</Text>
        </View>
      )}

      <Pressable
        onPress={() => setAboutOpen((o) => !o)}
        accessibilityRole="button"
        accessibilityState={{ expanded: aboutOpen }}
      >
        <Text style={styles.link}>
          {aboutOpen ? '▾' : '▸'} {t.about}
        </Text>
      </Pressable>
      {aboutOpen && (
        <View style={styles.block}>
          <Text style={styles.muted}>{t.aboutBody}</Text>
          {UNLOCK_BENCHMARKS.sources.map((s) => (
            <Text
              key={s.name}
              style={[styles.muted, s.url && styles.link]}
              onPress={s.url ? () => Linking.openURL(s.url).catch(() => {}) : undefined}
            >
              {s.name}: {s.detail}
            </Text>
          ))}
        </View>
      )}
    </Card>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    title: { ...typeScale.title, color: c.text, ...c.heading },
    subtitle: { fontWeight: '600', color: c.text },
    block: { gap: spacing(1) },
    lead: { fontSize: 17, fontWeight: '600', color: c.text },
    body: { color: c.text },
    muted: { color: c.muted, fontSize: 13 },
    link: { color: c.accent, fontSize: 13 },
  });
