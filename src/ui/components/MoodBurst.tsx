import { useEffect } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

const PARTICLES = 14;

type Particle = {
  emoji: string;
  progress: Animated.Value;
  dx: number;
  rise: number;
  spin: number;
  delay: number;
  size: number;
};

export type Burst = { key: number; particles: Particle[] };

/** Builds a new burst. Call it from an event handler: it's random on purpose. */
export function makeBurst(previousKey: number, emojis: string[]): Burst {
  return {
    key: previousKey + 1,
    particles:
      emojis.length === 0
        ? []
        : Array.from({ length: PARTICLES }, (_, i) => ({
            emoji: emojis[i % emojis.length],
            progress: new Animated.Value(0),
            dx: (Math.random() - 0.5) * 260,
            rise: 220 + Math.random() * 180,
            spin: (Math.random() - 0.5) * 120,
            delay: Math.random() * 180,
            size: 22 + Math.random() * 16,
          })),
  };
}

/** A small fountain of emojis that floats up and fades. Purely decorative and never blocks touches. */
export function MoodBurst({ burst }: { burst: Burst }) {
  const { particles, key: burstKey } = burst;

  useEffect(() => {
    const animations = particles.map((p) =>
      Animated.timing(p.progress, {
        toValue: 1,
        duration: 1300,
        delay: p.delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    );
    Animated.parallel(animations).start();
    return () => animations.forEach((a) => a.stop());
  }, [particles]);

  if (particles.length === 0) return null;

  return (
    <View pointerEvents="none" style={styles.layer}>
      {particles.map((p, i) => (
        <Animated.Text
          key={`${burstKey}-${i}`}
          style={[
            styles.particle,
            {
              fontSize: p.size,
              opacity: p.progress.interpolate({ inputRange: [0, 0.1, 0.65, 1], outputRange: [0, 1, 1, 0] }),
              transform: [
                { translateX: p.progress.interpolate({ inputRange: [0, 1], outputRange: [0, p.dx] }) },
                { translateY: p.progress.interpolate({ inputRange: [0, 1], outputRange: [0, -p.rise] }) },
                {
                  rotate: p.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', `${p.spin}deg`],
                  }),
                },
                { scale: p.progress.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.4, 1.15, 0.9] }) },
              ],
            },
          ]}
        >
          {p.emoji}
        </Animated.Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'flex-end' },
  particle: { position: 'absolute', bottom: '30%' },
});
