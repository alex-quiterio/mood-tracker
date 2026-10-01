import { useKeepAwake } from 'expo-keep-awake';
import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import {
  BreathPattern,
  breathPositionAt,
  breathSessionSeconds,
  formatClock,
} from '@domain/practice/practices';
import { buzz, cancelBell, scheduleBell } from '@infrastructure/notifications/bell';
import { Button } from '@ui/components/Button';
import { Palette, spacing, useThemedStyles } from '@ui/theme/theme';
import { useLocale } from '@ui/i18n/LocaleContext';
import { useVoice } from '@ui/theme/voiceContext';

const SMALL = 0.5;

/** Counts breaths with a circle that grows on the in-breath and shrinks on the out-breath. */
export function BreathSession({
  pattern,
  breaths,
  onClose,
}: {
  pattern: BreathPattern;
  breaths: number;
  onClose: () => void;
}) {
  useKeepAwake();
  const styles = useThemedStyles(makeStyles);
  const { m } = useLocale();
  const voice = useVoice();
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(startedAt);
  const [scale] = useState(() => new Animated.Value(SMALL));
  const total = breathSessionSeconds(pattern, breaths);
  const pos = breathPositionAt(pattern, breaths, (now - startedAt) / 1000);

  // Tick, and ring the bell at the end even if the screen locks.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 100);
    let bellId: string | null = null;
    let finished = false;
    scheduleBell(total, voice.breathDone, {
      title: m.practice.bellTitle,
      channel: m.practice.bellChannel,
    }).then((id) => (bellId = id));
    const end = setTimeout(() => {
      finished = true;
      buzz();
    }, total * 1000);
    return () => {
      clearInterval(timer);
      clearTimeout(end);
      if (!finished) cancelBell(bellId);
    };
  }, [total, voice.breathDone, m]);

  // Each phase eases the circle toward its size for the rest of that phase.
  const { breath, phaseIndex, phase, phaseElapsed, done } = pos;
  useEffect(() => {
    if (done || phase.kind === 'hold') return;
    const animation = Animated.timing(scale, {
      toValue: phase.kind === 'in' ? 1 : SMALL,
      duration: Math.max(0, (phase.seconds - phaseElapsed) * 1000),
      easing: Easing.inOut(Easing.sin),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
    // Only restart when a new phase begins, not on every tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breath, phaseIndex, done]);

  return (
    <View style={styles.root}>
      <View style={styles.stage}>
        <Animated.View style={[styles.halo, { transform: [{ scale }] }]} />
        <Animated.View style={[styles.circle, { transform: [{ scale }] }]} />
        <Text style={styles.count}>{done ? '✓' : breath}</Text>
      </View>
      <Text style={styles.phase} accessibilityLiveRegion="polite">
        {done ? voice.breathDone : m.practice.phases[phase.kind]}
      </Text>
      <Text style={styles.meta}>
        {done
          ? m.practice.breathsDone(breaths, m.practice.patterns[pattern.id].name)
          : m.practice.breathOf(breath, breaths, formatClock(total - (now - startedAt) / 1000))}
      </Text>
      <View style={styles.actions}>
        <Button title={done ? m.common.close : m.common.stop} variant="secondary" onPress={onClose} />
      </View>
    </View>
  );
}

const SIZE = 220;

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing(4), padding: spacing(6) },
    stage: { width: SIZE * 1.3, height: SIZE * 1.3, alignItems: 'center', justifyContent: 'center' },
    halo: {
      position: 'absolute',
      width: SIZE * 1.3,
      height: SIZE * 1.3,
      borderRadius: SIZE,
      backgroundColor: c.accent,
      opacity: 0.15,
    },
    circle: {
      position: 'absolute',
      width: SIZE,
      height: SIZE,
      borderRadius: SIZE / 2,
      backgroundColor: c.accent,
      opacity: 0.85,
    },
    count: { fontSize: 56, fontWeight: '200', color: c.accentText, fontVariant: ['tabular-nums'] },
    phase: { fontSize: 24, fontWeight: '600', color: c.text, textAlign: 'center', ...c.heading },
    meta: { color: c.muted, fontVariant: ['tabular-nums'] },
    actions: { alignSelf: 'stretch', marginTop: spacing(4) },
  });
