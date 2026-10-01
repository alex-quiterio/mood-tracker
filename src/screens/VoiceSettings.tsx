import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../components/Button';
import { DEFAULT_QUOTES } from '../quotes';
import { Palette, spacing, useColors, useThemedStyles } from '../theme';
import { MOODS } from '../types';
import { SettingsStore } from '../useSettings';
import { VOICES, VOICE_IDS, VoiceId, formatQuotesText, parseQuotesText, useVoice } from '../voices';

/** Pick a voice, and edit the quotes it shows. */
export function VoiceSettings({ settings }: { settings: SettingsStore }) {
  const styles = useThemedStyles(makeStyles);
  const voice = useVoice();
  const [editing, setEditing] = useState(false);
  const { customQuotes } = settings.settings;
  const usingCustom = (customQuotes[voice.id]?.length ?? 0) > 0;

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Voice</Text>
      <Text style={styles.body}>
        Changes how the app speaks: mood names, emojis, questions and the Claude prompt. Your data stays the
        same.
      </Text>
      <View style={styles.list} accessibilityRole="radiogroup">
        {VOICE_IDS.map((id) => {
          const v = VOICES[id];
          const selected = id === voice.id;
          return (
            <Pressable
              key={id}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${v.name}: ${v.tagline}`}
              onPress={() => settings.update({ voice: id })}
              style={[styles.option, selected && styles.optionSelected]}
            >
              <View style={styles.optionText}>
                <Text style={[styles.optionName, selected && styles.optionNameSelected]}>{v.name}</Text>
                <Text style={styles.optionTagline}>{v.tagline}</Text>
              </View>
              <Text style={styles.optionEmoji}>{MOODS.map((m) => v.moodEmoji[m]).join('')}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.quotesRow}>
        <Text style={styles.body}>
          {voice.quotes.length === 0
            ? 'No quotes yet for this voice.'
            : `${voice.quotes.length} quotes · ${usingCustom ? 'your own' : 'defaults'}`}
        </Text>
      </View>
      <Button title={`Edit ${voice.name} quotes`} variant="secondary" onPress={() => setEditing(true)} />

      <QuoteEditor
        visible={editing}
        voiceId={voice.id}
        settings={settings}
        onClose={() => setEditing(false)}
      />
    </View>
  );
}

type EditorProps = { visible: boolean; voiceId: VoiceId; settings: SettingsStore; onClose: () => void };

function QuoteEditor({ visible, voiceId, settings, onClose }: EditorProps) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const voice = useVoice();
  const [text, setText] = useState('');

  const save = (quotes: ReturnType<typeof parseQuotesText>) => {
    const next = { ...settings.settings.customQuotes };
    if (quotes.length > 0) next[voiceId] = quotes;
    else delete next[voiceId];
    settings.update({ customQuotes: next });
    onClose();
  };

  const restore = () =>
    Alert.alert('Restore the default quotes?', 'Your own quotes for this voice will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Restore', style: 'destructive', onPress: () => save([]) },
    ]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onShow={() => setText(formatQuotesText(voice.quotes))}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.editorRoot} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={styles.editor} behavior="padding">
          <Text style={styles.editorTitle}>{VOICES[voiceId].name} quotes</Text>
          <Text style={styles.body}>
            One quote per paragraph, with a blank line between them. To credit a source, put it on the last
            line, starting with “—”. Clear everything to go back to the defaults.
          </Text>
          <TextInput
            style={styles.editorInput}
            value={text}
            onChangeText={setText}
            multiline
            autoCorrect={false}
            placeholder={'Write a quote here.\n— Where it is from (optional)'}
            placeholderTextColor={c.muted}
          />
          <Button title="Save" onPress={() => save(parseQuotesText(text))} />
          <View style={styles.editorActions}>
            {DEFAULT_QUOTES[voiceId].length > 0 && (
              <View style={styles.flex}>
                <Button title="Restore defaults" variant="secondary" onPress={restore} />
              </View>
            )}
            <View style={styles.flex}>
              <Button title="Cancel" variant="secondary" onPress={onClose} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    flex: { flex: 1 },
    section: {
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: spacing(4),
      borderWidth: 1,
      borderColor: c.border,
      gap: spacing(3),
    },
    title: { fontSize: 18, fontWeight: '600', color: c.text },
    body: { color: c.muted, lineHeight: 20 },
    list: { gap: spacing(2) },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(3),
      padding: spacing(3),
      borderRadius: 12,
      borderWidth: 2,
      borderColor: c.border,
    },
    optionSelected: { borderColor: c.accent },
    optionText: { flex: 1 },
    optionName: { fontSize: 16, color: c.text },
    optionNameSelected: { fontWeight: '700' },
    optionTagline: { fontSize: 13, color: c.muted, marginTop: 2 },
    optionEmoji: { fontSize: 15, letterSpacing: 1 },
    quotesRow: { flexDirection: 'row', alignItems: 'center' },
    editorRoot: { flex: 1, backgroundColor: c.background },
    editor: { flex: 1, padding: spacing(4), gap: spacing(3) },
    editorTitle: { fontSize: 24, fontWeight: '700', color: c.text },
    editorInput: {
      flex: 1,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      padding: spacing(3),
      fontSize: 15,
      lineHeight: 21,
      color: c.text,
      textAlignVertical: 'top',
    },
    editorActions: { flexDirection: 'row', gap: spacing(2) },
  });
