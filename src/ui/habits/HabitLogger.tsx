import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  Habit,
  HabitLog,
  INSTEAD_MAX_LENGTH,
  MAX_DOSES,
  activeHabits,
  toggleOption,
} from '@domain/habits/habits';
import { Palette, spacing, useColors, useThemedStyles } from '@ui/theme/theme';

type Props = { habits: Habit[]; log: HabitLog; onChange: (log: HabitLog) => void };

/**
 * Habits for one check-in: doses of the ones to reduce (start unlogged, so 0 is a
 * real answer), good habits to tick, and what you did instead.
 */
export function HabitLogger({ habits, log, onChange }: Props) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const reduce = activeHabits(habits, 'reduce');
  const grow = activeHabits(habits, 'grow');
  if (reduce.length === 0 && grow.length === 0) return null;

  const setDose = (id: string, count: number | null) => {
    const doses = { ...log.doses };
    if (count === null) delete doses[id];
    else doses[id] = { ...doses[id], count: Math.max(0, Math.min(MAX_DOSES, count)) };
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
      {reduce.length > 0 && <Text style={styles.heading}>Since your last check-in</Text>}
      {reduce.map((h) => {
        const dose = log.doses[h.id];
        return (
          <View key={h.id} style={styles.doseRow}>
            <Text style={styles.doseName}>
              {h.emoji} {h.name}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={dose ? `Roughly: ${dose.approx ? 'on' : 'off'}` : 'Roughly'}
              disabled={!dose}
              onPress={() => toggleApprox(h.id)}
              style={[styles.approx, dose?.approx && styles.approxOn, !dose && styles.hidden]}
            >
              <Text style={[styles.approxText, dose?.approx && styles.approxTextOn]}>≈ roughly</Text>
            </Pressable>
            <Step
              label="−"
              hint={`Fewer ${h.unit}`}
              onPress={() => setDose(h.id, dose ? dose.count - 1 : 0)}
              disabled={dose?.count === 0}
            />
            <Pressable
              onLongPress={() => setDose(h.id, null)}
              accessibilityLabel={
                dose ? `${dose.count} ${h.unit}. Long press to clear.` : `${h.name} not logged`
              }
              style={styles.countBox}
            >
              <Text style={[styles.count, dose?.count === 0 && { color: c.accent }]}>
                {!dose ? '–' : dose.count === 0 ? '🌱' : dose.count}
              </Text>
            </Pressable>
            <Step label="+" hint={`More ${h.unit}`} onPress={() => setDose(h.id, (dose?.count ?? 0) + 1)} />
          </View>
        );
      })}

      {grow.length > 0 && <Text style={styles.heading}>Good things you did</Text>}
      <View style={styles.chips}>
        {grow
          .filter((h) => !h.options?.length)
          .map((h) => (
            <Chip
              key={h.id}
              label={`${h.emoji} ${h.name}`}
              on={log.did.includes(h.id)}
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
                  key={o.id}
                  label={`${o.emoji} ${o.label}`}
                  on={log.chosen?.[h.id]?.includes(o.id) ?? false}
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
        placeholder="🌱 What did you do instead? (optional)"
        placeholderTextColor={c.muted}
        maxLength={INSTEAD_MAX_LENGTH}
      />
    </View>
  );
}

function Step({
  label,
  hint,
  onPress,
  disabled,
}: {
  label: string;
  hint: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={hint}
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      style={({ pressed }) => [styles.step, (pressed || disabled) && styles.dimmed]}
    >
      <Text style={styles.stepText}>{label}</Text>
    </Pressable>
  );
}

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      onPress={onPress}
      style={[styles.chip, on && styles.chipOn]}
    >
      <Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text>
    </Pressable>
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
    doseName: { flex: 1, fontSize: 15, color: c.text },
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
    step: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepText: { fontSize: 18, lineHeight: 20, color: c.accent, fontWeight: '600' },
    dimmed: { opacity: 0.35 },
    countBox: { width: 34, alignItems: 'center' },
    count: { fontSize: 17, fontWeight: '700', color: c.text, fontVariant: ['tabular-nums'] },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2) },
    chip: {
      paddingHorizontal: spacing(3),
      paddingVertical: spacing(1.5),
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
    },
    chipOn: { backgroundColor: c.accent, borderColor: c.accent },
    chipText: { color: c.text, fontSize: 14 },
    chipTextOn: { color: c.accentText, fontWeight: '600' },
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
