// Format date to readable string
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Get authenticity color
export const getAuthenticityColor = (authenticity) => {
  switch (authenticity) {
    case 'real':
      return '#4CAF50';
    case 'uncertain':
      return '#FF9800';
    case 'synthetic':
      return '#F44336';
    default:
      return '#666666';
  }
};

// Get confidence color
export const getConfidenceColor = (confidence) => {
  if (confidence >= 85) return '#4CAF50';
  if (confidence >= 60) return '#FF9800';
  return '#F44336';
};

// Validate email
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Format price range
export const formatPrice = (priceRange) => {
  if (!priceRange || priceRange === 'Price not available') {
    return 'N/A';
  }
  return priceRange;
};

/**
 * Formats a scan report's market valuation into a compact per-carat label
 * for list rows (e.g., "Rs 1,200,000 / ct").
 */
export const formatCompactValuation = (item) => {
  if (
    item?.price_details?.pricePerCarat !== undefined &&
    item?.price_details?.pricePerCarat !== null
  ) {
    return `Rs ${Number(item.price_details.pricePerCarat).toLocaleString()} / ct`;
  }

  const raw = String(item?.price_range || '').trim();
  if (!raw) return 'Price on request';

  if (/^[\d,]+(\.\d+)?$/.test(raw)) {
    return `Rs ${Number(raw.replace(/,/g, '')).toLocaleString()} / ct`;
  }

  return raw
    .replace(/\s*(?:PKR|USD)?\s*\/\s*(?:carat|ct)$/i, ' / ct')
    .trim();
};

/**
 * Shared display metadata (label, status color) for scan authenticity rows.
 */
export const getScanStatusMeta = (authenticity) => {
  const authText = String(authenticity || 'Real').toUpperCase();
  if (authText === 'REAL') {
    return {
      authText,
      color: '#6B58D6',
    };
  }
  if (authText === 'UNCERTAIN') {
    return {
      authText,
      color: '#D97706',
    };
  }
  return {
    authText,
    color: '#DC5252',
  };
};
