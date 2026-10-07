import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet } from 'react-native';
import { Text } from '@ui/kit/Text';

import { Palette, useThemedStyles } from '@ui/foundation/theme/theme';
import { useLocale } from '@ui/foundation/i18n/LocaleContext';

/**
 * The greeting's sun or moon, gently breathing (in for 4, out for 6). Tapping it
 * opens a pause, like the Pause button: counted breathing or a focus timer.
 */
export function PauseOrb({ emoji, onPress }: { emoji: string; onPress: () => void }) {
  const styles = useThemedStyles(makeStyles);
  const { m } = useLocale();
  const [scale] = useState(() => new Animated.Value(1));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.18,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 6000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [scale]);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={m.checkin.pauseA11y}
      hitSlop={10}
      style={styles.wrap}
    >
      <Animated.View style={[styles.halo, { transform: [{ scale }] }]} />
      <Text style={styles.emoji}>{emoji}</Text>
    </Pressable>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    // Room for the halo at its largest (40 × 1.18), so it never reaches the text beside it.
    wrap: { alignItems: 'center', justifyContent: 'center', width: 52, height: 52 },
    halo: {
      position: 'absolute',
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.accent,
      opacity: 0.18,
    },
    emoji: { fontSize: 22, lineHeight: 32, height: 32 },
  });
