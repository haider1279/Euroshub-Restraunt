/**
 * Date and time display helpers. Day-first dates ("23 Nov 2026") and 12-hour
 * times ("2:30 pm"), built from explicit options so every browser agrees.
 */
const toDate = (date: string | Date | number | null | undefined): Date | null => {
  if (!date) return null;
  const d = new Date(date);
  return isNaN(d.getTime()) ? null : d;
};

const DATE: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
const TIME: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true };

export const formatDate = (date: string | Date | number | null | undefined): string => {
  const d = toDate(date);
  return d ? d.toLocaleDateString('en-GB', DATE) : '';
};

export const formatTime = (date: string | Date | number | null | undefined): string => {
  const d = toDate(date);
  return d ? d.toLocaleTimeString('en-GB', TIME) : '';
};

export const formatDateTime = (date: string | Date | number | null | undefined): string => {
  const d = toDate(date);
  return d ? `${formatDate(d)}, ${formatTime(d)}` : '';
};

export const formatLongDateTime = (date: string | Date | number | null | undefined): string => {
  const d = toDate(date);
  if (!d) return '';
  const day = d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return `${day}, ${formatTime(d)}`;
};
