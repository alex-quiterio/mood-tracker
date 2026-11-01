import { Modal, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Entry } from '@domain/checkins/types';
import type { Habit } from '@domain/habits/habits';
import type { Urge } from '@domain/habits/urges';
import { missingData } from '@domain/habitModules/availability';
import { activeModules } from '@domain/habitModules/matching';
import type { HabitModule, ModuleInput } from '@domain/habitModules/modules';
import { type ModulePreferences, offFor, stateOf, withState } from '@domain/habitModules/preferences';
import { localizeHabit } from '@ui/foundation/i18n/habits';
import { useLocale } from '@ui/foundation/i18n/LocaleContext';
import { dataList } from '@ui/foundation/i18n/habitModules';
import { Palette, spacing, typeScale, useThemedStyles } from '@ui/foundation/theme/theme';
import { Button } from '@ui/kit/Button';
import { Card } from '@ui/kit/Card';
import { Text } from '@ui/kit/Text';

import { MODULE_VIEWS } from './registry';

type Props = {
  /** The habit whose modules are shown, or null when closed. */
  habit: Habit | null;
  entries: Entry[];
  urges: Urge[];
  today: string;
  preferences: ModulePreferences;
  onPreferencesChange: (next: ModulePreferences) => void;
  onClose: () => void;
};

/**
 * A habit's insight modules, each in the same frame: its name and what it's for,
 * what data it still needs, then its own view. Knows nothing of any module's insides.
 */
export function HabitModulesModal({
  habit,
  entries,
  urges,
  today,
  preferences,
  onPreferencesChange,
  onClose,
}: Props) {
  const styles = useThemedStyles(makeStyles);
  const { m, locale } = useLocale();
  const shown = habit && localizeHabit(habit, locale);

  return (
    <Modal visible={habit !== null} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        {habit && shown && (
          <ScrollView contentContainerStyle={styles.scroll}>
            <Text style={styles.title}>
              {shown.emoji} {shown.name}
            </Text>
            {activeModules(habit, offFor(preferences, habit.id)).map((module) => (
              <ModuleFrame
                key={module.id}
                module={module}
                input={{ habit: shown, entries, urges, today }}
                state={stateOf(preferences, module.id)}
                onStateChange={(state) => onPreferencesChange(withState(preferences, module.id, state))}
              />
            ))}
            <Button title={m.modules.close} variant="secondary" onPress={onClose} />
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

type FrameProps = {
  module: HabitModule;
  input: ModuleInput;
  state: unknown;
  onStateChange: (state: unknown) => void;
};

function ModuleFrame({ module, input, state, onStateChange }: FrameProps) {
  const styles = useThemedStyles(makeStyles);
  const { m, locale } = useLocale();
  const missing = missingData(module, input);
  const ModuleView = MODULE_VIEWS[module.id];
  return (
    <View style={styles.module}>
      <Card>
        <Text style={styles.heading}>{m.modules.names[module.id]}</Text>
        <Text style={styles.muted}>{m.modules.taglines[module.id]}</Text>
        {missing.required.length > 0 ? (
          <Text style={styles.body}>{m.modules.needs(dataList(missing.required, locale))}</Text>
        ) : (
          missing.optional.length > 0 && (
            <Text style={styles.muted}>{m.modules.sharperWith(dataList(missing.optional, locale))}</Text>
          )
        )}
      </Card>
      {missing.required.length === 0 && (
        <ModuleView input={input} state={state} onStateChange={onStateChange} />
      )}
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    scroll: { padding: spacing(4), gap: spacing(4) },
    module: { gap: spacing(3) },
    title: { ...typeScale.title, color: c.text, ...c.heading },
    heading: { ...typeScale.heading, color: c.text, ...c.heading },
    body: { color: c.text, lineHeight: 20 },
    muted: { color: c.muted, fontSize: 13, lineHeight: 18 },
  });
