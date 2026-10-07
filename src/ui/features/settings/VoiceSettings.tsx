import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@ui/kit/Text';
import { TextInput } from '@ui/kit/TextInput';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@ui/kit/Button';
import { Chip } from '@ui/kit/Chip';
import { Card } from '@ui/kit/Card';
import { DEFAULT_QUOTES } from '@domain/voices/quotes';
import { Palette, paletteFor, spacing, useColors, useThemedStyles } from '@ui/foundation/theme/theme';
import { MOODS } from '@domain/checkins/types';
import { SettingsStore } from '@ui/state/useSettings';
import { useLocale } from '@ui/foundation/i18n/LocaleContext';
import { VOICE_ROTATIONS } from '@domain/voices/rotation';
import { VOICE_IDS, VoiceId, formatQuotesText, parseQuotesText } from '@domain/voices/voices';
import { voiceFor } from '@ui/foundation/voices/voices';
import { useVoice } from '@ui/foundation/theme/voiceContext';

/** Pick a voice, or let several take turns, and edit the quotes it shows. */
export function VoiceSettings({ settings }: { settings: SettingsStore }) {
  const styles = useThemedStyles(makeStyles);
  const { m, locale } = useLocale();
  const voice = useVoice();
  const [editing, setEditing] = useState(false);
  // Collapsed by default: the list is long and rarely changed.
  const [expanded, setExpanded] = useState(false);
  const { customQuotes, voiceRotation, rotationVoices } = settings.settings;
  const usingCustom = (customQuotes[voice.id]?.length ?? 0) > 0;
  const rotating = voiceRotation !== 'off';

  // While rotating, a tap adds or removes a voice from the turns; at least one stays.
  const toggleRotation = (id: VoiceId) => {
    const next = rotationVoices.includes(id)
      ? rotationVoices.filter((v) => v !== id)
      : [...rotationVoices, id];
    if (next.length > 0) settings.update({ rotationVoices: next });
  };

  return (
    <Card>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityHint={expanded ? m.voiceSettings.hide : m.voiceSettings.show}
        onPress={() => setExpanded((e) => !e)}
        style={styles.header}
      >
        <View style={styles.headerText}>
          <Text style={styles.title}>{m.voiceSettings.title}</Text>
          <Text style={styles.current}>
            {voice.name} · {voice.tagline}
          </Text>
        </View>
        <Text style={styles.headerEmoji}>{MOODS.map((m) => voice.moodEmoji[m]).join('')}</Text>
        <Text style={styles.chevron}>{expanded ? '▴' : '▾'}</Text>
      </Pressable>

      {expanded && (
        <>
          <Text style={styles.body}>{m.voiceSettings.body}</Text>
          <Text style={styles.subtitle}>{m.voiceSettings.rotation}</Text>
          <View style={styles.chips} accessibilityRole="radiogroup">
            {VOICE_ROTATIONS.map((option) => (
              <Chip
                key={option}
                label={m.voiceSettings.rotations[option]}
                selected={option === voiceRotation}
                onPress={() => settings.update({ voiceRotation: option })}
              />
            ))}
          </View>
          {rotating && (
            <Text style={styles.body}>
              {m.voiceSettings.today(voice.name)}. {m.voiceSettings.rotationBody}
            </Text>
          )}
          <View style={styles.list} accessibilityRole={rotating ? undefined : 'radiogroup'}>
            {VOICE_IDS.map((id) => {
              const v = voiceFor(id, locale);
              const selected = id === voice.id;
              const inRotation = rotationVoices.includes(id);
              return (
                <Pressable
                  key={id}
                  accessibilityRole={rotating ? 'checkbox' : 'radio'}
                  accessibilityState={rotating ? { checked: inRotation } : { selected }}
                  accessibilityLabel={
                    rotating ? m.voiceSettings.inRotationA11y(v.name) : `${v.name}: ${v.tagline}`
                  }
                  onPress={() => (rotating ? toggleRotation(id) : settings.update({ voice: id }))}
                  style={[
                    styles.option,
                    selected && styles.optionSelected,
                    rotating && !inRotation && styles.optionOut,
                  ]}
                >
                  <View
                    style={[styles.dot, { backgroundColor: paletteFor(settings.settings.theme, id).accent }]}
                  />
                  <View style={styles.optionText}>
                    <Text style={[styles.optionName, selected && styles.optionNameSelected]}>{v.name}</Text>
                    <Text style={styles.optionTagline}>{v.tagline}</Text>
                  </View>
                  <Text style={styles.optionEmoji}>{MOODS.map((m) => v.moodEmoji[m]).join('')}</Text>
                  {rotating && <Text style={styles.check}>{inRotation ? '✓' : ''}</Text>}
                </Pressable>
              );
            })}
          </View>

          <View style={styles.quotesRow}>
            <Text style={styles.body}>
              {voice.quotes.length === 0
                ? m.voiceSettings.noQuotes
                : m.voiceSettings.quoteCount(voice.quotes.length, usingCustom)}
            </Text>
          </View>
          <Button
            title={m.voiceSettings.edit(voice.name)}
            variant="secondary"
            onPress={() => setEditing(true)}
          />
        </>
      )}

      <QuoteEditor
        visible={editing}
        voiceId={voice.id}
        settings={settings}
        onClose={() => setEditing(false)}
      />
    </Card>
  );
}

type EditorProps = { visible: boolean; voiceId: VoiceId; settings: SettingsStore; onClose: () => void };

function QuoteEditor({ visible, voiceId, settings, onClose }: EditorProps) {
  const styles = useThemedStyles(makeStyles);
  const { m } = useLocale();
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
    Alert.alert(m.voiceSettings.restoreTitle, m.voiceSettings.restoreBody, [
      { text: m.common.cancel, style: 'cancel' },
      { text: m.voiceSettings.restoreConfirm, style: 'destructive', onPress: () => save([]) },
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
          <Text style={styles.editorTitle}>{m.voiceSettings.editorTitle(voice.name)}</Text>
          <Text style={styles.body}>{m.voiceSettings.editorBody}</Text>
          <TextInput
            style={styles.editorInput}
            value={text}
            onChangeText={setText}
            multiline
            autoCorrect={false}
            placeholder={m.voiceSettings.editorPlaceholder}
            placeholderTextColor={c.muted}
          />
          <Button title={m.common.save} onPress={() => save(parseQuotesText(text))} />
          <View style={styles.editorActions}>
            {DEFAULT_QUOTES[voiceId].length > 0 && (
              <View style={styles.flex}>
                <Button title={m.voiceSettings.restore} variant="secondary" onPress={restore} />
              </View>
            )}
            <View style={styles.flex}>
              <Button title={m.common.cancel} variant="secondary" onPress={onClose} />
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
    title: { fontSize: 18, fontWeight: '600', color: c.text },
    header: { flexDirection: 'row', alignItems: 'center', gap: spacing(2) },
    headerText: { flex: 1 },
    current: { fontSize: 13, color: c.muted, marginTop: 2 },
    headerEmoji: { fontSize: 14, letterSpacing: 1 },
    chevron: { fontSize: 16, color: c.muted, width: 16, textAlign: 'center' },
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
    optionOut: { opacity: 0.45 },
    check: { width: 16, color: c.accent, fontWeight: '700', textAlign: 'center' },
    subtitle: { fontSize: 15, fontWeight: '600', color: c.text },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2) },
    optionText: { flex: 1 },
    dot: { width: 14, height: 14, borderRadius: 7 },
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
