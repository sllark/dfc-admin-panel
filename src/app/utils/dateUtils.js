/**
 * Format a date string to a readable format
 * @param {string} dateStr - Date string to format
 * @param {object} options - Formatting options
 * @returns {string} Formatted date string
 */
export const formatDate = (dateStr, options = {}) => {
  if (!dateStr) return "—";
  
  try {
    const date = new Date(dateStr);
    
    const defaultOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      ...options,
    };
    
    return date.toLocaleString("en-US", defaultOptions);
  } catch (e) {
    return dateStr;
  }
};

/**
 * Format a date to date-only format (no time)
 * @param {string} dateStr - Date string to format
 * @returns {string} Formatted date string
 */
export const formatDateOnly = (dateStr) => {
  if (!dateStr) return "—";
  
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch (e) {
    return dateStr;
  }
};

/**
 * Format a date to a simple date format
 * @param {string} dateStr - Date string to format
 * @returns {string} Formatted date string
 */
export const formatSimpleDate = (dateStr) => {
  if (!dateStr) return "—";
  
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  } catch (e) {
    return dateStr;
  }
};
