/**
 * Price My Gem — Global Typography Configuration
 * Enforces Roboto Condensed across the entire application.
 */

export const FONT_FAMILIES = {
  light: 'RobotoCondensed-Light',
  regular: 'RobotoCondensed-Regular',
  medium: 'RobotoCondensed-Medium',
  semiBold: 'RobotoCondensed-SemiBold',
  bold: 'RobotoCondensed-Bold',
};

export const TYPOGRAPHY = {
  headerKicker: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 22,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  body: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  bodyMedium: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  bodySmall: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  button: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 14,
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 16,
    letterSpacing: 0.3,
  },
  cardSubtitle: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  label: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: 12,
    letterSpacing: 0.4,
  },
  badge: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
};
