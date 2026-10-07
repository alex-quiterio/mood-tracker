import { Pressable, StyleSheet, View } from 'react-native';
import { TextInput } from '@ui/kit/TextInput';
import { Text } from '@ui/kit/Text';

import {
  Habit,
  HabitLog,
  INSTEAD_MAX_LENGTH,
  MAX_DOSES,
  activeHabits,
  toggleOption,
} from '@domain/habits/habits';
import { Chip } from '@ui/kit/Chip';
import { RoundButton } from '@ui/kit/RoundButton';
import { Palette, spacing, useColors, useThemedStyles } from '@ui/foundation/theme/theme';
import { useLocale } from '@ui/foundation/i18n/LocaleContext';

type Props = {
  habits: Habit[];
  log: HabitLog;
  /** Doses that can't go lower, from urges that took the best of you. */
  floors: Record<string, number>;
  onChange: (log: HabitLog) => void;
};

/**
 * Habits for one check-in: doses of the ones to reduce (start unlogged, so 0 is a
 * real answer), good habits to tick, and what you did instead.
 */
export function HabitLogger({ habits, log, floors, onChange }: Props) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { m } = useLocale();
  const reduce = activeHabits(habits, 'reduce');
  const grow = activeHabits(habits, 'grow');
  if (reduce.length === 0 && grow.length === 0) return null;

  const setDose = (id: string, count: number | null) => {
    const doses = { ...log.doses };
    if (count === null) delete doses[id];
    else doses[id] = { ...doses[id], count: Math.max(floors[id] ?? 0, Math.min(MAX_DOSES, count)) };
    onChange({ ...log, doses });
  };
  const toggleApprox = (id: string) => {
    const dose = log.doses[id];
    if (!dose) return;
    onChange({
      ...log,
      doses: { ...log.doses, [id]: dose.approx ? { count: dose.count } : { ...dose, approx: true } },
    });
  };
  const toggleDid = (id: string) =>
    onChange({ ...log, did: log.did.includes(id) ? log.did.filter((x) => x !== id) : [...log.did, id] });

  return (
    <View style={styles.root}>
      {reduce.length > 0 && <Text style={styles.heading}>{m.habits.sinceLastCheckIn}</Text>}
      {reduce.map((h) => {
        const dose = log.doses[h.id];
        return (
          <View key={h.id} style={styles.doseRow}>
            <View style={styles.doseLabel}>
              <Text style={styles.doseName}>
                {h.emoji} {h.name}
              </Text>
              {floors[h.id] > 0 && <Text style={styles.floorHint}>{m.urge.floorHint(floors[h.id])}</Text>}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={m.habits.roughlyA11y(!!dose?.approx)}
              disabled={!dose}
              onPress={() => toggleApprox(h.id)}
              style={[styles.approx, dose?.approx && styles.approxOn, !dose && styles.hidden]}
            >
              <Text style={[styles.approxText, dose?.approx && styles.approxTextOn]}>{m.habits.roughly}</Text>
            </Pressable>
            <RoundButton
              label="−"
              accessibilityLabel={m.habits.fewer(h.unit || h.name)}
              onPress={() => setDose(h.id, dose ? dose.count - 1 : 0)}
              disabled={(dose?.count ?? 0) <= (floors[h.id] ?? 0) && !!dose}
            />
            <Pressable
              onLongPress={() => setDose(h.id, null)}
              accessibilityLabel={
                dose ? m.habits.countA11y(dose.count, h.unit || h.name) : m.habits.notLoggedA11y(h.name)
              }
              style={styles.countBox}
            >
              <Text style={[styles.count, dose?.count === 0 && { color: c.accent }]}>
                {!dose ? '–' : dose.count === 0 ? '🌱' : dose.count}
              </Text>
            </Pressable>
            <RoundButton
              label="+"
              accessibilityLabel={m.habits.moreOf(h.unit || h.name)}
              onPress={() => setDose(h.id, (dose?.count ?? 0) + 1)}
            />
          </View>
        );
      })}

      {grow.length > 0 && <Text style={styles.heading}>{m.habits.goodThings}</Text>}
      <View style={styles.chips}>
        {grow
          .filter((h) => !h.options?.length)
          .map((h) => (
            <Chip
              role="checkbox"
              key={h.id}
              label={`${h.emoji} ${h.name}`}
              selected={log.did.includes(h.id)}
              onPress={() => toggleDid(h.id)}
            />
          ))}
      </View>
      {grow
        .filter((h) => h.options?.length)
        .map((h) => (
          <View key={h.id} style={styles.optionGroup}>
            <Text style={styles.optionTitle}>
              {h.emoji} {h.name}
            </Text>
            <View style={styles.chips}>
              {h.options!.map((o) => (
                <Chip
                  role="checkbox"
                  key={o.id}
                  label={`${o.emoji} ${o.label}`}
                  selected={log.chosen?.[h.id]?.includes(o.id) ?? false}
                  onPress={() => onChange(toggleOption(log, h.id, o.id))}
                />
              ))}
            </View>
          </View>
        ))}

      <TextInput
        style={styles.instead}
        value={log.instead ?? ''}
        onChangeText={(instead) => onChange({ ...log, instead })}
        placeholder={m.habits.insteadPlaceholder}
        placeholderTextColor={c.muted}
        maxLength={INSTEAD_MAX_LENGTH}
      />
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { gap: spacing(2), paddingTop: spacing(1), borderTopWidth: 1, borderTopColor: c.border },
    heading: {
      fontSize: 12,
      fontWeight: '600',
      color: c.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: spacing(2),
    },
    doseRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(2) },
    doseLabel: { flex: 1 },
    doseName: { fontSize: 15, color: c.text },
    floorHint: { fontSize: 11, color: c.muted },
    approx: {
      paddingHorizontal: spacing(2),
      paddingVertical: 2,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.border,
    },
    approxOn: { backgroundColor: c.accent, borderColor: c.accent },
    approxText: { fontSize: 11, color: c.muted },
    approxTextOn: { color: c.accentText },
    hidden: { opacity: 0 },
    countBox: { width: 34, alignItems: 'center' },
    count: { fontSize: 17, fontWeight: '700', color: c.text, fontVariant: ['tabular-nums'] },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2) },
    optionGroup: { gap: spacing(1.5) },
    optionTitle: { fontSize: 14, color: c.text },
    instead: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      padding: spacing(3),
      fontSize: 15,
      color: c.text,
      marginTop: spacing(1),
    },
  });
