import { useState } from 'react';
import { KeyboardAvoidingView, Modal, StyleSheet, View } from 'react-native';
import { TextInput } from '@ui/kit/TextInput';
import { Text } from '@ui/kit/Text';

import { NAME_MAX_LENGTH } from '@domain/settings/settings';
import { Palette, spacing, useColors, useThemedStyles } from '@ui/foundation/theme/theme';
import { Button } from '@ui/kit/Button';
import { useLocale } from '@ui/foundation/i18n/LocaleContext';

type Props = { visible: boolean; onSave: (name: string) => void; onSkip: () => void };

/** Asked once, until the user gives a name. "Not now" asks again next launch. */
export function NamePrompt({ visible, onSave, onSkip }: Props) {
  const styles = useThemedStyles(makeStyles);
  const { m } = useLocale();
  const c = useColors();
  const [name, setName] = useState('');
  const trimmed = name.trim();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onSkip} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.backdrop} behavior="padding">
        <View style={styles.card}>
          <Text style={styles.wave}>👋</Text>
          <Text style={styles.title}>{m.name.promptTitle}</Text>
          <Text style={styles.body}>{m.name.promptBody}</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={m.name.placeholder}
            placeholderTextColor={c.muted}
            maxLength={NAME_MAX_LENGTH}
            autoFocus
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={() => trimmed && onSave(trimmed)}
          />
          <Button title={m.common.continue} onPress={() => onSave(trimmed)} disabled={!trimmed} />
          <Button title={m.common.notNow} variant="secondary" onPress={onSkip} />
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
