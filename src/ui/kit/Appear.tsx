import { ReactNode, useEffect, useState } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';

import { motion, useReducedMotion } from '@ui/foundation/theme/motion';

type Props = { children: ReactNode; style?: StyleProp<ViewStyle>; delay?: number };

/** Fades its content in while it rises a few pixels, once, when it first appears. */
export function Appear({ children, style, delay = 0 }: Props) {
  const reduced = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(reduced ? 1 : 0));

  useEffect(() => {
    if (reduced) {
      progress.setValue(1);
      return;
    }
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: motion.appear.duration,
      delay,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [progress, reduced, delay]);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [motion.appear.rise, 0] });
  return (
    <Animated.View style={[style, { opacity: progress, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}
