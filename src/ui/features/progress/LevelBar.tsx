import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@ui/kit/Text';

import { formatInteger } from '@ui/foundation/i18n/format';
import { useLocale } from '@ui/foundation/i18n/LocaleContext';
import { Palette, spacing, useThemedStyles } from '@ui/foundation/theme/theme';

import { Progress } from './useProgress';

/** The level and how far along it is, on the check-in screen. Says so when a check-in levels you up. */
export function LevelBar({ progress }: { progress: Progress }) {
  const styles = useThemedStyles(makeStyles);
  const { m, locale } = useLocale();
  const { level, title } = progress;
  const seen = useRef(level.level);
  const [levelledUp, setLevelledUp] = useState(false);

  useEffect(() => {
    if (level.level > seen.current) setLevelledUp(true);
    seen.current = level.level;
  }, [level.level]);

  const left = level.levelSize - level.intoLevel;
  return (
    <View
      style={styles.root}
      accessible
      accessibilityLabel={m.progress.a11y(
        level.level,
        title,
        formatInteger(level.intoLevel, locale),
        formatInteger(level.levelSize, locale),
      )}
    >
      <View style={styles.row}>
        <Text style={styles.level}>
          {m.progress.level(level.level)} · {title}
        </Text>
        <Text style={styles.next}>{m.progress.toNext(formatInteger(left, locale))}</Text>
      </View>
      <ProgressTrack fraction={level.intoLevel / level.levelSize} />
      {levelledUp && <Text style={styles.levelUp}>{m.progress.levelUp(title)}</Text>}
    </View>
  );
}

export function ProgressTrack({ fraction }: { fraction: number }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${Math.round(Math.min(1, Math.max(0, fraction)) * 100)}%` }]} />
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { gap: spacing(1) },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: spacing(2) },
    level: { color: c.text, fontWeight: '600', flexShrink: 1 },
    next: { color: c.muted, fontSize: 12 },
    track: { height: 8, borderRadius: 4, backgroundColor: c.border, overflow: 'hidden' },
    fill: { height: '100%', borderRadius: 4, backgroundColor: c.accent },
    levelUp: { color: c.accent, fontWeight: '600' },
  });
