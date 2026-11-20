import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, StyleSheet, View } from 'react-native';

import { MIN_PASSPHRASE_LENGTH } from '@infrastructure/backup/encryption';
import { Button } from '@ui/kit/Button';
import { Text } from '@ui/kit/Text';
import { TextInput } from '@ui/kit/TextInput';
import { useLocale } from '@ui/foundation/i18n/LocaleContext';
import { Palette, radius, spacing, typeScale, useColors, useThemedStyles } from '@ui/foundation/theme/theme';

/** Choosing a new passphrase (typed twice), or entering one to open a backup. */
export type PassphraseMode = 'set' | 'enter';

/** Checks a passphrase (deriving a key, decrypting): null when it worked, or the error to show. */
type Check = (passphrase: string) => Promise<string | null>;

type Request = { id: number; mode: PassphraseMode; check: Check; resolve: (ok: boolean) => void };

/**
 * A passphrase dialog driven by a promise: `ask(mode, check)` shows it and resolves true once
 * `check` accepts a passphrase, or false when the user cancels. Render `modal` once.
 */
export function usePassphrasePrompt() {
  const [request, setRequest] = useState<Request | null>(null);
  const ask = (mode: PassphraseMode, check: Check) =>
    new Promise<boolean>((resolve) => setRequest({ id: Date.now(), mode, check, resolve }));
  const close = (ok: boolean) => {
    request?.resolve(ok);
    setRequest(null);
  };
  const modal = request ? <PassphraseModal key={request.id} request={request} onClose={close} /> : null;
  return { modal, ask };
}

function PassphraseModal({ request, onClose }: { request: Request; onClose: (ok: boolean) => void }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { m } = useLocale();
  const t = m.passphrase;
  const { mode, check } = request;
  const [passphrase, setPassphrase] = useState('');
  const [repeat, setRepeat] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy || !passphrase) return;
    if (mode === 'set' && passphrase.length < MIN_PASSPHRASE_LENGTH) {
      return setError(t.tooShort(MIN_PASSPHRASE_LENGTH));
    }
    if (mode === 'set' && passphrase !== repeat) return setError(t.mismatch);
    setError(null);
    setBusy(true);
    const problem = await check(passphrase).catch((e: unknown) => String(e));
    setBusy(false);
    if (problem) setError(problem);
    else onClose(true);
  };

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={() => !busy && onClose(false)}
      statusBarTranslucent
    >
      <KeyboardAvoidingView style={styles.backdrop} behavior="padding">
        <View style={styles.card}>
          <Text style={styles.title}>{mode === 'set' ? t.setTitle : t.enterTitle}</Text>
          <Text style={styles.body}>{mode === 'set' ? t.setBody : t.enterBody}</Text>
          <TextInput
            style={styles.input}
            value={passphrase}
            onChangeText={setPassphrase}
            placeholder={t.placeholder}
            placeholderTextColor={c.muted}
            secureTextEntry
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            editable={!busy}
            returnKeyType={mode === 'set' ? 'next' : 'done'}
            onSubmitEditing={mode === 'enter' ? submit : undefined}
          />
          {mode === 'set' && (
            <TextInput
              style={styles.input}
              value={repeat}
              onChangeText={setRepeat}
              placeholder={t.repeatPlaceholder}
              placeholderTextColor={c.muted}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!busy}
              returnKeyType="done"
              onSubmitEditing={submit}
            />
          )}
          {!!error && <Text style={styles.error}>{error}</Text>}
          {busy ? (
            <View style={styles.busy}>
              <ActivityIndicator color={c.accent} />
              <Text style={styles.body}>{t.working}</Text>
            </View>
          ) : (
            <>
              <Button
                title={mode === 'set' ? t.save : t.unlock}
                onPress={submit}
                disabled={!passphrase || (mode === 'set' && !repeat)}
              />
              <Button title={m.common.cancel} variant="secondary" onPress={() => onClose(false)} />
            </>
          )}
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
    title: { ...typeScale.title, color: c.text },
    body: { color: c.muted, lineHeight: 20 },
    // Never red: a calm, plain note.
    error: { color: c.text, lineHeight: 20 },
    busy: { flexDirection: 'row', alignItems: 'center', gap: spacing(2), paddingVertical: spacing(2) },
    input: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.md,
      padding: spacing(3),
      fontSize: 17,
      color: c.text,
      backgroundColor: c.background,
    },
  });
