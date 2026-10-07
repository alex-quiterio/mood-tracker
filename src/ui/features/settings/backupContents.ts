import { BackupContents } from '@domain/checkins/exportFormat';
import { Settings, settingsForBackup } from '@domain/settings/settings';

import { EntriesStore } from '@ui/state/useEntries';

/** Everything a backup holds, from the app's state; settings only when the user keeps them in backups. */
export const backupContents = (store: EntriesStore, settings: Settings): BackupContents => ({
  entries: store.entries,
  habits: settings.habits,
  urges: store.urges,
  payments: store.payments,
  settings: settingsForBackup(settings),
});
