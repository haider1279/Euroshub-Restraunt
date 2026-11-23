/**
 * Display helpers for opening hours. The open/closed decision itself lives in
 * utils/hours.ts (checkRestaurantStatus); this file only formats its output.
 */
import { TimeCheckResult } from './hours';

type Schedule = Record<string, { open: string; close: string; closed?: boolean }> | undefined | null;

const WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "09:00" -> "9:00 AM", "00:00" -> "12:00 AM" */
export const formatClock = (hhmm?: string | null): string => {
  if (!hhmm || !/^\d{1,2}:\d{2}$/.test(hhmm)) return hhmm || '';
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 && h < 24 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
};

export const formatRange = (open: string, close: string) => `${formatClock(open)} – ${formatClock(close)}`;

/** "Closed now · opens at 9:00 AM" (adds the day when it is not today). */
export const closedStatusLine = (status: TimeCheckResult): string | null => {
  if (status.isOpen) return null;
  if (!status.nextOpenTime) return 'Closed now';
  const sameDay = status.nextOpenDay === status.currentDay;
  const day = !sameDay && status.nextOpenDay ? ` on ${cap(status.nextOpenDay)}` : '';
  return `Closed now · opens at ${formatClock(status.nextOpenTime)}${day}`;
};

/** "Open now · until 12:00 AM" */
export const openStatusLine = (status: TimeCheckResult): string | null =>
  status.isOpen ? `Open now${status.closesAt ? ` · until ${formatClock(status.closesAt)}` : ''}` : null;

/**
 * Collapses the weekly schedule into rows. Identical days are grouped:
 * [{ label: 'Every day', value: '9:00 AM – 12:00 AM' }].
 */
export const hoursSummary = (schedule: Schedule): { label: string; value: string }[] => {
  if (!schedule) return [];
  const rows = WEEK.map((day) => {
    const s = schedule[day];
    return { day, value: !s || s.closed ? 'Closed' : formatRange(s.open, s.close) };
  });
  if (rows.every((r) => r.value === rows[0].value)) {
    return [{ label: 'Every day', value: rows[0].value }];
  }
  const grouped: { label: string; value: string }[] = [];
  let start = 0;
  for (let i = 1; i <= rows.length; i++) {
    if (i === rows.length || rows[i].value !== rows[start].value) {
      const first = cap(rows[start].day).slice(0, 3);
      const last = cap(rows[i - 1].day).slice(0, 3);
      grouped.push({ label: start === i - 1 ? first : `${first} – ${last}`, value: rows[start].value });
      start = i;
    }
  }
  return grouped;
};
