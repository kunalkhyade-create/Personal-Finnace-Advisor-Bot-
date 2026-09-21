/**
 * Formats a numeric value into Indian Rupee currency format (e.g., ₹1,25,000).
 */
export const formatINR = (amount, maximumFractionDigits = 0) => {
  const val = Number(amount) || 0;
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: maximumFractionDigits,
      minimumFractionDigits: 0
    }).format(val);
  } catch (e) {
    return `₹${val.toLocaleString('en-IN')}`;
  }
};

/**
 * Formats a number with Indian comma separation without currency symbol.
 */
export const formatIndianNumber = (amount) => {
  const val = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN').format(val);
};

/**
 * Formats a percentage value (e.g., 24.5%).
 */
export const formatPercent = (percent) => {
  const val = Number(percent) || 0;
  return `${val.toFixed(1)}%`;
};

/**
 * Formats an ISO date string (YYYY-MM-DD) into standard Indian/British display (DD MMM YYYY).
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch (e) {
    return dateStr;
  }
};

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const getMonthName = (monthNum) => {
  const m = parseInt(monthNum, 10);
  return MONTH_NAMES[m - 1] || "";
};
