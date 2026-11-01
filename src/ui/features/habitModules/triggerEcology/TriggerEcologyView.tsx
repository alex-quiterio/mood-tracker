import { StyleSheet, View } from 'react-native';

import { ANALYSIS_DAYS, triggerEcology } from '@domain/habitModules/triggerEcology/analysis';
import { parseTriggerEcologyState } from '@domain/habitModules/triggerEcology/experiments';
import { TRIGGER_GROUPS, type TriggerKey } from '@domain/habitModules/triggerEcology/triggers';
import { formatAverage, formatDecimal, formatHours } from '@ui/foundation/i18n/format';
import { useLocale } from '@ui/foundation/i18n/LocaleContext';
import { triggerLabel, weekdayFromMonday } from '@ui/foundation/i18n/habitModules';
import { Palette, spacing, typeScale, useThemedStyles } from '@ui/foundation/theme/theme';
import { Card } from '@ui/kit/Card';
import { Text } from '@ui/kit/Text';
import type { ModuleViewProps } from '@ui/features/habitModules/registry';

import { ExperimentCard } from './ExperimentCard';

const both = (a: number | null, b: number | null): [number, number] | null =>
  a !== null && b !== null ? [a, b] : null;

/** Trigger ecology: each part of the analysis on its own card, shown only when it has something to say. */
export function TriggerEcologyView({ input, state, onStateChange }: ModuleViewProps) {
  const styles = useThemedStyles(makeStyles);
  const { m, locale } = useLocale();
  const t = m.triggerEcology;
  const report = triggerEcology(input);
  const label = (k: TriggerKey) => triggerLabel(k, locale);
  const anyTrigger = TRIGGER_GROUPS.some((g) => report.triggers[g].length > 0);
  const known = TRIGGER_GROUPS.flatMap((g) => report.triggers[g].map((s) => s.key));
  const { urgesAndDoses: ud, pauses, rhythm, beforeAfter: ba } = report;
  const urgeDays = ud && both(ud.onUrgeDays, ud.onOtherDays);
  const mood = ba && both(ba.moodWithSome, ba.moodWithNone);
  const next = ba && both(ba.nextMoodAfterSome, ba.nextMoodAfterNone);
  const sleep = ba && both(ba.sleepAfterSome, ba.sleepAfterNone);

  return (
    <View style={styles.root}>
      <Text style={styles.window}>{t.window(ANALYSIS_DAYS / 7)}</Text>

      <Card>
        {anyTrigger ? (
          TRIGGER_GROUPS.filter((g) => report.triggers[g].length > 0).map((g) => (
            <View key={g} style={styles.group}>
              <Text style={styles.heading}>{t.groups[g]}</Text>
              {report.triggers[g].map((s) => (
                <View key={s.key} style={styles.row}>
                  <Text style={styles.text}>{label(s.key)}</Text>
                  <Text style={styles.muted}>{t.triggerLine(s.urges, s.passed)}</Text>
                </View>
              ))}
            </View>
          ))
        ) : (
          <Text style={styles.muted}>{t.noTriggers}</Text>
        )}
      </Card>

      {report.combinations.length > 0 && (
        <Card>
          <Text style={styles.heading}>{t.combinationsTitle}</Text>
          {report.combinations.map((c) => (
            <Text key={`${c.a}+${c.b}`} style={styles.text}>
              {t.combination(label(c.a), label(c.b), c.urges, c.passed)}
            </Text>
          ))}
        </Card>
      )}

      {(ud || pauses) && (
        <Card>
          {ud && (
            <>
              <Text style={styles.heading}>{t.urgesTitle}</Text>
              {ud.urges > 0 && <Text style={styles.text}>{t.urgesLine(ud.urges, ud.passed)}</Text>}
              {urgeDays && (
                <Text style={styles.text}>
                  {t.urgeDays(formatDecimal(urgeDays[0], 1, locale), formatDecimal(urgeDays[1], 1, locale))}
                </Text>
              )}
            </>
          )}
          {pauses && (
            <>
              <Text style={styles.heading}>{t.pausesTitle}</Text>
              {pauses.passed > 0 && <Text style={styles.win}>{t.passedLine(pauses.passed)}</Text>}
              <Text style={styles.text}>{t.pausesLine(pauses.afterPause, pauses.noPause)}</Text>
              <Text style={styles.muted}>{t.pausesHint}</Text>
            </>
          )}
        </Card>
      )}

      {rhythm && (rhythm.busiestWeekday !== null || rhythm.busiestSlot !== null) && (
        <Card>
          <Text style={styles.heading}>{t.rhythmTitle}</Text>
          {rhythm.busiestWeekday !== null && (
            <Text style={styles.text}>{t.busiestDay(weekdayFromMonday(rhythm.busiestWeekday, locale))}</Text>
          )}
          {rhythm.busiestSlot !== null && (
            <Text style={styles.text}>{t.busiestSlot(m.slots[rhythm.busiestSlot])}</Text>
          )}
          {Object.values(rhythm.urgesBySlot).some((n) => n > 0) && (
            <Text style={styles.text}>
              {t.urgesMostIn(
                m.slots[
                  (Object.entries(rhythm.urgesBySlot) as [keyof typeof m.slots, number][]).sort(
                    (a, b) => b[1] - a[1],
                  )[0][0]
                ],
              )}
            </Text>
          )}
        </Card>
      )}

      {(mood || next || sleep) && (
        <Card>
          <Text style={styles.heading}>{t.afterTitle}</Text>
          {mood && (
            <Text style={styles.text}>
              {t.moodWith(formatAverage(mood[0], locale), formatAverage(mood[1], locale))}
            </Text>
          )}
          {next && (
            <Text style={styles.text}>
              {t.nextMood(formatAverage(next[0], locale), formatAverage(next[1], locale))}
            </Text>
          )}
          {sleep && (
            <Text style={styles.text}>
              {t.sleepAfter(
                formatHours(Math.round(sleep[0] * 2) / 2, locale),
                formatHours(Math.round(sleep[1] * 2) / 2, locale),
              )}
            </Text>
          )}
        </Card>
      )}

      <ExperimentCard
        input={input}
        state={parseTriggerEcologyState(state)}
        triggers={known}
        onStateChange={onStateChange}
      />
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { gap: spacing(3) },
    window: { color: c.muted, fontSize: 13 },
    group: { gap: spacing(1) },
    row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing(2) },
    heading: { ...typeScale.heading, color: c.text, ...c.heading },
    text: { color: c.text, fontSize: 14, lineHeight: 20, flexShrink: 1 },
    win: { color: c.accent, fontSize: 14, lineHeight: 20 },
    muted: { color: c.muted, fontSize: 13, lineHeight: 18 },
  });
