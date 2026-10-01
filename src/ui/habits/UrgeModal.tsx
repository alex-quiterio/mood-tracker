import { useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BREATH_PATTERNS } from '@domain/practice/practices';
import { Habit } from '@domain/habits/habits';
import { URGE_BREATHS, URGE_POINTS, Urge, UrgeOutcome } from '@domain/habits/urges';
import { localDate } from '@domain/shared/dates';
import { Button } from '@ui/components/Button';
import { BreathSession } from '@ui/practice/BreathSession';
import { useLocale } from '@ui/i18n/LocaleContext';
import { Palette, spacing, useThemedStyles } from '@ui/theme/theme';

type Props = {
  visible: boolean;
  /** Habits to reduce that can be picked. */
  habits: Habit[];
  onRecord: (urge: Urge) => void;
  onClose: () => void;
};

type Step =
  { kind: 'pick' } | { kind: 'breathe' | 'outcome'; habit: Habit } | { kind: 'done'; outcome: UrgeOutcome };

/** An urge: pick the habit, breathe for two minutes, then say whether it passed. */
export function UrgeModal({ visible, habits, onRecord, onClose }: Props) {
  const styles = useThemedStyles(makeStyles);
  const { m } = useLocale();
  const first: Step = habits.length === 1 ? { kind: 'breathe', habit: habits[0] } : { kind: 'pick' };
  const [step, setStep] = useState<Step | null>(null);
  const current = step ?? first;

  const close = () => {
    setStep(null);
    onClose();
  };
  const record = (habit: Habit, outcome: UrgeOutcome) => {
    onRecord({ date: localDate(), habitId: habit.id, outcome, recordedAt: new Date().toISOString() });
    setStep({ kind: 'done', outcome });
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        {current.kind === 'pick' && (
          <View style={styles.page}>
            <Text style={styles.title}>{m.urge.pickTitle}</Text>
            {habits.map((h) => (
              <Button
                key={h.id}
                title={`${h.emoji} ${h.name}`}
                onPress={() => setStep({ kind: 'breathe', habit: h })}
              />
            ))}
            <Button title={m.common.cancel} variant="secondary" onPress={close} />
          </View>
        )}
        {current.kind === 'breathe' && (
          <>
            <View style={styles.header}>
              <Text style={styles.title}>{m.urge.breatheTitle(current.habit.name)}</Text>
              <Text style={styles.body}>{m.urge.breatheHint}</Text>
            </View>
            <BreathSession
              pattern={BREATH_PATTERNS[0]}
              breaths={URGE_BREATHS}
              onClose={() => setStep({ kind: 'outcome', habit: current.habit })}
            />
          </>
        )}
        {current.kind === 'outcome' && (
          <View style={styles.page}>
            <Text style={styles.title}>{m.urge.outcomeTitle}</Text>
            <Text style={styles.body}>{m.urge.outcomeHint}</Text>
            <Button title={m.urge.letPass} onPress={() => record(current.habit, 'passed')} />
            <Button
              title={m.urge.hadOne}
              variant="secondary"
              onPress={() => record(current.habit, 'gaveIn')}
            />
          </View>
        )}
        {current.kind === 'done' && (
          <View style={styles.page}>
            <Text style={styles.title}>
              {current.outcome === 'passed' ? m.urge.passedTitle : m.urge.hadOneTitle}
            </Text>
            <Text style={styles.body}>
              {current.outcome === 'passed' ? m.urge.passedBody(URGE_POINTS) : m.urge.hadOneBody}
            </Text>
            <Button title={m.urge.done} onPress={close} />
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    page: { flex: 1, justifyContent: 'center', padding: spacing(4), gap: spacing(3) },
    header: { padding: spacing(4), paddingBottom: 0, gap: spacing(2) },
    title: { fontSize: 24, fontWeight: '700', color: c.text, ...c.heading },
    body: { color: c.muted, lineHeight: 20 },
  });
