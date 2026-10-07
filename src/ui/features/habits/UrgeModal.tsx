import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@ui/kit/Text';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BREATH_PATTERNS } from '@domain/practice/practices';
import { Habit } from '@domain/habits/habits';
import {
  URGE_BREATHS,
  URGE_FEELINGS,
  URGE_POINTS,
  Urge,
  UrgeFeeling,
  UrgeOutcome,
  toggleFeeling,
} from '@domain/habits/urges';
import { localDate } from '@domain/shared/dates';
import { Button } from '@ui/kit/Button';
import { Card } from '@ui/kit/Card';
import { Chip } from '@ui/kit/Chip';
import { BreathSession } from '@ui/features/practice/BreathSession';
import { useLocale } from '@ui/foundation/i18n/LocaleContext';
import { MappedFeeling } from '@ui/foundation/i18n/messages.types';
import { Palette, spacing, useThemedStyles, typeScale } from '@ui/foundation/theme/theme';

type Props = {
  visible: boolean;
  /** Habits to reduce that can be picked. */
  habits: Habit[];
  onRecord: (urge: Urge) => void;
  onClose: () => void;
};

type Step =
  | { kind: 'pick' }
  | { kind: 'feel' | 'map' | 'breathe' | 'outcome'; habit: Habit }
  | { kind: 'done'; outcome: UrgeOutcome };

/**
 * An urge: pick the habit, name what you felt just before, read the craving map for
 * those feelings, breathe for two minutes, then say whether it passed.
 */
export function UrgeModal({ visible, habits, onRecord, onClose }: Props) {
  const styles = useThemedStyles(makeStyles);
  const { m } = useLocale();
  const first: Step = habits.length === 1 ? { kind: 'feel', habit: habits[0] } : { kind: 'pick' };
  const [step, setStep] = useState<Step | null>(null);
  const [feelings, setFeelings] = useState<UrgeFeeling[]>([]);
  const current = step ?? first;
  const mapped = feelings.filter((f): f is MappedFeeling => f in m.urge.map);

  const close = () => {
    setStep(null);
    setFeelings([]);
    onClose();
  };
  const afterFeeling = (habit: Habit) => setStep({ kind: mapped.length > 0 ? 'map' : 'breathe', habit });
  const record = (habit: Habit, outcome: UrgeOutcome) => {
    onRecord({
      date: localDate(),
      habitId: habit.id,
      outcome,
      ...(feelings.length > 0 ? { feelings } : {}),
      recordedAt: new Date().toISOString(),
    });
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
                onPress={() => setStep({ kind: 'feel', habit: h })}
              />
            ))}
            <Button title={m.common.cancel} variant="secondary" onPress={close} />
          </View>
        )}
        {current.kind === 'feel' && (
          <ScrollView contentContainerStyle={styles.scroll}>
            <Text style={styles.title}>{m.urge.feelTitle}</Text>
            <Text style={styles.body}>{m.urge.feelHint}</Text>
            <View style={styles.chips}>
              {URGE_FEELINGS.map((f) => (
                <Chip
                  key={f}
                  role="checkbox"
                  label={m.urge.feelings[f]}
                  selected={feelings.includes(f)}
                  onPress={() => setFeelings((list) => toggleFeeling(list, f))}
                />
              ))}
            </View>
            <Button
              title={feelings.length > 0 ? m.urge.feelNext : m.urge.feelSkip}
              variant={feelings.length > 0 ? 'primary' : 'secondary'}
              onPress={() => afterFeeling(current.habit)}
            />
          </ScrollView>
        )}
        {current.kind === 'map' && (
          <ScrollView contentContainerStyle={styles.scroll}>
            <Text style={styles.title}>{m.urge.mapTitle}</Text>
            <Text style={styles.body}>{m.urge.mapIntro}</Text>
            {mapped.map((f) => (
              <Card key={f}>
                <Text style={styles.mapFeeling}>{m.urge.feelings[f]}</Text>
                <Text style={styles.mapText}>{m.urge.map[f]}</Text>
              </Card>
            ))}
            <Button
              title={m.urge.mapNext}
              onPress={() => setStep({ kind: 'breathe', habit: current.habit })}
            />
          </ScrollView>
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
    scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing(4), gap: spacing(3) },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2) },
    mapFeeling: { color: c.text, fontWeight: '700', marginBottom: spacing(1) },
    mapText: { color: c.text, lineHeight: 20 },
    header: { padding: spacing(4), paddingBottom: 0, gap: spacing(2) },
    title: { ...typeScale.title, color: c.text, ...c.heading },
    body: { color: c.muted, lineHeight: 20 },
  });
