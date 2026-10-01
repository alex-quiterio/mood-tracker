import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import {
  HABIT_NAME_MAX_LENGTH,
  Habit,
  HabitKind,
  OPTION_LABEL_MAX_LENGTH,
  addOption,
  createHabit,
  parsePrice,
  removeOption,
  updateHabit,
  weightOf,
} from '@domain/habits/habits';
import { Button } from '@ui/components/Button';
import { SettingsStore } from '@ui/hooks/useSettings';
import { Palette, spacing, useColors, useThemedStyles } from '@ui/theme/theme';

/** Which habits to log, their prices, usual amounts, weights and options. Collapsed by default. */
export function HabitSettings({ settings }: { settings: SettingsStore }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const { habits, habitsInPrompt } = settings.settings;
  const setHabits = (next: Habit[]) => settings.update({ habits: next });
  const tracked = habits.filter((h) => !h.archived);

  return (
    <View style={styles.section}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((e) => !e)}
        style={styles.header}
      >
        <View style={styles.flex}>
          <Text style={styles.title}>Habits</Text>
          <Text style={styles.muted}>{tracked.map((h) => h.emoji).join(' ') || 'None tracked'}</Text>
        </View>
        <Text style={styles.chevron}>{expanded ? '▴' : '▾'}</Text>
      </Pressable>

      {expanded && (
        <>
          <Text style={styles.body}>
            Logged with each check-in. Zeros, good habits and what you did instead count as light points;
            doses count as heavy.
          </Text>
          {habits.map((h) => (
            <HabitRow
              key={h.id}
              habit={h}
              open={editing === h.id}
              onToggleOpen={() => setEditing(editing === h.id ? null : h.id)}
              onChange={(patch) => setHabits(updateHabit(habits, h.id, patch))}
              onReplace={(next) => setHabits(habits.map((x) => (x.id === h.id ? next : x)))}
            />
          ))}
          <NewHabit
            onAdd={(name, emoji, kind) => setHabits([...habits, createHabit(habits, name, emoji, kind)])}
          />
          <View style={styles.switchRow}>
            <Text style={[styles.body, styles.flex]}>Include habits in the Claude prompt</Text>
            <Switch
              value={habitsInPrompt}
              onValueChange={(v) => settings.update({ habitsInPrompt: v })}
              trackColor={{ true: c.accent, false: c.border }}
              thumbColor={c.surface}
            />
          </View>
        </>
      )}
    </View>
  );
}

type RowProps = {
  habit: Habit;
  open: boolean;
  onToggleOpen: () => void;
  onChange: (patch: Partial<Omit<Habit, 'id'>>) => void;
  onReplace: (habit: Habit) => void;
};

function HabitRow({ habit, open, onToggleOpen, onChange, onReplace }: RowProps) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const [price, setPrice] = useState(habit.pricePerDose?.toString() ?? '');
  const [optionLabel, setOptionLabel] = useState('');
  const [optionEmoji, setOptionEmoji] = useState('');
  const reduce = habit.kind === 'reduce';

  return (
    <View style={styles.habit}>
      <View style={styles.habitHeader}>
        <Pressable
          style={styles.flex}
          onPress={onToggleOpen}
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
        >
          <Text style={[styles.habitName, habit.archived && styles.archived]}>
            {habit.emoji} {habit.name}
          </Text>
          <Text style={styles.muted}>
            {reduce ? `To reduce · 🪨 ${weightOf(habit)}/dose` : `To grow · 🌱 ${weightOf(habit)}`}
            {reduce && habit.pricePerDose ? ` · €${habit.pricePerDose}` : ''}
            {open ? '' : ' · edit'}
          </Text>
        </Pressable>
        <Switch
          value={!habit.archived}
          onValueChange={(on) => onChange({ archived: !on })}
          trackColor={{ true: c.accent, false: c.border }}
          thumbColor={c.surface}
          accessibilityLabel={`Track ${habit.name}`}
        />
      </View>

      {open && (
        <View style={styles.editor}>
          <Field label="Name">
            <TextInput
              style={[styles.input, styles.flex]}
              defaultValue={habit.name}
              maxLength={HABIT_NAME_MAX_LENGTH}
              onEndEditing={(e) => e.nativeEvent.text.trim() && onChange({ name: e.nativeEvent.text.trim() })}
            />
            <TextInput
              style={[styles.input, styles.emojiInput]}
              defaultValue={habit.emoji}
              maxLength={4}
              onEndEditing={(e) =>
                e.nativeEvent.text.trim() && onChange({ emoji: e.nativeEvent.text.trim() })
              }
            />
          </Field>
          {reduce && (
            <>
              <Field label="Price per dose (€)">
                <TextInput
                  style={[styles.input, styles.numberInput]}
                  value={price}
                  onChangeText={setPrice}
                  onEndEditing={() => onChange({ pricePerDose: parsePrice(price) })}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={c.muted}
                />
              </Field>
              <Field label="Usually per day, before">
                <Stepper
                  value={habit.usualPerDay ?? 0}
                  max={60}
                  onChange={(n) => onChange({ usualPerDay: n || undefined })}
                />
              </Field>
            </>
          )}
          <Field label={reduce ? 'Heavy points per dose' : 'Light points when done'}>
            <Stepper value={weightOf(habit)} max={5} onChange={(n) => onChange({ weight: n })} />
          </Field>
          {!reduce && (
            <View style={styles.options}>
              <Text style={styles.fieldLabel}>Options (optional)</Text>
              <View style={styles.chips}>
                {(habit.options ?? []).map((o) => (
                  <Pressable
                    key={o.id}
                    onPress={() => onReplace(removeOption(habit, o.id))}
                    style={styles.chip}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${o.label}`}
                  >
                    <Text style={styles.chipText}>
                      {o.emoji} {o.label} ×
                    </Text>
                  </Pressable>
                ))}
              </View>
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, styles.emojiInput]}
                  value={optionEmoji}
                  onChangeText={setOptionEmoji}
                  placeholder="🙂"
                  placeholderTextColor={c.muted}
                  maxLength={4}
                />
                <TextInput
                  style={[styles.input, styles.flex]}
                  value={optionLabel}
                  onChangeText={setOptionLabel}
                  placeholder="Add an option, e.g. Gardening"
                  placeholderTextColor={c.muted}
                  maxLength={OPTION_LABEL_MAX_LENGTH}
                />
                <Button
                  title="Add"
                  variant="secondary"
                  disabled={!optionLabel.trim()}
                  onPress={() => {
                    onReplace(addOption(habit, optionLabel, optionEmoji));
                    setOptionLabel('');
                    setOptionEmoji('');
                  }}
                />
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function NewHabit({ onAdd }: { onAdd: (name: string, emoji: string, kind: HabitKind) => void }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('');
  const [kind, setKind] = useState<HabitKind>('grow');

  return (
    <View style={styles.newHabit}>
      <Text style={styles.fieldLabel}>Add a habit</Text>
      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.emojiInput]}
          value={emoji}
          onChangeText={setEmoji}
          placeholder="🙂"
          placeholderTextColor={c.muted}
          maxLength={4}
        />
        <TextInput
          style={[styles.input, styles.flex]}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Read before bed"
          placeholderTextColor={c.muted}
          maxLength={HABIT_NAME_MAX_LENGTH}
        />
      </View>
      <View style={styles.row}>
        {(['grow', 'reduce'] as const).map((k) => (
          <Pressable
            key={k}
            onPress={() => setKind(k)}
            style={[styles.chip, kind === k && styles.chipOn]}
            accessibilityRole="radio"
            accessibilityState={{ selected: kind === k }}
          >
            <Text style={[styles.chipText, kind === k && styles.chipTextOn]}>
              {k === 'grow' ? '🌱 To grow' : '🪨 To reduce'}
            </Text>
          </Pressable>
        ))}
        <View style={styles.flex} />
        <Button
          title="Add"
          disabled={!name.trim()}
          onPress={() => {
            onAdd(name, emoji, kind);
            setName('');
            setEmoji('');
          }}
        />
      </View>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.row}>{children}</View>
    </View>
  );
}

function Stepper({ value, max, onChange }: { value: number; max: number; onChange: (n: number) => void }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.row}>
      <Pressable
        style={styles.step}
        onPress={() => onChange(Math.max(0, value - 1))}
        disabled={value <= 0}
        accessibilityLabel="Less"
      >
        <Text style={styles.stepText}>−</Text>
      </Pressable>
      <Text style={styles.stepValue}>{value}</Text>
      <Pressable
        style={styles.step}
        onPress={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        accessibilityLabel="More"
      >
        <Text style={styles.stepText}>+</Text>
      </Pressable>
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    section: {
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: spacing(4),
      borderWidth: 1,
      borderColor: c.border,
      gap: spacing(3),
    },
    flex: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', gap: spacing(2) },
    title: { fontSize: 18, fontWeight: '600', color: c.text },
    chevron: { fontSize: 16, color: c.muted, width: 16, textAlign: 'center' },
    body: { color: c.muted, lineHeight: 20 },
    muted: { color: c.muted, fontSize: 12, marginTop: 2 },
    switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(2) },
    habit: { borderTopWidth: 1, borderTopColor: c.border, paddingTop: spacing(3), gap: spacing(2) },
    habitHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing(2) },
    habitName: { fontSize: 15, color: c.text },
    archived: { color: c.muted },
    editor: { gap: spacing(3), paddingLeft: spacing(2) },
    field: { gap: spacing(1) },
    fieldLabel: { fontSize: 12, color: c.muted, fontWeight: '600' },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing(2) },
    input: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 10,
      paddingHorizontal: spacing(3),
      paddingVertical: spacing(2),
      color: c.text,
      backgroundColor: c.background,
      fontSize: 15,
    },
    emojiInput: { width: 52, textAlign: 'center' },
    numberInput: { width: 96 },
    step: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.background,
    },
    stepText: { fontSize: 18, lineHeight: 20, color: c.accent, fontWeight: '600' },
    stepValue: { minWidth: 28, textAlign: 'center', fontSize: 16, fontWeight: '700', color: c.text },
    options: { gap: spacing(2) },
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
    chipText: { color: c.text, fontSize: 13 },
    chipTextOn: { color: c.accentText, fontWeight: '600' },
    newHabit: { borderTopWidth: 1, borderTopColor: c.border, paddingTop: spacing(3), gap: spacing(2) },
  });
