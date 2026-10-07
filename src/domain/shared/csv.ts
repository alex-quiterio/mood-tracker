/**
 * Splits CSV text into rows of cells. Handles quoted cells (with commas, line breaks
 * and doubled quotes inside), CRLF line ends and a leading byte-order mark. Blank
 * lines are dropped.
 */
export function parseCsv(text: string, separator = ','): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  const input = text.replace(/^﻿/, '');
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (quoted) {
      if (ch === '"' && input[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === separator) {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && input[i + 1] === '\n') i++;
      row.push(cell);
      if (row.some((c) => c !== '')) rows.push(row);
      row = [];
      cell = '';
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c !== '')) rows.push(row);
  return rows;
}
