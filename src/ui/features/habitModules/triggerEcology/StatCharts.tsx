import { StyleSheet, View } from 'react-native';

import type {
  Comparison,
  Correlation,
  Interval,
  Rate,
  RateComparison,
  Sample,
} from '@domain/shared/statistics';
import { formatDecimal, formatInteger } from '@ui/foundation/i18n/format';
import { useLocale } from '@ui/foundation/i18n/LocaleContext';
import { Palette, radius, spacing, useThemedStyles, withAlpha } from '@ui/foundation/theme/theme';
import { IntervalChart, type IntervalRow } from '@ui/kit/IntervalChart';
import { ScatterPlot } from '@ui/kit/ScatterPlot';
import { Text } from '@ui/kit/Text';

/** Numbers as the statistical cards show them: percentages, signed differences, interval rows. */
export function useStatFormat() {
  const { m, locale } = useLocale();
  const t = m.triggerEcology;
  const sign = (x: number) => (x > 0 ? '+' : x < 0 ? '−' : '');
  const pct = (x: number) => Math.round(x * 100);
  const signed = (x: number, digits: number) => `${sign(x)}${formatDecimal(Math.abs(x), digits, locale)}`;
  const signedPct = (x: number) => `${sign(x)}${Math.abs(pct(x))}%`;
  const range = (d: Interval | null, format: (x: number) => string) =>
    d ? t.difference(format(d.estimate), format(d.low), format(d.high)) : '';
  return {
    pct,
    signed,
    rateRow: (key: string, label: string, rate: Rate): IntervalRow => ({
      key,
      label,
      estimate: rate.interval?.estimate ?? null,
      low: rate.interval?.low,
      high: rate.interval?.high,
      text: rate.interval ? t.rateText(pct(rate.interval.estimate), rate.hits, rate.n) : '–',
    }),
    sampleRow: (key: string, label: string, s: Sample): IntervalRow => ({
      key,
      label,
      estimate: s.mean,
      low: s.interval?.low,
      high: s.interval?.high,
      text: s.mean === null ? '–' : t.meanText(formatDecimal(s.mean, 1, locale), s.n),
    }),
    meanDifference: (c: Comparison) => range(c.difference, (x) => signed(x, 1)),
    rateDifference: (c: RateComparison) => range(c.difference, signedPct),
  };
}

/** Two means with their intervals on one scale, then the verdict on their difference. */
export function ComparisonChart({
  comparison,
  labels,
  domain,
}: {
  comparison: Comparison;
  labels: [string, string];
  /** A fixed scale (e.g. moods 1–5), or null to fit the intervals from zero. */
  domain: [number, number] | null;
}) {
  const { m } = useLocale();
  const f = useStatFormat();
  const highs = [comparison.a, comparison.b].map((s) => s.interval?.high ?? s.mean ?? 0);
  return (
    <>
      <IntervalChart
        rows={[f.sampleRow('a', labels[0], comparison.a), f.sampleRow('b', labels[1], comparison.b)]}
        domain={domain ?? [0, Math.max(1, ...highs)]}
      />
      <Verdict
        evidence={m.triggerEcology.evidence[comparison.evidence]}
        detail={comparison.evidence === 'tooFew' ? '' : f.meanDifference(comparison)}
        strong={comparison.evidence === 'clear'}
      />
    </>
  );
}

/** Two rates with their intervals on 0–100%, then the verdict on their difference. */
export function RateComparisonChart({
  comparison,
  labels,
}: {
  comparison: RateComparison;
  labels: [string, string];
}) {
  const { m } = useLocale();
  const f = useStatFormat();
  return (
    <>
      <IntervalChart
        rows={[f.rateRow('a', labels[0], comparison.a), f.rateRow('b', labels[1], comparison.b)]}
        domain={[0, 1]}
      />
      <Verdict
        evidence={m.triggerEcology.evidence[comparison.evidence]}
        detail={comparison.evidence === 'tooFew' ? '' : f.rateDifference(comparison)}
        strong={comparison.evidence === 'clear'}
      />
    </>
  );
}

/** A scatter of days with its ρ, interval and verdict underneath. */
export function LinkPlot({
  name,
  correlation,
  formatX,
}: {
  name: string;
  correlation: Correlation;
  formatX: (x: number) => string;
}) {
  const styles = useThemedStyles(makeStyles);
  const { m, locale } = useLocale();
  const t = m.triggerEcology;
  const f = useStatFormat();
  const rho = correlation.rho;
  const verdict = t.linkEvidence[correlation.evidence];
  return (
    <View style={styles.group}>
      <Text style={styles.subheading}>{name}</Text>
      <ScatterPlot
        points={correlation.points}
        xLabel={name}
        yLabel={t.dosesAxis}
        formatX={formatX}
        formatY={(y) => formatInteger(Math.round(y), locale)}
        accessibilityLabel={t.scatterA11y(
          name,
          correlation.n,
          rho ? f.signed(rho.estimate, 2) : '–',
          verdict,
        )}
      />
      <Verdict
        evidence={verdict}
        detail={
          rho
            ? t.rho(f.signed(rho.estimate, 2), f.signed(rho.low, 2), f.signed(rho.high, 2), correlation.n)
            : ''
        }
        strong={correlation.evidence === 'clear'}
      />
    </View>
  );
}

/** A verdict pill (in words, never colour alone) with the numbers behind it. */
export function Verdict({ evidence, detail, strong }: { evidence: string; detail: string; strong: boolean }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View
      style={styles.verdict}
      accessible
      accessibilityLabel={[evidence, detail].filter(Boolean).join('. ')}
    >
      <View style={[styles.pill, strong && styles.pillStrong]}>
        <Text style={[styles.pillText, strong && styles.pillTextStrong]}>{evidence}</Text>
      </View>
      {detail !== '' && <Text style={styles.muted}>{detail}</Text>}
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    group: { gap: spacing(2) },
    subheading: { color: c.text, fontSize: 14, fontWeight: '700' },
    muted: { color: c.muted, fontSize: 13, lineHeight: 18 },
    verdict: { gap: spacing(1), alignItems: 'flex-start' },
    pill: {
      borderRadius: radius.pill,
      paddingHorizontal: spacing(2),
      paddingVertical: 3,
      borderWidth: 1,
      borderColor: c.border,
    },
    pillStrong: { borderColor: c.accent, backgroundColor: withAlpha(c.accent, 0.12) },
    pillText: { color: c.muted, fontSize: 12, fontWeight: '600' },
    pillTextStrong: { color: c.text },
  });
