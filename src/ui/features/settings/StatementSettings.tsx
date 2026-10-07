import { Alert, StyleSheet } from 'react-native';

import { statementSpan } from '@domain/spending/payments';
import { StatementError } from '@domain/spending/revolut';
import { pickRevolutStatement } from '@infrastructure/spending/statementFiles';
import { fullDate } from '@ui/foundation/i18n/format';
import { useLocale } from '@ui/foundation/i18n/LocaleContext';
import { Palette, typeScale, useThemedStyles } from '@ui/foundation/theme/theme';
import { Button } from '@ui/kit/Button';
import { Card } from '@ui/kit/Card';
import { Text } from '@ui/kit/Text';
import { EntriesStore } from '@ui/state/useEntries';

/** Importing a Revolut statement, so check-ins can show what was really spent. */
export function StatementSettings({ store }: { store: EntriesStore }) {
  const styles = useThemedStyles(makeStyles);
  const { m, locale } = useLocale();
  const span = statementSpan(store.payments);

  const doImport = async () => {
    try {
      const statement = await pickRevolutStatement();
      if (!statement) return;
      const added = await store.importPayments(statement.payments);
      Alert.alert(m.statement.importedTitle, m.statement.importedBody(added, statement.skipped));
    } catch (e) {
      Alert.alert(
        m.statement.failed,
        e instanceof StatementError ? m.statement[e.code] : e instanceof Error ? e.message : String(e),
      );
    }
  };

  const confirmRemove = () =>
    Alert.alert(m.statement.removeTitle, m.statement.removeBody, [
      { text: m.common.cancel, style: 'cancel' },
      {
        text: m.statement.remove,
        style: 'destructive',
        onPress: () => store.clearPayments().catch(() => {}),
      },
    ]);

  return (
    <Card>
      <Text style={styles.title}>{m.statement.title}</Text>
      <Text style={styles.hint}>{m.statement.hint}</Text>
      {span && (
        <Text style={styles.covered}>
          {m.statement.covered(store.payments.length, fullDate(span.from, locale), fullDate(span.to, locale))}
        </Text>
      )}
      <Button title={m.statement.importButton} onPress={doImport} />
      {span && <Button title={m.statement.removeButton} variant="secondary" onPress={confirmRemove} />}
    </Card>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    title: { ...typeScale.heading, color: c.text, ...c.heading },
    hint: { color: c.muted, fontSize: 13, lineHeight: 18 },
    covered: { color: c.text, fontSize: 14 },
  });
