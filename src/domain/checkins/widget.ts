import { Entry, Mood, SLOTS, Slot } from './types';

/** Where a tap on the home-screen widget leads: a check-in for one of today's slots, a pause, or the week. */
export type WidgetTarget = { kind: 'checkin'; slot: Slot } | { kind: 'pause' } | { kind: 'stats' };

const LINK_PREFIX = 'moodtracker://widget/';

/** The link the widget opens the app with. */
export const widgetLink = (target: WidgetTarget): string =>
  target.kind === 'checkin' ? `${LINK_PREFIX}checkin/${target.slot}` : `${LINK_PREFIX}${target.kind}`;

/** The target behind a link the app was opened with, or null for any other link. */
export function parseWidgetLink(url: string | null | undefined): WidgetTarget | null {
  if (!url?.startsWith(LINK_PREFIX)) return null;
  const [kind, slot] = url.slice(LINK_PREFIX.length).split('/');
  if (kind === 'pause' || kind === 'stats') return { kind };
  if (kind === 'checkin' && SLOTS.includes(slot as Slot)) return { kind: 'checkin', slot: slot as Slot };
  return null;
}

/** The mood of each of the day's check-ins, or null where there isn't one yet. */
export function moodsOn(entries: Entry[], date: string): Record<Slot, Mood | null> {
  const moodOf = (slot: Slot) => entries.find((e) => e.date === date && e.slot === slot)?.mood ?? null;
  return { morning: moodOf('morning'), afternoon: moodOf('afternoon'), evening: moodOf('evening') };
}
