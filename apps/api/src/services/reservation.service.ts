import { prisma } from '../prisma';

export interface OpeningHourDay {
  open: string;
  close: string;
  closed: boolean;
}

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

  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = daysOfWeek[reservationDate.getDay()];
  const openingHours = settings.openingHours as unknown as Record<string, OpeningHourDay>;
  const daySchedule = openingHours?.[dayName];

  if (!daySchedule || daySchedule.closed) {
    return { valid: false, message: `The restaurant is closed on ${dayName.charAt(0).toUpperCase() + dayName.slice(1)}s.` };
  }

  // Parse open and close times (HH:MM format)
  const [openHour, openMin] = daySchedule.open.split(':').map(Number);
  const [closeHour, closeMin] = daySchedule.close.split(':').map(Number);

  const resHour = reservationDate.getHours();
  const resMin = reservationDate.getMinutes();
  const resTimeMinutes = resHour * 60 + resMin;
  const openTimeMinutes = openHour * 60 + openMin;
  const closeTimeMinutes = closeHour * 60 + closeMin;

  if (resTimeMinutes < openTimeMinutes || resTimeMinutes > closeTimeMinutes - 60) {
    return {
      valid: false,
      message: `Reservations on ${dayName} are only accepted between ${daySchedule.open} and 1 hour before closing (${daySchedule.close}).`,
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
