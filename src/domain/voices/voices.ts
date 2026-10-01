export const VOICE_IDS = [
  'plain',
  'laoTzu',
  'marcus',
  'seneca',
  'rumi',
  'kabir',
  'patanjali',
  'lorde',
  'capra',
  'jesus',
  'muhammad',
  'buddha',
  'shiva',
] as const;
export type VoiceId = (typeof VOICE_IDS)[number];

export type Quote = { text: string; source?: string };

/** The same quote all day, the next one tomorrow. `offset` lets the user tap through others. */
export function quoteOfTheDay(quotes: Quote[], date: string, offset = 0): Quote | null {
  if (quotes.length === 0) return null;
  // Step through the list one quote a day, so a week of 7+ quotes never repeats.
  const [y, m, d] = date.split('-').map(Number);
  const day = Math.round(Date.UTC(y, m - 1, d) / DAY_MS);
  return quotes[(((day + offset) % quotes.length) + quotes.length) % quotes.length];
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Editor format: one quote per paragraph, with an optional last line "— source". */
export function formatQuotesText(quotes: Quote[]): string {
  return quotes.map((q) => (q.source ? `${q.text}\n— ${q.source}` : q.text)).join('\n\n');
}

export function parseQuotesText(text: string): Quote[] {
  return text
    .split(/\n\s*\n/)
    .map((block) =>
      block
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean),
    )
    .filter((lines) => lines.length > 0)
    .map((lines) => {
      const last = lines[lines.length - 1];
      const sourceMatch = lines.length > 1 ? /^(?:—|–|-{1,2})\s*(.+)$/.exec(last) : null;
      const textLines = sourceMatch ? lines.slice(0, -1) : lines;
      return {
        text: textLines.join(' '),
        ...(sourceMatch ? { source: sourceMatch[1].trim() } : {}),
      };
    });
}
