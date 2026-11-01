import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { ModuleInput } from '@domain/habitModules/modules';
import {
  EXPERIMENT_LENGTHS,
  PLAN_MAX_LENGTH,
  type TriggerEcologyState,
  experimentResult,
  latestExperiment,
  removeExperiment,
  startExperiment,
} from '@domain/habitModules/triggerEcology/experiments';
import type { TriggerKey } from '@domain/habitModules/triggerEcology/triggers';
import { useLocale } from '@ui/foundation/i18n/LocaleContext';
import { triggerLabel } from '@ui/foundation/i18n/habitModules';
import { Palette, spacing, typeScale, useColors, useThemedStyles } from '@ui/foundation/theme/theme';
import { Button } from '@ui/kit/Button';
import { Card } from '@ui/kit/Card';
import { Chip } from '@ui/kit/Chip';
import { Text } from '@ui/kit/Text';
import { TextInput } from '@ui/kit/TextInput';

import { ComparisonChart, RateComparisonChart } from './StatCharts';

/** Offered before any trigger has been named, so an experiment can start on day one. */
const STARTERS: TriggerKey[] = [
  'feeling:boredom',
  'feeling:restlessness',
  'feeling:loneliness',
  'context:alone',
  'sleep:shortNight',
];

type Props = {
  input: ModuleInput;
  state: TriggerEcologyState;
  /** Triggers seen in this habit's urges, most frequent first. */
  triggers: TriggerKey[];
  onStateChange: (state: TriggerEcologyState) => void;
};

/** A hunch about one trigger, tested over a week or two against the days before. */
export function ExperimentCard({ input, state, triggers, onStateChange }: Props) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { m, locale } = useLocale();
  const t = m.triggerEcology;
  const options = triggers.length > 0 ? triggers : STARTERS;
  const [trigger, setTrigger] = useState<TriggerKey>(options[0]);
  const [plan, setPlan] = useState('');
  const [days, setDays] = useState<number>(EXPERIMENT_LENGTHS[0]);
  const [fresh, setFresh] = useState(false);
  const latest = latestExperiment(state, input.habit.id);
  const shown = latest && !fresh ? latest : null;

  if (shown) {
    const result = experimentResult(shown, input);
    const name = triggerLabel(shown.trigger, locale);
    return (
      <Card>
        <Text style={styles.heading}>{t.experimentsTitle}</Text>
        <Text style={styles.text}>
          {shown.plan ? t.hypothesis(name, shown.plan) : t.hypothesisNoPlan(name)}
        </Text>
        <Text style={styles.muted}>{result.finished ? t.finished : t.dayOf(result.day, shown.days)}</Text>
        {result.doses.a.n > 0 && result.doses.b.n > 0 && (
          <View style={styles.group}>
            <Text style={styles.label}>{t.dosesRow}</Text>
            <ComparisonChart comparison={result.doses} labels={[t.during, t.before]} domain={null} />
          </View>
        )}
        {result.passed.a.n + result.passed.b.n > 0 && (
          <View style={styles.group}>
            <Text style={styles.label}>{t.triggerPassedRow}</Text>
            <RateComparisonChart comparison={result.passed} labels={[t.during, t.before]} />
          </View>
        )}
        <Button
          title={result.finished ? t.again : t.stop}
          variant="secondary"
          onPress={() => {
            if (!result.finished) onStateChange(removeExperiment(state, shown));
            setFresh(true);
          }}
        />
      </Card>
    );
  }

  return (
    <Card>
      <Text style={styles.heading}>{t.experimentsTitle}</Text>
      <Text style={styles.muted}>{t.experimentsIntro}</Text>
      <Text style={styles.label}>{t.pickTrigger}</Text>
      <View style={styles.chips}>
        {options.map((k) => (
          <Chip
            key={k}
            label={triggerLabel(k, locale)}
            selected={k === trigger}
            onPress={() => setTrigger(k)}
          />
        ))}
      </View>
      <TextInput
        style={styles.input}
        value={plan}
        onChangeText={setPlan}
        placeholder={t.planPlaceholder}
        placeholderTextColor={c.muted}
        maxLength={PLAN_MAX_LENGTH}
      />
      <View style={styles.chips}>
        {EXPERIMENT_LENGTHS.map((n) => (
          <Chip key={n} label={t.days(n)} selected={n === days} onPress={() => setDays(n)} />
        ))}
      </View>
      <Button
        title={t.start}
        onPress={() => {
          onStateChange(
            startExperiment(state, { habitId: input.habit.id, trigger, plan, startedOn: input.today, days }),
          );
          setPlan('');
          setFresh(false);
        }}
      />
    </Card>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    heading: { ...typeScale.heading, color: c.text, ...c.heading },
    text: { color: c.text, fontSize: 14, lineHeight: 20 },
    muted: { color: c.muted, fontSize: 13, lineHeight: 18 },
    label: { color: c.muted, fontSize: 12, fontWeight: '600' },
    group: { gap: spacing(2) },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2) },
    input: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 8,
      padding: spacing(2),
      color: c.text,
    },
  });
