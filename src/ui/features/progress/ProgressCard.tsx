import { StyleSheet, View } from 'react-native';
import { Text } from '@ui/kit/Text';

import { LEVELS_PER_TITLE, XP, XpSource, titleIndex } from '@domain/progress/xp';
import { Card } from '@ui/kit/Card';
import { formatInteger } from '@ui/foundation/i18n/format';
import { useLocale } from '@ui/foundation/i18n/LocaleContext';
import { Palette, spacing, useThemedStyles } from '@ui/foundation/theme/theme';

import { ProgressTrack } from './LevelBar';
import { Progress } from './useProgress';

const SOURCES: { source: XpSource; emoji: string }[] = [
  { source: 'checkIn', emoji: '✎' },
  { source: 'note', emoji: '📝' },
  { source: 'fullDay', emoji: '☀️' },
  { source: 'win', emoji: '🌱' },
  { source: 'urgePassed', emoji: '🌊' },
  { source: 'streakWeek', emoji: '🔥' },
];

/** The level, where the XP came from, and the voice's path of titles. */
export function ProgressCard({ progress }: { progress: Progress }) {
  const styles = useThemedStyles(makeStyles);
  const { m, locale } = useLocale();
  const { counts, level, title, titles } = progress;
  const current = titleIndex(level.level, titles.length);

  return (
    <Card>
      <Text style={styles.heading}>{m.progress.title}</Text>
      <Text style={styles.level}>
        {m.progress.level(level.level)} · {title}
      </Text>
      <ProgressTrack fraction={level.intoLevel / level.levelSize} />
      <View style={styles.row}>
        <Text style={styles.muted}>{m.progress.total(formatInteger(level.xp, locale))}</Text>
        <Text style={styles.muted}>
          {m.progress.toNext(formatInteger(level.levelSize - level.intoLevel, locale))}
        </Text>
      </View>

      <View style={styles.sources}>
        {SOURCES.filter(({ source }) => counts[source] > 0).map(({ source, emoji }) => (
          <View key={source} style={styles.row}>
            <Text style={styles.source}>
              {emoji} {m.progress.sources[source](counts[source])}
            </Text>
            <Text style={styles.xp}>+{formatInteger(counts[source] * XP[source], locale)} XP</Text>
          </View>
        ))}
      </View>

      <Text style={styles.subheading}>{m.progress.path}</Text>
      <View style={styles.path}>
        {titles.map((name, i) => {
          const reached = i <= current;
          return (
            <View key={name} style={styles.row}>
              <Text style={[styles.step, reached && styles.reached, i === current && styles.current]}>
                {reached ? '●' : '○'} {name}
              </Text>
              <Text style={styles.muted}>{m.progress.fromLevel(i * LEVELS_PER_TITLE + 1)}</Text>
            </View>
          );
        })}
      </View>
      <Text style={styles.hint}>{m.progress.hint}</Text>
    </Card>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    heading: { fontSize: 18, fontWeight: '600', color: c.text, ...c.heading },
    level: { fontSize: 22, fontWeight: '700', color: c.text, ...c.heading },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: spacing(2) },
    muted: { color: c.muted, fontSize: 12 },
    sources: { gap: spacing(1), marginTop: spacing(2) },
    source: { color: c.text, flexShrink: 1 },
    xp: { color: c.accent, fontWeight: '600', fontVariant: ['tabular-nums'] },
    subheading: { fontSize: 15, fontWeight: '600', color: c.text, marginTop: spacing(2), ...c.heading },
    path: { gap: spacing(1) },
    step: { color: c.muted },
    reached: { color: c.text },
    current: { color: c.accent, fontWeight: '700' },
    hint: { color: c.muted, fontSize: 12, marginTop: spacing(2) },
  });
