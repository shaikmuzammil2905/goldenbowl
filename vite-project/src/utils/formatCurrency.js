/**
 * Format a numeric amount to Indian Rupee currency string (e.g. ₹249).
 * @param {number} amount
 * @param {object} options
 * @returns {string}
 */
export function formatCurrency(amount, options = {}) {
  const num = Number(amount) || 0;
  if (options.compact && num >= 1000) {
    return `₹${(num / 1000).toFixed(1)}k`;
  }
  return `₹${num.toLocaleString('en-IN')}`;
}
