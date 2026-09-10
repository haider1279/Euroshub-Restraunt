/**
 * Centralized currency formatting utility for Euroshub Kitchen.
 * Strictly formats amounts in PKR (e.g., "Rs. 700", "Rs. 1,300").
 * Never displays "$", "€", or raw unformatted amounts.
 */
export const formatCurrency = (amount: number | string | null | undefined): string => {
  if (amount === null || amount === undefined || amount === '') {
    return 'Rs. 0';
  }

  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) {
    return 'Rs. 0';
  }

  // Format with thousand separators and no decimal places for whole rupees
  const formatted = new Intl.NumberFormat('en-PK', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Math.round(num));

  return `Rs. ${formatted}`;
};
