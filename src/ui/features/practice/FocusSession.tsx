import { useKeepAwake } from 'expo-keep-awake';
import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@ui/kit/Text';

import { FocusObject, formatClock } from '@domain/practice/practices';
import { buzz, cancelBell, scheduleBell } from '@infrastructure/notifications/bell';
import { Button } from '@ui/kit/Button';
import { Palette, spacing, useThemedStyles } from '@ui/foundation/theme/theme';
import { useLocale } from '@ui/foundation/i18n/LocaleContext';

/**
 * Rest your gaze on one thing until the bell (trataka). The screen stays on and
 * quiet; the time left only shows when you tap it.
 */
export function FocusSession({
  minutes,
  object,
  onClose,
}: {
  minutes: number;
  object: FocusObject;
  onClose: () => void;
}) {
  useKeepAwake();
  const styles = useThemedStyles(makeStyles);
  const { m } = useLocale();
  const total = minutes * 60;
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(startedAt);
  const [showTime, setShowTime] = useState(false);
  const left = total - (now - startedAt) / 1000;
  const done = left <= 0;

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 250);
    let bellId: string | null = null;
    let finished = false;
    let closed = false;
    scheduleBell(total, m.practice.focusDone, {
      title: m.practice.bellTitle,
      channel: m.practice.bellChannel,
    }).then((id) => {
      bellId = id;
      // Closed before the bell was scheduled: don't leave it to ring later.
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
    <View style={styles.root}>
      <Text style={styles.hint}>{done ? m.practice.focusDone : m.practice.objects[object.id].hint}</Text>
      <Pressable
        style={styles.stage}
        onPress={() => setShowTime((s) => !s)}
        accessibilityRole="button"
        accessibilityLabel={done ? m.practice.finished : m.practice.timeLeftA11y(formatClock(left))}
      >
        {!done && object.id === 'candle' && <Flame />}
        {!done && object.id === 'dot' && <View style={styles.dot} />}
      </Pressable>
      <Text style={styles.time}>{done ? '🔔' : showTime ? formatClock(left) : ' '}</Text>
      <View style={styles.actions}>
        <Button title={done ? 'Close' : 'Stop'} variant="secondary" onPress={onClose} />
      </View>
    </View>
  );
}

/** A candle whose flame flickers softly and never quite settles. */
function Flame() {
  const styles = useThemedStyles(makeStyles);
  const [flicker] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(flicker, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(flicker, {
          toValue: 0.35,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(flicker, {
          toValue: 0.8,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(flicker, {
          toValue: 0,
          duration: 800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [flicker]);

  return (
    <View style={styles.candle}>
      <Animated.View
        style={[
          styles.glow,
          {
            opacity: flicker.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.45] }),
            transform: [{ scale: flicker.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.06] }) }],
          },
        ]}
      />
      <Animated.Text
        style={[
          styles.flame,
          { transform: [{ scaleY: flicker.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.04] }) }] },
        ]}
      >
        🕯️
      </Animated.Text>
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing(6), padding: spacing(6) },
    hint: { color: c.muted, textAlign: 'center', lineHeight: 21, fontSize: 15, minHeight: 64, ...c.heading },
    stage: { width: 240, height: 240, alignItems: 'center', justifyContent: 'center' },
    dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: c.text },
    candle: { alignItems: 'center', justifyContent: 'center' },
    glow: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: '#FFB547' },
    flame: { fontSize: 110 },
    time: { fontSize: 20, color: c.muted, fontVariant: ['tabular-nums'], minHeight: 28 },
    actions: { alignSelf: 'stretch' },
  });
