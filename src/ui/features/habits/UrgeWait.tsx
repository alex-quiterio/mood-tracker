import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { UrgeOutcome } from '@domain/habits/urges';
import { buzz, cancelBell, scheduleBell } from '@infrastructure/notifications/bell';
import { Button } from '@ui/kit/Button';
import { Text } from '@ui/kit/Text';
import { useLocale } from '@ui/foundation/i18n/LocaleContext';
import { Palette, spacing, typeScale, useThemedStyles } from '@ui/foundation/theme/theme';

type Props = { minutes: number; onOutcome: (outcome: UrgeOutcome) => void };

const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

/**
 * The other way through an urge: go and do something else for a while. A bell rings
 * when the time is up, even with the app closed, and either answer can be given sooner.
 */
export function UrgeWait({ minutes, onOutcome }: Props) {
  const styles = useThemedStyles(makeStyles);
  const { m } = useLocale();
  const total = minutes * 60;
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(startedAt);
  const left = Math.max(0, total - Math.floor((now - startedAt) / 1000));

  // Tick, and ring the bell at the end even if the screen locks; cancel it if answered sooner.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    let bellId: string | null = null;
    let finished = false;
    let closed = false;
    scheduleBell(total, m.urge.waitBellBody, {
      title: m.urge.waitBellTitle,
      channel: m.practice.bellChannel,
    }).then((id) => {
      bellId = id;
      if (closed) cancelBell(id);
    });
    const end = setTimeout(() => {
      finished = true;
      buzz();
    }, total * 1000);
    return () => {
      clearInterval(timer);
      clearTimeout(end);
      if (!finished) {
        closed = true;
        cancelBell(bellId);
      }
    };
  }, [total, m]);

  return (
    <View style={styles.page}>
      <Text style={styles.title}>{left > 0 ? m.urge.waitTitle(minutes) : m.urge.waitOver}</Text>
      {left > 0 && <Text style={styles.body}>{m.urge.waitHint}</Text>}
      <Text style={styles.clock} accessibilityRole="timer">
        {clock(left)}
      </Text>
      <Button title={m.urge.letPass} onPress={() => onOutcome('passed')} />
      <Button title={m.urge.hadOne} variant="secondary" onPress={() => onOutcome('gaveIn')} />
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    page: { flex: 1, justifyContent: 'center', padding: spacing(4), gap: spacing(3) },
    title: { ...typeScale.title, color: c.text, ...c.heading },
    body: { color: c.muted, lineHeight: 20 },
    clock: {
      fontSize: 56,
      fontWeight: '300',
      color: c.accent,
      textAlign: 'center',
      fontVariant: ['tabular-nums'],
      marginVertical: spacing(4),
    },
  });
