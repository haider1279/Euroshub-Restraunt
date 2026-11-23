export interface DaySchedule {
  open: string;
  close: string;
  closed?: boolean;
}

export interface OperatingHours {
  [day: string]: DaySchedule;
}

export interface TimeCheckResult {
  isOpen: boolean;
  currentDay: string;
  opensAt?: string;
  closesAt?: string;
  nextOpenDay?: string;
  nextOpenTime?: string;
  formattedMessage?: string;
}

const DAYS_ORDER = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/**
 * Returns minute of day (0-1439) and dayName for a date in a given timeZone
 */
export function getZonedTimeInfo(date: Date, timeZone: string = 'Asia/Karachi') {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'long',
    hour12: false,
    hour: 'numeric',
    minute: 'numeric',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });

  const parts = formatter.formatToParts(date);
  let hour = 0;
  let minute = 0;
  let dayName = '';

  for (const part of parts) {
    if (part.type === 'hour') hour = parseInt(part.value, 10);
    if (part.type === 'minute') minute = parseInt(part.value, 10);
    if (part.type === 'weekday') dayName = part.value.toLowerCase();
  }

  if (hour === 24) hour = 0;

  const currentMinutes = hour * 60 + minute;
  return { dayName, hour, minute, currentMinutes };
}

/**
 * Parses "HH:MM" into minutes from start of day.
 * If close is "00:00" or numerically <= open, closeTimeMinutes is treated as rolling into the next day (+1440).
 */
export function parseShift(openStr: string, closeStr: string) {
  const [openH, openM] = openStr.split(':').map(Number);
  const [closeH, closeM] = closeStr.split(':').map(Number);

  const openMinutes = openH * 60 + openM;
  let closeMinutes = closeH * 60 + closeM;

  if (closeMinutes <= openMinutes) {
    closeMinutes += 24 * 60;
  }

  return { openMinutes, closeMinutes };
}

/**
 * Checks whether the restaurant is open at a given date/time according to the schedule and timezone.
 * Handles shifts extending past midnight.
 */
export function checkRestaurantStatus(
  date: Date,
  schedule: OperatingHours = {},
  timeZone: string = 'Asia/Karachi'
): TimeCheckResult {
  const { dayName, currentMinutes } = getZonedTimeInfo(date, timeZone);
  const dayIdx = DAYS_ORDER.indexOf(dayName);

  // 1. Check yesterday's shift if it spilled over midnight into today
  const yesterdayIdx = (dayIdx + 6) % 7;
  const yesterdayName = DAYS_ORDER[yesterdayIdx];
  const yesterdaySchedule = schedule[yesterdayName];

  if (yesterdaySchedule && !yesterdaySchedule.closed) {
    const { openMinutes, closeMinutes } = parseShift(yesterdaySchedule.open, yesterdaySchedule.close);
    if (closeMinutes > 1440) {
      const spilloverCloseToday = closeMinutes - 1440;
      if (currentMinutes < spilloverCloseToday) {
        return {
          isOpen: true,
          currentDay: yesterdayName,
          opensAt: yesterdaySchedule.open,
          closesAt: yesterdaySchedule.close,
        };
      }
    }
  }

  // 2. Check today's shift
  const todaySchedule = schedule[dayName];
  if (todaySchedule && !todaySchedule.closed) {
    const { openMinutes, closeMinutes } = parseShift(todaySchedule.open, todaySchedule.close);

    if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
      return {
        isOpen: true,
        currentDay: dayName,
        opensAt: todaySchedule.open,
        closesAt: todaySchedule.close,
      };
    }
  }

  // 3. Restaurant is CLOSED. Find next opening time across upcoming days
  let nextOpenDay = '';
  let nextOpenTime = '';

  if (todaySchedule && !todaySchedule.closed) {
    const { openMinutes } = parseShift(todaySchedule.open, todaySchedule.close);
    if (currentMinutes < openMinutes) {
      nextOpenDay = dayName;
      nextOpenTime = todaySchedule.open;
    }
  }

  if (!nextOpenTime) {
    for (let i = 1; i <= 7; i++) {
      const nextIdx = (dayIdx + i) % 7;
      const nextDay = DAYS_ORDER[nextIdx];
      const sched = schedule[nextDay];
      if (sched && !sched.closed) {
        nextOpenDay = nextDay;
        nextOpenTime = sched.open;
        break;
      }
    }
  }

  const isNextToday = nextOpenDay === dayName;
  const capitalizedDay = nextOpenDay ? nextOpenDay.charAt(0).toUpperCase() + nextOpenDay.slice(1) : '';
  const formattedMessage = isNextToday
    ? `Closed now, opens at ${nextOpenTime}`
    : `Closed now, opens at ${nextOpenTime}${capitalizedDay ? ` on ${capitalizedDay}` : ''}`;

  return {
    isOpen: false,
    currentDay: dayName,
    nextOpenDay,
    nextOpenTime,
    formattedMessage,
  };
}
