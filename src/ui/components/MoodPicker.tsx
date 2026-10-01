import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette, spacing, useColors, useThemedStyles } from '../theme/theme';
import { MOODS, Mood } from '../../domain/checkins/types';
import { useVoice } from '../theme/voiceContext';

type Props = {
  value: Mood | null;
  onChange: (mood: Mood) => void;
};

export function MoodPicker({ value, onChange }: Props) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const voice = useVoice();
  return (
    <View style={styles.row}>
      {MOODS.map((mood) => {
        const selected = value === mood;
        return (
          <Pressable
            key={mood}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={`${mood}: ${voice.moodLabels[mood]}`}
            onPress={() => onChange(mood)}
            style={[
              styles.option,
              selected && { backgroundColor: c.moodColors[mood], borderColor: c.onMood },
            ]}
          >
            <Text style={styles.emoji}>{voice.moodEmoji[mood]}</Text>
            <Text style={[styles.number, selected && styles.numberSelected]}>{mood}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    row: { flexDirection: 'row', gap: spacing(2) },
    option: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: spacing(2),
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
    },
    emoji: { fontSize: 26 },
    number: { fontSize: 12, color: c.muted, marginTop: 2 },
    numberSelected: { color: c.onMood },
  });
