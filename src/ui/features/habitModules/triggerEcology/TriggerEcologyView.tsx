import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { SLOTS } from '@domain/checkins/types';
import {
  ANALYSIS_DAYS,
  type TriggerEcologyReport,
  keyFindings,
  triggerEcology,
} from '@domain/habitModules/triggerEcology/analysis';
import { parseTriggerEcologyState } from '@domain/habitModules/triggerEcology/experiments';
import { TRIGGER_GROUPS, type TriggerKey } from '@domain/habitModules/triggerEcology/triggers';
import { formatDecimal, formatInteger } from '@ui/foundation/i18n/format';
import { describeFinding, triggerLabel, weekdayFromMonday } from '@ui/foundation/i18n/habitModules';
import { useLocale } from '@ui/foundation/i18n/LocaleContext';
import { Palette, spacing, typeScale, useThemedStyles } from '@ui/foundation/theme/theme';
import { BarChart } from '@ui/kit/BarChart';
import { Card } from '@ui/kit/Card';
import { Heatmap } from '@ui/kit/Heatmap';
import { IntervalChart } from '@ui/kit/IntervalChart';
import { Segmented } from '@ui/kit/Segmented';
import { Text } from '@ui/kit/Text';
import type { ModuleViewProps } from '@ui/features/habitModules/registry';

import { DailyStrip } from './DailyStrip';
import { ExperimentCard } from './ExperimentCard';
import { ComparisonChart, LinkPlot, useStatFormat } from './StatCharts';

const SECTIONS = ['overview', 'triggers', 'when', 'effects', 'experiment'] as const;
type Section = (typeof SECTIONS)[number];

/**
 * Trigger ecology in five sections, one at a time, so no screen holds everything:
 * an overview of what clearly stands out and the days themselves, then triggers,
 * timing, effects and an experiment. Every rate and average is drawn with its 95%
 * interval and sample size, and every comparison ends in a plain verdict.
 */
export function TriggerEcologyView({ input, state, onStateChange }: ModuleViewProps) {
  const { m } = useLocale();
  const [section, setSection] = useState<Section>('overview');
  const report = triggerEcology(input);
  const known = TRIGGER_GROUPS.flatMap((g) => report.triggers[g].map((s) => s.key));

  return (
    <View style={{ gap: spacing(3) }}>
      <Segmented
        segments={SECTIONS.map((key) => ({ key, label: m.triggerEcology.sections[key] }))}
        selected={section}
        onSelect={setSection}
      />
      {section === 'overview' && <Overview report={report} onSection={setSection} />}
      {section === 'triggers' && <Triggers report={report} />}
      {section === 'when' && <When report={report} />}
      {section === 'effects' && <Effects report={report} />}
      {section === 'experiment' && (
        <ExperimentCard
          input={input}
          state={parseTriggerEcologyState(state)}
          triggers={known}
          onStateChange={onStateChange}
        />
      )}
    </View>
  );
}

/** What clearly stands out, in sentences, then the days themselves. */
function Overview({ report, onSection }: { report: TriggerEcologyReport; onSection: (s: Section) => void }) {
  const styles = useThemedStyles(makeStyles);
  const { m, locale } = useLocale();
  const t = m.triggerEcology;
  const [howTo, setHowTo] = useState(false);
  const findings = keyFindings(report);
  const f = useStatFormat();
  const overall = report.overall.interval;
  return (
    <>
      <Card>
        <Text style={styles.heading}>{t.findingsTitle}</Text>
        {overall && <Text style={styles.text}>{t.allUrges(f.pct(overall.estimate))}</Text>}
        {findings.length === 0 ? (
          <Text style={styles.muted}>{t.noFindings}</Text>
        ) : (
          findings.map((finding, i) => (
            <Pressable
              key={i}
              accessibilityRole="button"
              onPress={() => onSection(finding.kind === 'trigger' ? 'triggers' : 'effects')}
              style={styles.finding}
            >
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.text, styles.flex]}>{describeFinding(finding, locale)}</Text>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: howTo }}
          onPress={() => setHowTo((v) => !v)}
          hitSlop={6}
        >
          <Text style={styles.link}>{t.howToggle}</Text>
        </Pressable>
        {howTo && <Text style={styles.muted}>{t.howToRead}</Text>}
      </Card>
      <Card>
        <Text style={styles.heading}>{t.dailyTitle}</Text>
        <Text style={styles.muted}>{t.window(ANALYSIS_DAYS / 7)}</Text>
        <DailyStrip days={report.daily} />
      </Card>
    </>
  );
}

/** How often urges passed with each trigger, against all urges; then paused vs automatic. */
function Triggers({ report }: { report: TriggerEcologyReport }) {
  const styles = useThemedStyles(makeStyles);
  const { m, locale } = useLocale();
  const t = m.triggerEcology;
  const f = useStatFormat();
  const label = (k: TriggerKey) => triggerLabel(k, locale);
  const groups = TRIGGER_GROUPS.filter((g) => report.triggers[g].length > 0);
  const reference = report.overall.interval
    ? { value: report.overall.interval.estimate, label: t.allUrges(f.pct(report.overall.interval.estimate)) }
    : undefined;
  const { pauses } = report;
  return (
    <>
      <Card>
        <Text style={styles.heading}>{t.passRateTitle}</Text>
        {groups.length === 0 ? (
          <Text style={styles.muted}>{t.noTriggers}</Text>
        ) : (
          <>
            <Text style={styles.muted}>{t.passRateHint}</Text>
            {groups.map((g, i) => (
              <View key={g} style={styles.group}>
                <Text style={styles.subheading}>{t.groups[g]}</Text>
                <IntervalChart
                  rows={report.triggers[g].map((s) => f.rateRow(s.key, label(s.key), s.passed))}
                  domain={[0, 1]}
                  reference={i === groups.length - 1 ? reference : undefined}
                />
              </View>
            ))}
            {report.combinations.length > 0 && (
              <View style={styles.group}>
                <Text style={styles.subheading}>{t.combinationsTitle}</Text>
                <IntervalChart
                  rows={report.combinations.map((c) =>
                    f.rateRow(`${c.a}+${c.b}`, `${label(c.a)} + ${label(c.b)}`, c.passed),
                  )}
                  domain={[0, 1]}
                  reference={reference}
                />
              </View>
            )}
          </>
        )}
      </Card>
      {pauses && (
        <Card>
          <Text style={styles.heading}>{t.pausesTitle}</Text>
          <BarChart
            rows={[
              { key: 'passed', label: t.passedSeries, value: pauses.passed, text: String(pauses.passed) },
              {
                key: 'after',
                label: t.afterPauseRow,
                value: pauses.afterPause,
                text: String(pauses.afterPause),
              },
              { key: 'none', label: t.noPauseRow, value: pauses.noPause, text: String(pauses.noPause) },
            ]}
          />
          <Text style={styles.muted}>{t.pausesHint}</Text>
        </Card>
      )}
    </>
  );
}

/** When doses happen: weekday by part of the day. */
function When({ report }: { report: TriggerEcologyReport }) {
  const styles = useThemedStyles(makeStyles);
  const { m, locale } = useLocale();
  const t = m.triggerEcology;
  const rhythm = report.rhythm;
  if (!rhythm || rhythm.busiestSlot === null)
    return (
      <Card>
        <Text style={styles.muted}>{t.noFindings}</Text>
      </Card>
    );
  return (
    <Card>
      <Text style={styles.heading}>{t.heatmapTitle}</Text>
      {rhythm.busiestWeekday !== null && (
        <Text style={styles.text}>{t.busiestDay(weekdayFromMonday(rhythm.busiestWeekday, locale))}</Text>
      )}
      <Text style={styles.text}>{t.busiestSlot(m.slots[rhythm.busiestSlot])}</Text>
      <Heatmap
        rowLabels={rhythm.grid.map((_, w) => weekdayFromMonday(w, locale).slice(0, 3))}
        columnLabels={SLOTS.map((s) => m.slots[s])}
        cells={rhythm.grid.map((row) => row.map((c) => ({ value: c.mean, n: c.n })))}
        format={(v) => formatDecimal(v, 1, locale)}
        describe={(w, s) => {
          const cell = rhythm.grid[w][s];
          const day = weekdayFromMonday(w, locale);
          const slot = m.slots[SLOTS[s]];
          return cell.mean === null
            ? t.heatmapEmpty(day, slot)
            : t.heatmapCell(day, slot, formatDecimal(cell.mean, 1, locale), cell.n);
        }}
        hint={t.heatmapHint}
      />
    </Card>
  );
}

/** What goes with doses: urge days, what follows, and what moves with them day by day. */
function Effects({ report }: { report: TriggerEcologyReport }) {
  const styles = useThemedStyles(makeStyles);
  const { m, locale } = useLocale();
  const t = m.triggerEcology;
  const after = report.after;
  const afterRows = after
    ? (
        [
          ['mood', t.moodRow, after.mood, [1, 5]],
          ['next', t.nextMoodRow, after.nextMood, [1, 5]],
          ['sleep', t.sleepRow, after.sleep, null],
        ] as const
      ).filter(([, , c]) => c.a.n > 0 && c.b.n > 0)
    : [];
  const links = (
    [
      ['sleep', t.sleepLink, (x: number) => formatDecimal(x, 1, locale)],
      ['steps', t.stepsLink, (x: number) => formatInteger(Math.round(x), locale)],
      ['mood', t.moodLink, (x: number) => formatDecimal(x, 1, locale)],
    ] as const
  ).filter(([key]) => report.links[key].n >= 3);
  const urgeDays = report.urgeDays.a.n > 0 && report.urgeDays.b.n > 0;

  if (!urgeDays && afterRows.length === 0 && links.length === 0)
    return (
      <Card>
        <Text style={styles.muted}>{t.noFindings}</Text>
      </Card>
    );
  return (
    <>
      {(urgeDays || afterRows.length > 0) && (
        <Card>
          <Text style={styles.heading}>{t.afterTitle}</Text>
          {urgeDays && (
            <View style={styles.group}>
              <Text style={styles.subheading}>{t.dosesRow}</Text>
              <ComparisonChart
                comparison={report.urgeDays}
                labels={[t.urgeDayRow, t.otherDayRow]}
                domain={null}
              />
            </View>
          )}
          {afterRows.map(([key, rowLabel, comparison, domain]) => (
            <View key={key} style={styles.group}>
              <Text style={styles.subheading}>{rowLabel}</Text>
              <ComparisonChart
                comparison={comparison}
                labels={[t.someSeries, t.noneSeries]}
                domain={domain ? [domain[0], domain[1]] : null}
              />
            </View>
          ))}
        </Card>
      )}
      {links.length > 0 && (
        <Card>
          <Text style={styles.heading}>{t.linksTitle}</Text>
          <Text style={styles.muted}>{t.linksHint}</Text>
          {links.map(([key, name, formatX]) => (
            <LinkPlot key={key} name={name} correlation={report.links[key]} formatX={formatX} />
          ))}
        </Card>
      )}
    </>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    flex: { flex: 1 },
    group: { gap: spacing(2) },
    heading: { ...typeScale.heading, color: c.text, ...c.heading },
    subheading: { color: c.text, fontSize: 14, fontWeight: '700' },
    text: { color: c.text, fontSize: 14, lineHeight: 20 },
    muted: { color: c.muted, fontSize: 13, lineHeight: 18 },
    link: { color: c.accent, fontSize: 13, fontWeight: '600' },
    finding: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing(2) },
    bullet: { color: c.accent, fontSize: 14, lineHeight: 20 },
    chevron: { color: c.muted, fontSize: 16, lineHeight: 20 },
  });
