import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { Palette, spacing, useThemedStyles } from '../theme/theme';
import { quoteOfTheDay } from '../../domain/voices/voices';
import { useVoice } from '../theme/voiceContext';

/** Today's quote for the current voice. Tap for another. */
export function QuoteCard({ date }: { date: string }) {
  const styles = useThemedStyles(makeStyles);
  const voice = useVoice();
  const [offset, setOffset] = useState(0);
  const quote = quoteOfTheDay(voice.quotes, date, offset);
  if (!quote) return null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={voice.quotes.length > 1 ? 'Shows another quote' : undefined}
      onPress={() => setOffset((o) => o + 1)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Text style={styles.mark}>“</Text>
      <Text style={styles.text}>{quote.text}</Text>
      {quote.source ? <Text style={styles.source}>— {quote.source}</Text> : null}
    </Pressable>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: 16,
      paddingVertical: spacing(3),
      paddingHorizontal: spacing(4),
      borderLeftWidth: 3,
      borderLeftColor: c.accent,
      gap: spacing(1),
    },
    pressed: { opacity: 0.7 },
    mark: { fontSize: 28, lineHeight: 28, color: c.accent, fontFamily: 'serif' },
    text: { fontSize: 16, lineHeight: 23, color: c.text, fontStyle: 'italic', fontFamily: 'serif' },
    source: { fontSize: 12, color: c.muted, marginTop: spacing(1) },
  });
