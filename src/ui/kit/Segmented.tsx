import { StyleSheet, View } from 'react-native';

import { Palette, radius, spacing, typeScale, useThemedStyles, withAlpha } from '@ui/foundation/theme/theme';

import { PressableScale } from './PressableScale';
import { Text } from './Text';

export type Segment<K extends string> = { key: K; label: string };

type Props<K extends string> = {
  segments: Segment<K>[];
  selected: K;
  onSelect: (key: K) => void;
};

/** A row of equal choices switched by tapping, for sections within one tab (swiping moves between tabs). */
export function Segmented<K extends string>({ segments, selected, onSelect }: Props<K>) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.row} accessibilityRole="tablist">
      {segments.map((s) => {
        const isSelected = s.key === selected;
        return (
          <PressableScale
            key={s.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            onPress={() => onSelect(s.key)}
            style={[styles.segment, isSelected && styles.segmentSelected]}
          >
            <Text style={[styles.label, isSelected && styles.labelSelected]} numberOfLines={1}>
              {s.label}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      backgroundColor: c.surface,
      borderRadius: radius.pill,
      padding: spacing(1),
      gap: spacing(1),
    },
    segment: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: spacing(2),
      borderRadius: radius.pill,
    },
    segmentSelected: { backgroundColor: withAlpha(c.accent, 0.16) },
    label: { ...typeScale.caption, fontSize: 14, color: c.muted },
    labelSelected: { color: c.accent, fontWeight: '700' },
  });
