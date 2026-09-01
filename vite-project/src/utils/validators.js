/**
 * Validate email format.
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Validate Indian 10-digit mobile number format.
 * @param {string} phone
 * @returns {boolean}
 */
export function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10;
}

/**
 * Validate required text input.
 * @param {string} text
 * @returns {boolean}
 */
export function isNonEmpty(text) {
  return Boolean(text && String(text).trim().length > 0);
}

/**
 * Form validator helper returning error object or empty object if valid.
 */
export function validateLoginForm(identifier, password) {
  const errors = {};
  if (!isNonEmpty(identifier)) {
    errors.identifier = 'Email or mobile number is required';
  } else if (!isValidEmail(identifier) && !isValidPhone(identifier)) {
    errors.identifier = 'Please enter a valid email or 10-digit mobile number';
  }
  if (!isNonEmpty(password)) {
    errors.password = 'Password is required';
  } else if (password.length < 4) {
    errors.password = 'Password must be at least 4 characters';
  }
  return errors;
}

export function validateProductForm(product) {
  const errors = {};
  if (!isNonEmpty(product.name)) errors.name = 'Product name is required';
  if (!product.price || Number(product.price) <= 0) errors.price = 'Valid price is required';
  if (!isNonEmpty(product.category)) errors.category = 'Category is required';
  return errors;
}
