import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@ui/kit/Text';
import { Chip } from '@ui/kit/Chip';
import { Card } from '@ui/kit/Card';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  BREATH_COUNTS,
  BREATH_PATTERNS,
  BreathPattern,
  FOCUS_MINUTES,
  FOCUS_OBJECTS,
  FocusObject,
  breathSessionSeconds,
  formatClock,
} from '@domain/practice/practices';
import { Button } from '@ui/kit/Button';
import { Palette, spacing, useThemedStyles, typeScale } from '@ui/foundation/theme/theme';
import { useLocale } from '@ui/foundation/i18n/LocaleContext';

import { BreathSession } from './BreathSession';
import { FocusSession } from './FocusSession';

type Running =
  | { kind: 'breath'; pattern: BreathPattern; breaths: number }
  | { kind: 'focus'; minutes: number; object: FocusObject };

/** A pause from the day: count breaths, or rest your gaze on one thing until the bell. */
export function PracticeModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const styles = useThemedStyles(makeStyles);
  const { m } = useLocale();
  const [pattern, setPattern] = useState(BREATH_PATTERNS[0]);
  const [breaths, setBreaths] = useState<number>(10);
  const [minutes, setMinutes] = useState<number>(3);
  const [object, setObject] = useState(FOCUS_OBJECTS[0]);
  const [running, setRunning] = useState<Running | null>(null);

  const close = () => {
    setRunning(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={running ? () => setRunning(null) : close}>
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        {running?.kind === 'breath' && (
          <BreathSession
            pattern={running.pattern}
            breaths={running.breaths}
            onClose={() => setRunning(null)}
          />
        )}
        {running?.kind === 'focus' && (
          <FocusSession minutes={running.minutes} object={running.object} onClose={() => setRunning(null)} />
        )}
        {!running && (
          <ScrollView contentContainerStyle={styles.menu}>
            <Text style={styles.title}>{m.practice.title}</Text>

            <Card>
              <Text style={styles.cardTitle}>{m.practice.countBreaths}</Text>
              <Chips
                options={BREATH_PATTERNS.map((p) => ({ key: p.id, label: m.practice.patterns[p.id].name }))}
                selected={pattern.id}
                onSelect={(id) => setPattern(BREATH_PATTERNS.find((p) => p.id === id)!)}
              />
              <Text style={styles.body}>{m.practice.patterns[pattern.id].description}</Text>
              <Chips
                options={BREATH_COUNTS.map((n) => ({ key: String(n), label: m.practice.breathsOption(n) }))}
                selected={String(breaths)}
                onSelect={(n) => setBreaths(Number(n))}
              />
              <Button
                title={m.practice.startFor(formatClock(breathSessionSeconds(pattern, breaths)))}
                onPress={() => setRunning({ kind: 'breath', pattern, breaths })}
              />
            </Card>

            <Card>
              <Text style={styles.cardTitle}>{m.practice.focus}</Text>
              <Chips
                options={FOCUS_OBJECTS.map((o) => ({ key: o.id, label: m.practice.objects[o.id].name }))}
                selected={object.id}
                onSelect={(id) => setObject(FOCUS_OBJECTS.find((o) => o.id === id)!)}
              />
              <Text style={styles.body}>{m.practice.objects[object.id].hint}</Text>
              <Chips
                options={FOCUS_MINUTES.map((n) => ({ key: String(n), label: m.practice.minutesOption(n) }))}
                selected={String(minutes)}
                onSelect={(m) => setMinutes(Number(m))}
              />
              <Button
                title={m.practice.start}
                onPress={() => setRunning({ kind: 'focus', minutes, object })}
              />
            </Card>

            <Text style={styles.footnote}>{m.practice.footnote}</Text>
            <Button title={m.practice.back} variant="secondary" onPress={close} />
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

type ChipsProps = {
  options: { key: string; label: string }[];
  selected: string;
  onSelect: (key: string) => void;
};

function Chips({ options, selected, onSelect }: ChipsProps) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.chips} accessibilityRole="radiogroup">
      {options.map((o) => (
        <Chip key={o.key} label={o.label} selected={o.key === selected} onPress={() => onSelect(o.key)} />
      ))}
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    menu: { padding: spacing(4), gap: spacing(4) },
    title: { ...typeScale.title, color: c.text, ...c.heading },
    cardTitle: { fontSize: 18, fontWeight: '600', color: c.text, ...c.heading },
    body: { color: c.muted, lineHeight: 20 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2) },
    footnote: { color: c.muted, fontSize: 13, textAlign: 'center' },
  });
