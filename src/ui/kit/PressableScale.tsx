import { useState } from 'react';
import {
  Animated,
  GestureResponderEvent,
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
} from 'react-native';

import { motion, useReducedMotion } from '@ui/foundation/theme/motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle> | ((state: { pressed: boolean }) => StyleProp<ViewStyle>);
};

/** A Pressable that sinks a little while held and springs back when let go. */
export function PressableScale({ style, onPressIn, onPressOut, ...props }: Props) {
  const reduced = useReducedMotion();
  const [scale] = useState(() => new Animated.Value(1));
  const to = (value: number) =>
    Animated.spring(scale, { toValue: value, useNativeDriver: true, ...motion.spring }).start();

  return (
    <AnimatedPressable
      {...props}
      onPressIn={(e: GestureResponderEvent) => {
        if (!reduced) to(motion.pressScale);
        onPressIn?.(e);
      }}
      onPressOut={(e: GestureResponderEvent) => {
        if (!reduced) to(1);
        onPressOut?.(e);
      }}
      style={(state: { pressed: boolean }) => [
        typeof style === 'function' ? style(state) : style,
        { transform: [{ scale }] },
      ]}
    />
  );
}
