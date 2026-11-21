import { StyleSheet } from 'react-native';

import { Button } from '@ui/kit/Button';
import { Card } from '@ui/kit/Card';
import { Text } from '@ui/kit/Text';
import { useLocale } from '@ui/foundation/i18n/LocaleContext';
import { Palette, useThemedStyles } from '@ui/foundation/theme/theme';

type Props = { onFix: () => void };

/** A gentle note that automatic backups haven't worked for a few days, with a way to fix it. */
export function BackupNotice({ onFix }: Props) {
  const styles = useThemedStyles(makeStyles);
  const { m } = useLocale();
  return (
    <Card>
      <Text style={styles.body}>{m.backupSettings.noticeBody}</Text>
      <Button title={m.backupSettings.noticeAction} variant="secondary" onPress={onFix} />
    </Card>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    body: { color: c.muted, lineHeight: 20 },
  });
