import { useState } from 'react';
import { Animated, LayoutChangeEvent, StyleSheet, View } from 'react-native';

import { Palette, radius, spacing, typeScale, useThemedStyles, withAlpha } from '@ui/foundation/theme/theme';

import { PressableScale } from './PressableScale';
import { Text } from './Text';

export type Tab = { key: string; icon: string; label: string };

type Props = {
  tabs: Tab[];
  selected: string;
  onSelect: (key: string) => void;
  /** Where the pager is, in tabs (0 for the first, 1.5 halfway to the third…); the highlight follows it. */
  position: Animated.AnimatedInterpolation<number> | Animated.Value;
};

const PAD = spacing(2);
const GAP = spacing(2);

/** The bottom tabs, with a soft highlight that slides along as the pages are swiped. */
export function TabBar({ tabs, selected, onSelect, position }: Props) {
  const styles = useThemedStyles(makeStyles);
  const [barWidth, setBarWidth] = useState(0);
  const tabWidth = (barWidth - 2 * PAD - (tabs.length - 1) * GAP) / tabs.length;
  const last = tabs.length - 1;
  const translateX = position.interpolate({
    inputRange: [0, last],
    outputRange: [PAD, PAD + last * (tabWidth + GAP)],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.bar} onLayout={(e: LayoutChangeEvent) => setBarWidth(e.nativeEvent.layout.width)}>
      {barWidth > 0 && (
        <Animated.View style={[styles.highlight, { width: tabWidth, transform: [{ translateX }] }]} />
      )}
      {tabs.map((t) => {
        const isSelected = t.key === selected;
        return (
          <PressableScale
            key={t.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            onPress={() => onSelect(t.key)}
            style={styles.tab}
          >
            <Text style={[styles.icon, isSelected && styles.selected]}>{t.icon}</Text>
            <Text style={[styles.label, isSelected && styles.selected]}>{t.label}</Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    bar: {
      flexDirection: 'row',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
      backgroundColor: c.surface,
      padding: PAD,
      gap: GAP,
    },
    // The selected tab's soft block of accent colour, drawn under the tabs.
    highlight: {
      position: 'absolute',
      left: 0,
      top: PAD,
      bottom: PAD,
      borderRadius: radius.md,
      backgroundColor: withAlpha(c.accent, 0.16),
    },
    tab: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: spacing(2) },
    icon: { fontSize: 20, color: c.muted },
    label: { ...typeScale.caption, color: c.muted },
    selected: { color: c.accent, fontWeight: '700' },
  });
