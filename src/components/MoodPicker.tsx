import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, moodColors, spacing } from '../theme';
import { MOODS, MOOD_EMOJI, MOOD_LABEL, Mood } from '../types';

type Props = {
  value: Mood | null;
  onChange: (mood: Mood) => void;
};

export function MoodPicker({ value, onChange }: Props) {
  return (
    <View style={styles.row}>
      {MOODS.map((mood) => {
        const selected = value === mood;
        return (
          <Pressable
            key={mood}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={`${mood}: ${MOOD_LABEL[mood]}`}
            onPress={() => onChange(mood)}
            style={[styles.option, selected && { backgroundColor: moodColors[mood], borderColor: colors.text }]}
          >
            <Text style={styles.emoji}>{MOOD_EMOJI[mood]}</Text>
            <Text style={styles.number}>{mood}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing(2) },
  option: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing(2),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  emoji: { fontSize: 26 },
  number: { fontSize: 12, color: colors.muted, marginTop: 2 },
});
