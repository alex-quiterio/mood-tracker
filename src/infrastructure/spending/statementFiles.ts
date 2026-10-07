import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';

import { StatementImport, parseRevolutCsv } from '@domain/spending/revolut';

/**
 * Lets the user pick a Revolut statement (CSV) and reads its payments. Null when
 * the picker was cancelled; throws a StatementError when the file isn't one.
 */
export async function pickRevolutStatement(): Promise<StatementImport | null> {
  const result = await DocumentPicker.getDocumentAsync({
    // Android labels CSV files inconsistently, so accept any text and let the parser decide.
    type: ['text/csv', 'text/comma-separated-values', 'text/plain', 'application/vnd.ms-excel', '*/*'],
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  return parseRevolutCsv(await new File(result.assets[0].uri).text());
}
