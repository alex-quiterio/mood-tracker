import { ReactNode, useEffect, useState } from 'react';
import { Animated } from 'react-native';

import { motion, useReducedMotion } from '@ui/foundation/theme/motion';

/** Gives its content a small happy pop each time `active` turns on, like a picked mood. */
export function Pop({ active, children }: { active: boolean; children: ReactNode }) {
  const reduced = useReducedMotion();
  const [scale] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (!active || reduced) return;
    scale.setValue(motion.pop.from);
    const animation = Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: motion.pop.speed,
      bounciness: motion.pop.bounciness,
    });
    animation.start();
    return () => animation.stop();
  }, [active, reduced, scale]);

  return <Animated.View style={{ transform: [{ scale }] }}>{children}</Animated.View>;
}
