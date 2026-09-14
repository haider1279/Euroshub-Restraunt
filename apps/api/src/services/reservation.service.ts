import { prisma } from '../prisma';

export interface OpeningHourDay {
  open: string;
  close: string;
  closed: boolean;
}

/**
 * Extracts the calendar day name, hour, and minute for a date in a specified timezone.
 * Defaults to 'Asia/Karachi' (Pakistan Standard Time, UTC+5).
 */
export const getZonedTimeParts = (date: Date, timeZone: string = 'Asia/Karachi') => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'long',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const partMap: Record<string, string> = {};
  for (const part of parts) {
    partMap[part.type] = part.value;
  }

  let hour = parseInt(partMap.hour, 10);
  if (hour === 24) hour = 0;
  const minute = parseInt(partMap.minute, 10);
  const dayName = (partMap.weekday || '').toLowerCase(); // 'sunday', 'monday', etc.

  return {
    dayName,
    hour,
    minute,
    year: parseInt(partMap.year, 10),
    month: parseInt(partMap.month, 10),
    day: parseInt(partMap.day, 10),
  };
};

export const validateReservationTimeAndCapacity = async (reservationDate: Date, partySize: number) => {
  const now = new Date();
  if (reservationDate.getTime() < now.getTime()) {
    return { valid: false, message: 'Reservation date and time cannot be in the past.' };
  }

  // Fetch restaurant settings
  const settings = await prisma.restaurantSettings.findUnique({
    where: { id: 'singleton' },
  });

  if (!settings) {
    return { valid: false, message: 'Restaurant settings are not configured.' };
  }

  const timeZone = settings.timezone || 'Asia/Karachi';
  const { dayName, hour, minute } = getZonedTimeParts(reservationDate, timeZone);

  const openingHours = settings.openingHours as unknown as Record<string, OpeningHourDay>;
  const daySchedule = openingHours?.[dayName];

  const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);

  if (!daySchedule || daySchedule.closed) {
    return { valid: false, message: `The restaurant is closed on ${capitalizedDay}s.` };
  }

  // Parse open and close times (HH:MM format)
  const [openHour, openMin] = daySchedule.open.split(':').map(Number);
  const [closeHour, closeMin] = daySchedule.close.split(':').map(Number);

  const openTimeMinutes = openHour * 60 + openMin;
  let closeTimeMinutes = closeHour * 60 + closeMin;

  // Handle midnight closing (e.g. "00:00" represents 24:00 at the end of the operating day)
  // or overnight schedules where close time is numerically <= open time
  if (closeTimeMinutes <= openTimeMinutes) {
    closeTimeMinutes += 24 * 60; // 00:00 becomes 1440 (24:00)
  }

  // Cutoff is 1 hour before closing
  const cutoffTimeMinutes = closeTimeMinutes - 60;
  const resTimeMinutes = hour * 60 + minute;

  if (resTimeMinutes < openTimeMinutes || resTimeMinutes > cutoffTimeMinutes) {
    const cutoffHour = Math.floor(cutoffTimeMinutes / 60) % 24;
    const cutoffMin = cutoffTimeMinutes % 60;
    const cutoffStr = `${String(cutoffHour).padStart(2, '0')}:${String(cutoffMin).padStart(2, '0')}`;

    return {
      valid: false,
      message: `Reservations on ${capitalizedDay} are only accepted between ${daySchedule.open} and ${cutoffStr} (1 hour before closing).`,
    };
  }

  // Capacity check: Average table size is 4 covers. Total capacity = tableCount * 4
  const maxCovers = settings.tableCount * 4;
  const windowStart = new Date(reservationDate.getTime() - 90 * 60 * 1000); // 1.5 hrs before
  const windowEnd = new Date(reservationDate.getTime() + 90 * 60 * 1000);   // 1.5 hrs after

  const existingReservations = await prisma.reservation.findMany({
    where: {
      status: { in: ['PENDING', 'CONFIRMED'] },
      date: {
        gte: windowStart,
        lte: windowEnd,
      },
    },
    select: { partySize: true },
  });

  const bookedCovers = existingReservations.reduce((sum: number, r: { partySize: number }) => sum + r.partySize, 0);

  if (bookedCovers + partySize > maxCovers) {
    return {
      valid: false,
      message: `We are fully booked for this time slot (requested ${partySize} guests, but only ${Math.max(0, maxCovers - bookedCovers)} seats available). Please choose another time.`,
    };
  }

  return { valid: true };
};
