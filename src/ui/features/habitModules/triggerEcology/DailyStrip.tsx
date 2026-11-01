import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { DayPoint } from '@domain/habitModules/triggerEcology/analysis';
import { dayAndMonth, weekdayShort } from '@ui/foundation/i18n/format';
import { useLocale } from '@ui/foundation/i18n/LocaleContext';
import { Palette, spacing, useColors, useThemedStyles, withAlpha } from '@ui/foundation/theme/theme';
import { Text } from '@ui/kit/Text';

const HEIGHT = 44;
const URGE_HEIGHT = 28;

/**
 * The window day by day, as two strips over the same days: doses (a faint dot for a
 * logged zero, nothing for a day not logged) and urges, the ones let pass in the
 * accent and the rest tinted. Each strip has its own scale. Tap a day for its numbers.
 */
export function DailyStrip({ days }: { days: DayPoint[] }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { m, locale } = useLocale();
  const t = m.triggerEcology;
  const [selected, setSelected] = useState<string | null>(null);
  const maxDoses = Math.max(1, ...days.map((d) => d.doses ?? 0));
  const maxUrges = Math.max(1, ...days.map((d) => d.urges));
  const picked = days.find((d) => d.date === selected);
  const anyUrge = days.some((d) => d.urges > 0);
  const label = (d: DayPoint) => `${weekdayShort(d.date, locale)} ${dayAndMonth(d.date, locale)}`;
  const detail = (d: DayPoint) =>
    d.doses === null
      ? t.dayNotLogged(label(d), d.urges, d.passed)
      : t.dayDetail(label(d), d.doses, d.urges, d.passed);

  const columns = (strip: 'doses' | 'urges') =>
    days.map((d) => (
      <Pressable
        key={d.date}
        style={[styles.column, d.date === selected && styles.selected]}
        onPress={() => setSelected(d.date === selected ? null : d.date)}
        hitSlop={{ top: 4, bottom: 4 }}
        accessibilityRole="button"
        accessibilityLabel={detail(d)}
      >
        {strip === 'doses' ? (
          d.doses === null ? null : d.doses === 0 ? (
            <View style={[styles.zero, { backgroundColor: withAlpha(c.accent, 0.35) }]} />
          ) : (
            <View
              style={[
                styles.bar,
                { height: Math.max(3, (d.doses / maxDoses) * HEIGHT), backgroundColor: c.accent },
              ]}
            />
          )
        ) : (
          d.urges > 0 && (
            <View style={styles.stack}>
              {d.urges > d.passed && (
                <View
                  style={[
                    styles.bar,
                    {
                      height: ((d.urges - d.passed) / maxUrges) * URGE_HEIGHT,
                      backgroundColor: withAlpha(c.accent, 0.35),
                    },
                  ]}
                />
              )}
              {d.passed > 0 && (
                <View
                  style={[
                    styles.bar,
                    { height: (d.passed / maxUrges) * URGE_HEIGHT, backgroundColor: c.accent },
                  ]}
                />
              )}
            </View>
          )
        )}
      </Pressable>
    ));

  return (
    <View style={styles.root}>
      <Text style={styles.label}>{t.dosesStrip}</Text>
      <View style={[styles.strip, { height: HEIGHT }]}>{columns('doses')}</View>
      {anyUrge && (
        <>
          <View style={styles.legend}>
            <Text style={styles.label}>{t.urgesStrip}</Text>
            <Swatch color={c.accent} label={t.passedSeries} />
            <Swatch color={withAlpha(c.accent, 0.35)} label={t.notPassedSeries} />
          </View>
          <View style={[styles.strip, { height: URGE_HEIGHT }]}>{columns('urges')}</View>
        </>
      )}
      <View style={styles.axis}>
        <Text style={styles.axisText}>{dayAndMonth(days[0].date, locale)}</Text>
        <Text style={styles.axisText}>{dayAndMonth(days[days.length - 1].date, locale)}</Text>
      </View>
      <Text style={styles.detail}>{picked ? detail(picked) : t.tapDay}</Text>
    </View>
  );
}

function Swatch({ color, label }: { color: string; label: string }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.swatchRow}>
      <View style={[styles.swatch, { backgroundColor: color }]} />
      <Text style={styles.axisText}>{label}</Text>
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { gap: spacing(1) },
    label: { color: c.muted, fontSize: 12, fontWeight: '600' },
    legend: { flexDirection: 'row', alignItems: 'center', gap: spacing(3), marginTop: spacing(2) },
    swatchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(1) },
    swatch: { width: 10, height: 10, borderRadius: 3 },
    strip: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 1,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    column: { flex: 1, height: '100%', justifyContent: 'flex-end', alignItems: 'center' },
    selected: { backgroundColor: withAlpha(c.accent, 0.12), borderRadius: 2 },
    stack: { width: '100%', alignItems: 'center', gap: 1 },
    bar: { width: '80%', borderTopLeftRadius: 2, borderTopRightRadius: 2 },
    zero: { width: 3, height: 3, borderRadius: 2, marginBottom: 1 },
    axis: { flexDirection: 'row', justifyContent: 'space-between' },
    axisText: { color: c.muted, fontSize: 11 },
    detail: { color: c.muted, fontSize: 13, textAlign: 'center', fontVariant: ['tabular-nums'] },
  });
