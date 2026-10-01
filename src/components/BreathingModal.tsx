import { useEffect, useState } from 'react';
import { Animated, Easing, Modal, StyleSheet, Text, View } from 'react-native';

import { Palette, spacing, useThemedStyles } from '../theme/theme';
import { useVoice } from '../voices/voices';
import { Button } from './Button';

const CYCLES = 3;
const INHALE_MS = 4000;
const EXHALE_MS = 6000;
const SMALL = 0.55;

type Phase = 'in' | 'out' | 'done';

const PHASE_TEXT: Record<Exclude<Phase, 'done'>, string> = {
  in: 'Breathe in…',
  out: 'And slowly out…',
};

type Props = { visible: boolean; onClose: () => void };

/** Three slow breaths, paced by a circle that grows on the inhale and shrinks on the longer exhale. */
export function BreathingModal({ visible, onClose }: Props) {
  const styles = useThemedStyles(makeStyles);
  const voice = useVoice();
  const [scale] = useState(() => new Animated.Value(SMALL));
  const [phase, setPhase] = useState<Phase>('in');
  const [cycle, setCycle] = useState(1);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    scale.setValue(SMALL);

    const step = (n: number) => {
      if (cancelled) return;
      if (n >= CYCLES * 2) {
        setPhase('done');
        return;
      }
      const inhale = n % 2 === 0;
      setPhase(inhale ? 'in' : 'out');
      setCycle(Math.floor(n / 2) + 1);
      Animated.timing(scale, {
        toValue: inhale ? 1 : SMALL,
        duration: inhale ? INHALE_MS : EXHALE_MS,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }).start(({ finished }) => finished && step(n + 1));
    };
    step(0);

    return () => {
      cancelled = true;
      scale.stopAnimation();
    };
  }, [visible, scale]);

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.stage}>
          <Animated.View style={[styles.halo, { transform: [{ scale }] }]} />
          <Animated.View style={[styles.circle, { transform: [{ scale }] }]} />
        </View>
        <Text style={styles.phase} accessibilityLiveRegion="polite">
          {phase === 'done' ? voice.breathDone : PHASE_TEXT[phase]}
        </Text>
        <Text style={styles.count}>{phase === 'done' ? ' ' : `Breath ${cycle} of ${CYCLES}`}</Text>
        <View style={styles.actions}>
          <Button title={phase === 'done' ? 'Close' : 'Stop'} variant="secondary" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const SIZE = 240;

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: c.background,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing(6),
      gap: spacing(4),
    },
    stage: { width: SIZE * 1.3, height: SIZE * 1.3, alignItems: 'center', justifyContent: 'center' },
    halo: {
      position: 'absolute',
      width: SIZE * 1.3,
      height: SIZE * 1.3,
      borderRadius: SIZE,
      backgroundColor: c.accent,
      opacity: 0.15,
    },
    circle: { width: SIZE, height: SIZE, borderRadius: SIZE / 2, backgroundColor: c.accent, opacity: 0.85 },
    phase: { fontSize: 22, fontWeight: '600', color: c.text, textAlign: 'center' },
    count: { color: c.muted },
    actions: { alignSelf: 'stretch', marginTop: spacing(4) },
  });
