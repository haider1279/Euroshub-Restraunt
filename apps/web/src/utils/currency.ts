/**
 * Centralized currency formatting for Euroshub Kitchen.
 * Always PKR as "Rs 1,250": whole rupees, thousands separators, no decimals.
 */
const formatter = new Intl.NumberFormat('en-PK', {
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

export const formatCurrency = (amount: number | string | null | undefined): string => {
  if (amount === null || amount === undefined || amount === '') {
    return 'Rs 0';
  }

  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) {
    return 'Rs 0';
  }

  return `Rs ${formatter.format(Math.round(num))}`;
};
