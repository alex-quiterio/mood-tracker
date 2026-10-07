import { useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { TextInput } from '@ui/kit/TextInput';
import { Text } from '@ui/kit/Text';

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
import { localizeHabit } from '@ui/foundation/i18n/habits';
import { Button } from '@ui/kit/Button';
import { Card } from '@ui/kit/Card';
import { Chip } from '@ui/kit/Chip';
import { Stepper } from '@ui/kit/Stepper';
import { SettingsStore } from '@ui/state/useSettings';
import { useLocale } from '@ui/foundation/i18n/LocaleContext';
import { Palette, spacing, useColors, useThemedStyles, radius } from '@ui/foundation/theme/theme';

/** Which habits to log, their prices, usual amounts, weights and options. Collapsed by default. */
export function HabitSettings({ settings }: { settings: SettingsStore }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const { habits, habitsInPrompt, showSpending } = settings.settings;
  const { m, locale } = useLocale();
  const setHabits = (next: Habit[]) => settings.update({ habits: next });
  const tracked = habits.filter((h) => !h.archived);

  return (
    <Card>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((e) => !e)}
        style={styles.header}
      >
        <View style={styles.flex}>
          <Text style={styles.title}>{m.habitSettings.title}</Text>
          <Text style={styles.muted}>
            {tracked.map((h) => h.emoji).join(' ') || m.habitSettings.noneTracked}
          </Text>
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
              shown={localizeHabit(h, locale)}
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
            <Text style={[styles.body, styles.flex]}>{m.habitSettings.inPrompt}</Text>
            <Switch
              value={habitsInPrompt}
              onValueChange={(v) => settings.update({ habitsInPrompt: v })}
              trackColor={{ true: c.accent, false: c.border }}
              thumbColor={c.surface}
            />
          </View>
          <View style={styles.switchRow}>
            <Text style={[styles.body, styles.flex]}>{m.habitSettings.showSpending}</Text>
            <Switch
              value={showSpending}
              onValueChange={(v) => settings.update({ showSpending: v })}
              trackColor={{ true: c.accent, false: c.border }}
              thumbColor={c.surface}
            />
          </View>
        </>
      )}
    </Card>
  );
}

type RowProps = {
  habit: Habit;
  /** The habit as shown, in the app's language; edits apply to `habit`. */
  shown: Habit;
  open: boolean;
  onToggleOpen: () => void;
  onChange: (patch: Partial<Omit<Habit, 'id'>>) => void;
  onReplace: (habit: Habit) => void;
};

function HabitRow({ habit, shown, open, onToggleOpen, onChange, onReplace }: RowProps) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const [price, setPrice] = useState(habit.pricePerDose?.toString() ?? '');
  const [optionLabel, setOptionLabel] = useState('');
  const [optionEmoji, setOptionEmoji] = useState('');
  const reduce = habit.kind === 'reduce';
  const { m } = useLocale();

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
            {shown.emoji} {shown.name}
          </Text>
          <Text style={styles.muted}>
            {reduce
              ? m.habitSettings.reduceSummary(weightOf(habit))
              : m.habitSettings.growSummary(weightOf(habit))}
            {reduce && habit.pricePerDose ? ` · €${habit.pricePerDose}` : ''}
            {open ? '' : m.habitSettings.edit}
          </Text>
        </Pressable>
        <Switch
          value={!habit.archived}
          onValueChange={(on) => onChange({ archived: !on })}
          trackColor={{ true: c.accent, false: c.border }}
          thumbColor={c.surface}
          accessibilityLabel={m.habitSettings.track(shown.name)}
        />
      </View>

      {open && (
        <View style={styles.editor}>
          <Field label={m.habitSettings.name}>
            <TextInput
              style={[styles.input, styles.flex]}
              defaultValue={shown.name}
              maxLength={HABIT_NAME_MAX_LENGTH}
              // Only a real change becomes your own name; leaving it keeps the translated preset.
              onEndEditing={(e) => {
                const name = e.nativeEvent.text.trim();
                if (name && name !== shown.name) onChange({ name });
              }}
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
              <Field label={m.habitSettings.price}>
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
              <Field label={m.habitSettings.usual}>
                <Stepper
                  value={habit.usualPerDay ?? 0}
                  max={60}
                  onChange={(n) => onChange({ usualPerDay: n || undefined })}
                />
              </Field>
            </>
          )}
          <Field label={reduce ? m.habitSettings.heavyPoints : m.habitSettings.lightPoints}>
            <Stepper value={weightOf(habit)} max={5} onChange={(n) => onChange({ weight: n })} />
          </Field>
          {!reduce && (
            <View style={styles.options}>
              <Text style={styles.fieldLabel}>{m.habitSettings.options}</Text>
              <View style={styles.chips}>
                {(shown.options ?? []).map((o) => (
                  <Chip
                    key={o.id}
                    selected={false}
                    role="button"
                    onPress={() => onReplace(removeOption(habit, o.id))}
                    accessibilityLabel={m.habitSettings.removeOption(o.label)}
                    label={`${o.emoji} ${o.label} ×`}
                  />
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
                  placeholder={m.habitSettings.optionPlaceholder}
                  placeholderTextColor={c.muted}
                  maxLength={OPTION_LABEL_MAX_LENGTH}
                />
                <Button
                  title={m.common.add}
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
  const { m } = useLocale();

  return (
    <View style={styles.newHabit}>
      <Text style={styles.fieldLabel}>{m.habitSettings.addHabit}</Text>
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
          placeholder={m.habitSettings.habitPlaceholder}
          placeholderTextColor={c.muted}
          maxLength={HABIT_NAME_MAX_LENGTH}
        />
      </View>
      <View style={styles.row}>
        {(['grow', 'reduce'] as const).map((k) => (
          <Chip
            key={k}
            selected={kind === k}
            onPress={() => setKind(k)}
            label={k === 'grow' ? m.habitSettings.toGrow : m.habitSettings.toReduce}
          />
        ))}
        <View style={styles.flex} />
        <Button
          title={m.common.add}
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

const makeStyles = (c: Palette) =>
  StyleSheet.create({
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
      borderRadius: radius.sm,
      paddingHorizontal: spacing(3),
      paddingVertical: spacing(2),
      color: c.text,
      backgroundColor: c.background,
      fontSize: 15,
    },
    emojiInput: { width: 52, textAlign: 'center' },
    numberInput: { width: 96 },
    options: { gap: spacing(2) },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2) },
    newHabit: { borderTopWidth: 1, borderTopColor: c.border, paddingTop: spacing(3), gap: spacing(2) },
  });
