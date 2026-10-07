import { StyleSheet, Text } from 'react-native';

import { UrgeForecast } from '@domain/habits/urges';
import { Button } from '@ui/kit/Button';
import { Card } from '@ui/kit/Card';
import { useLocale } from '@ui/foundation/i18n/LocaleContext';
import { MappedFeeling } from '@ui/foundation/i18n/messages.types';
import { Palette, spacing, useThemedStyles } from '@ui/foundation/theme/theme';

const hour = (h: number) => `${String(h % 24).padStart(2, '0')}:00`;

/** A heads-up that urges tend to come at this time of day, with the craving map's line for the usual feeling. */
export function UrgeForecastCard({ forecast, onUrge }: { forecast: UrgeForecast; onUrge: () => void }) {
  const styles = useThemedStyles(makeStyles);
  const { m } = useLocale();
  const { feeling } = forecast;
  const tip = feeling && feeling in m.urge.map ? m.urge.map[feeling as MappedFeeling] : null;
  return (
    <Card>
      <Text style={styles.text}>
        {m.urge.forecast(forecast.count, hour(forecast.fromHour), hour(forecast.toHour))}
      </Text>
      {feeling && (
        <Text style={styles.text}>{m.urge.forecastFeeling(m.urge.feelings[feeling].toLowerCase())}</Text>
      )}
      {tip && <Text style={styles.tip}>{tip}</Text>}
      <Button title={m.urge.forecastAction} variant="secondary" onPress={onUrge} />
    </Card>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    text: { color: c.text, fontSize: 14, lineHeight: 20, marginBottom: spacing(1) },
    tip: { color: c.accent, fontSize: 14, lineHeight: 20, fontStyle: 'italic', marginBottom: spacing(2) },
  });
