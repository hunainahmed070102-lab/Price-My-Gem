/* ═══════════════════════════════════════════════════════════════
   Price My Gem - Unified Design System
   Mobile App Aligned - Production Ready
   ═══════════════════════════════════════════════════════════════ */

/* ═══ Color Palette ═══ */
export const COLORS = {
  // Primary brand: Restrained Purples
  primary: '#6B58D6',
  primaryLight: '#8877E3',
  primaryDark: '#4936B3',
  primaryLighter: '#A89AEA',
  primaryHover: '#5845C2',
  
  // Text colors
  textPrimary: '#1E1742',
  darkText: '#1E1742',
  textSecondary: '#6B7280',
  textMuted: '#A89AEA',
  
  // Surface colors
  white: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceLight: '#F5F3FF',
  background: '#F8F7FC',
  lavender: '#F5F3FF',
  
  // Border colors
  border: '#E3DEFC',
  borderLight: '#EDE9FE',
  borderMuted: '#E3DEFC',
  
  // Status colors
  success: '#10B981',
  successBg: '#ECFDF5',
  successBorder: '#A7F3D0',
  
  error: '#EF4444',
  errorBg: '#FEF2F2',
  errorBorder: '#FECACA',
  
  warning: '#F59E0B',
  warningBg: '#FFFBEB',
  warningBorder: '#FDE68A',
  
  info: '#3B82F6',
  infoBg: '#EFF6FF',
  infoBorder: '#BFDBFE',
  
  // Dark navy
  darkNavy: '#1E1742',
};

/* ═══ Typography Scale - Professional & Refined (Roboto Condensed) ═══ */
export const TYPOGRAPHY = {
  // Page titles
  pageTitle: {
    fontSize: 26,
    fontWeight: 600,
    color: COLORS.textPrimary,
    letterSpacing: '-0.3px',
    lineHeight: 1.25,
    fontFamily: "'Roboto Condensed', sans-serif",
  },
  
  // Page descriptions
  pageDesc: {
    fontSize: 14,
    fontWeight: 400,
    color: COLORS.textSecondary,
    lineHeight: 1.5,
    fontFamily: "'Roboto Condensed', sans-serif",
  },
  
  // Section titles
  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: COLORS.textPrimary,
    letterSpacing: '-0.2px',
    lineHeight: 1.3,
    fontFamily: "'Roboto Condensed', sans-serif",
  },
  
  // Section descriptions
  sectionDesc: {
    fontSize: 13,
    fontWeight: 400,
    color: COLORS.textSecondary,
    lineHeight: 1.4,
    fontFamily: "'Roboto Condensed', sans-serif",
  },
  
  // Card number - refined, not oversized
  cardNumber: {
    fontSize: 28,
    fontWeight: 600,
    color: COLORS.textPrimary,
    letterSpacing: '-0.8px',
    lineHeight: 1,
    fontFamily: "'Roboto Condensed', sans-serif",
  },
  
  // Card label - not bold
  cardLabel: {
    fontSize: 13,
    fontWeight: 500,
    lineHeight: 1.3,
    fontFamily: "'Roboto Condensed', sans-serif",
  },
  
  // Card subtitle - muted
  cardSubtitle: {
    fontSize: 12,
    fontWeight: 400,
    lineHeight: 1.3,
    fontFamily: "'Roboto Condensed', sans-serif",
  },
  
  // Table header
  tableHead: {
    fontSize: 11,
    fontWeight: 600,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontFamily: "'Roboto Condensed', sans-serif",
  },
  
  // Table cell
  tableCell: {
    fontSize: 13,
    fontWeight: 400,
    color: COLORS.textPrimary,
    fontFamily: "'Roboto Condensed', sans-serif",
  },
  
  // Table cell medium
  tableCellMedium: {
    fontSize: 13,
    fontWeight: 500,
    color: COLORS.textPrimary,
    fontFamily: "'Roboto Condensed', sans-serif",
  },
  
  // Badge text
  badge: {
    fontSize: 11,
    fontWeight: 600,
    lineHeight: 1,
    fontFamily: "'Roboto Condensed', sans-serif",
  },
  
  // Button text
  button: {
    fontSize: 14,
    fontWeight: 600,
    fontFamily: "'Roboto Condensed', sans-serif",
  },
};

/* ═══ Spacing System ═══ */
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  
  // Component-specific
  cardPadding: 24,
  cardGap: 16,
  sectionGap: 24,
  pageTopPadding: 20,
  
  // Border radius
  radiusSm: 8,
  radius: 12,
  radiusLg: 14,
  radiusXl: 16,
  radiusFull: 9999,
};

/* ═══ Shadows - Minimal & Subtle ═══ */
export const SHADOWS = {
  none: 'none',
  subtle: '0 1px 2px rgba(0, 0, 0, 0.04)',
  sm: '0 1px 3px rgba(0, 0, 0, 0.05)',
  md: '0 2px 4px rgba(0, 0, 0, 0.04)',
  
  // Focus
  focus: `0 0 0 3px ${COLORS.primary}14`,
};

/* ═══ Component Styles ═══ */

// Card component - Premium minimal style
export const cardStyle = (hover = false) => ({
  background: COLORS.surface,
  border: `1px solid ${COLORS.border}`,
  borderRadius: SPACING.radius,
  transition: 'all 0.2s ease',
  ...(hover && {
    ':hover': {
      borderColor: COLORS.primary + '40',
    },
  }),
});

// Stat card style - Premium design
export const statCardStyle = {
  background: COLORS.surface,
  border: `1px solid ${COLORS.border}`,
  borderRadius: SPACING.radius,
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  minHeight: '120px',
  transition: 'all 0.2s ease',
};

// Input style
export const inputStyle = (focused = false) => ({
  width: '100%',
  height: 54,
  padding: '0 16px',
  borderRadius: SPACING.radius,
  border: `1px solid ${focused ? COLORS.primary : COLORS.border}`,
  background: COLORS.white,
  fontSize: 14,
  fontWeight: 400,
  color: COLORS.textPrimary,
  fontFamily: "'Roboto Condensed', sans-serif",
  outline: 'none',
  transition: 'all 0.2s ease',
  boxShadow: focused ? SHADOWS.focus : 'none',
});

// Button styles
export const buttonStyles = {
  primary: {
    height: 44,
    padding: '0 24px',
    borderRadius: SPACING.radius,
    border: 'none',
    background: COLORS.primary,
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 600,
    fontFamily: "'Roboto Condensed', sans-serif",
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: `0 4px 12px ${COLORS.primary}30`,
    ':hover': {
      background: COLORS.primaryLight,
      boxShadow: `0 6px 16px ${COLORS.primary}40`,
      transform: 'translateY(-1px)',
    },
    ':active': {
      transform: 'translateY(0)',
    },
  },
  
  secondary: {
    height: 44,
    padding: '0 24px',
    borderRadius: SPACING.radius,
    border: `1px solid ${COLORS.border}`,
    background: COLORS.white,
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: 600,
    fontFamily: "'Roboto Condensed', sans-serif",
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      background: COLORS.background,
      borderColor: COLORS.primary,
    },
  },
  
  danger: {
    height: 44,
    padding: '0 24px',
    borderRadius: SPACING.radius,
    border: 'none',
    background: COLORS.error,
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 600,
    fontFamily: "'Roboto Condensed', sans-serif",
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: `0 4px 12px ${COLORS.error}30`,
    ':hover': {
      background: '#DC2626',
      transform: 'translateY(-1px)',
    },
  },
};

// Badge styles
export const getBadgeStyle = (type = 'default') => {
  const styles = {
    success: {
      background: COLORS.successBg,
      color: COLORS.success,
      border: `1px solid ${COLORS.successBorder}`,
    },
    error: {
      background: COLORS.errorBg,
      color: COLORS.error,
      border: `1px solid ${COLORS.errorBorder}`,
    },
    warning: {
      background: COLORS.warningBg,
      color: COLORS.warning,
      border: `1px solid ${COLORS.warningBorder}`,
    },
    info: {
      background: COLORS.infoBg,
      color: COLORS.info,
      border: `1px solid ${COLORS.infoBorder}`,
    },
    default: {
      background: COLORS.background,
      color: COLORS.textSecondary,
      border: `1px solid ${COLORS.border}`,
    },
  };
  
  return {
    ...styles[type],
    padding: '5px 14px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
    fontFamily: "'Roboto Condensed', sans-serif",
  };
};

// Table styles
export const tableStyles = {
  container: {
    background: COLORS.white,
    border: `1px solid ${COLORS.border}`,
    borderRadius: SPACING.radiusLg,
    overflow: 'hidden',
    boxShadow: SHADOWS.sm,
  },
  
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  
  th: {
    padding: '12px 18px',
    textAlign: 'left',
    fontSize: 11,
    fontWeight: 700,
    color: COLORS.white,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    background: COLORS.primary,
    border: `1px solid ${COLORS.primaryLight}`,
    fontFamily: "'Roboto Condensed', sans-serif",
  },
  
  td: {
    padding: '14px 18px',
    fontSize: 13,
    fontWeight: 400,
    color: COLORS.textPrimary,
    border: `1px solid ${COLORS.border}`,
    fontFamily: "'Roboto Condensed', sans-serif",
  },
  
  row: {
    transition: 'background 0.15s ease',
    ':hover': {
      background: COLORS.background,
    },
  },
};

// Loading shimmer animation
export const shimmerStyle = (width = '100%', height = 18) => ({
  width,
  height,
  borderRadius: SPACING.radiusSm,
  background: `linear-gradient(90deg, ${COLORS.background} 25%, ${COLORS.border} 50%, ${COLORS.background} 75%)`,
  backgroundSize: '200% 100%',
  animation: 'pmg-shimmer 1.5s infinite',
});

// Empty state
export const emptyStateStyle = {
  padding: '48px 24px',
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 12,
};

/* ═══ Utility Functions ═══ */

export const formatCurrency = (value, currency = 'Rs') => {
  const num = parseFloat(value) || 0;
  return `${currency} ${num.toLocaleString()}`;
};

export const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const getStatusBadge = (status) => {
  const statusMap = {
    active: { type: 'success', label: 'Active' },
    blocked: { type: 'error', label: 'Blocked' },
    pending: { type: 'warning', label: 'Pending' },
    completed: { type: 'success', label: 'Completed' },
    real: { type: 'success', label: 'Authentic' },
    synthetic: { type: 'error', label: 'Synthetic' },
    uncertain: { type: 'warning', label: 'Uncertain' },
  };
  
  return statusMap[status] || { type: 'default', label: status };
};
