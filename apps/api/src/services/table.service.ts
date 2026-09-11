import { prisma } from '../prisma';

export interface TableAvailabilityResult {
  totalTables: number;
  availableTables: number;
  occupiedTables: number;
  totalSeats: number;
  availableSeats: number;
  timestamp: string;
}

/**
 * Calculates live, database-derived table availability based on:
 * 1. Active table count in RestaurantTable (or configured settings.tableCount fallback)
 * 2. Active DINE_IN orders (status: PENDING, CONFIRMED, PREPARING, READY)
 * 3. Active reservations (status: PENDING, CONFIRMED) within a +/- 90-minute dining window
 */
export const getTableAvailability = async (targetDate?: Date): Promise<TableAvailabilityResult> => {
  const queryTime = targetDate && !isNaN(targetDate.getTime()) ? targetDate : new Date();

  // 1. Fetch total active tables from DB
  const [activeTablesCount, settings] = await Promise.all([
    prisma.restaurantTable.count({
      where: { isActive: true },
    }),
    prisma.restaurantSettings.findUnique({
      where: { id: 'singleton' },
      select: { tableCount: true },
    }),
  ]);

  const totalTables = activeTablesCount > 0 ? activeTablesCount : (settings?.tableCount ?? 100);

  // 2. Active DINE_IN orders (only active for current time if query is for "now", or overlapping window)
  const isQueryingNow = Math.abs(queryTime.getTime() - Date.now()) < 15 * 60 * 1000;
  
  let activeDineInOrders: Array<{ tableNumber: string | null }> = [];
  if (isQueryingNow) {
    activeDineInOrders = await prisma.order.findMany({
      where: {
        type: 'DINE_IN',
        status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'] },
        tableNumber: { not: null },
      },
      select: { tableNumber: true },
    });
  }

  // 3. Active reservations in a +/- 90-minute window of the query time
  const windowStart = new Date(queryTime.getTime() - 90 * 60 * 1000);
  const windowEnd = new Date(queryTime.getTime() + 90 * 60 * 1000);

  const activeReservations = await prisma.reservation.findMany({
    where: {
      status: { in: ['PENDING', 'CONFIRMED'] },
      date: {
        gte: windowStart,
        lte: windowEnd,
      },
    },
    select: {
      tableNumber: true,
      partySize: true,
    },
  });

  // 4. Compute unique occupied table numbers
  const occupiedTableSet = new Set<string>();

  for (const order of activeDineInOrders) {
    if (order.tableNumber) {
      occupiedTableSet.add(order.tableNumber.trim());
    }
  }

  let unassignedReservationTables = 0;
  for (const res of activeReservations) {
    if (res.tableNumber) {
      occupiedTableSet.add(res.tableNumber.trim());
    } else {
      // If table is not specifically assigned, count needed tables based on 4-person table size
      unassignedReservationTables += Math.max(1, Math.ceil(res.partySize / 4));
    }
  }

  const occupiedTables = Math.min(totalTables, occupiedTableSet.size + unassignedReservationTables);
  const availableTables = Math.max(0, totalTables - occupiedTables);
  const totalSeats = totalTables * 4;
  const availableSeats = availableTables * 4;

  return {
    totalTables,
    availableTables,
    occupiedTables,
    totalSeats,
    availableSeats,
    timestamp: queryTime.toISOString(),
  };
};
