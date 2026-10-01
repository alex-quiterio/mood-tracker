import { useState } from 'react';
import { KeyboardAvoidingView, Modal, StyleSheet, Text, TextInput, View } from 'react-native';

import { NAME_MAX_LENGTH } from '../data/storage';
import { Palette, spacing, useColors, useThemedStyles } from '../theme/theme';
import { Button } from './Button';

type Props = { visible: boolean; onSave: (name: string) => void; onSkip: () => void };

/** Asked once, until the user gives a name. "Not now" asks again next launch. */
export function NamePrompt({ visible, onSave, onSkip }: Props) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const [name, setName] = useState('');
  const trimmed = name.trim();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onSkip} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.backdrop} behavior="padding">
        <View style={styles.card}>
          <Text style={styles.wave}>👋</Text>
          <Text style={styles.title}>What should I call you?</Text>
          <Text style={styles.body}>Used in greetings and reminders. It stays on this phone.</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={c.muted}
            maxLength={NAME_MAX_LENGTH}
            autoFocus
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={() => trimmed && onSave(trimmed)}
          />
          <Button title="Continue" onPress={() => onSave(trimmed)} disabled={!trimmed} />
          <Button title="Not now" variant="secondary" onPress={onSkip} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'center',
      padding: spacing(6),
    },
    card: { backgroundColor: c.surface, borderRadius: 20, padding: spacing(6), gap: spacing(3) },
    wave: { fontSize: 36 },
    title: { fontSize: 22, fontWeight: '700', color: c.text },
    body: { color: c.muted, lineHeight: 20 },
    input: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      padding: spacing(3),
      fontSize: 17,
      color: c.text,
      backgroundColor: c.background,
    },
  });
