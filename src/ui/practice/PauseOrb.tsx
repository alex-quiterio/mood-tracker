import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text } from 'react-native';

import { Palette, spacing, useThemedStyles } from '@ui/theme/theme';

/**
 * The greeting's sun or moon, gently breathing (in for 4, out for 6). Tapping it
 * opens a pause: counted breathing or a focus timer.
 */
export function PauseOrb({ emoji, onPress }: { emoji: string; onPress: () => void }) {
  const styles = useThemedStyles(makeStyles);
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
      accessibilityLabel="Take a pause: breathing or focus"
      hitSlop={10}
      style={styles.wrap}
    >
      <Animated.View style={[styles.halo, { transform: [{ scale }] }]} />
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.caption}>pause</Text>
    </Pressable>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    wrap: { alignItems: 'center', justifyContent: 'center', width: 52, paddingTop: spacing(1) },
    halo: {
      position: 'absolute',
      top: 0,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.accent,
      opacity: 0.18,
    },
    emoji: { fontSize: 22, lineHeight: 32, height: 32 },
    caption: { fontSize: 10, color: c.muted, letterSpacing: 1, marginTop: 2 },
  });
