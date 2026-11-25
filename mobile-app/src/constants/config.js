import { NativeModules, Platform } from 'react-native';

// API Configuration (EXPO_PUBLIC_API_URL > Metro LAN host > local LAN IP fallback for standalone APK)
const DEFAULT_LAN_HOST = '192.168.1.18';

const getApiBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }

  try {
    const scriptURL =
      NativeModules?.SourceCode?.getConstants?.()?.scriptURL ||
      NativeModules?.SourceCode?.scriptURL;
    if (scriptURL) {
      const match = scriptURL.match(/^https?:\/\/([^:/]+)/);
      if (match && match[1]) {
        return `http://${match[1]}:5002/api`;
      }
    }
  } catch (_) {}

  return `http://${DEFAULT_LAN_HOST}:5002/api`;
};

export const API_BASE_URL = getApiBaseUrl();

// Alternative URLs:
// Physical Device over LAN: http://<LAN_IP>:5002/api
// Android Emulator: http://10.0.2.2:5002/api
// iOS Simulator: http://localhost:5002/api

export const API_ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  PROFILE: '/auth/profile',
  ANALYZE: '/analyze',
  HISTORY: '/history',
  REPORT: '/report'
};

// ─── GLOBAL DESIGN SYSTEM COLOR PALETTE ─────────────────────────────────────
// Controlled accent color, white surfaces, subtle borders, dark readable typography
export const COLORS = {
  // Brand Purples (Used as controlled accents)
  primary: '#6B58D6',        // Primary Purple
  primaryHover: '#5845C2',
  primaryDark: '#4936B3',
  secondary: '#8877E3',      // Secondary Purple
  lightPurple: '#A89AEA',    // Light Purple
  purpleMuted: '#A89AEA',

  // Surfaces & Backgrounds
  background: '#FFFFFF',     // Pure white screen background
  surface: '#FFFFFF',        // White surface
  surfaceLight: '#F5F3FF',   // Subtle light surface tint
  cardBg: '#FFFFFF',         // White card surfaces
  cardBgTint: '#F5F3FF',     // Light surface for subtle badges/containers
  white: '#FFFFFF',

  // Borders & Dividers
  border: '#EBE7F8',         // Clean hairline border/divider
  borderLight: '#F3F0FC',
  divider: '#EBE7F8',

  // Typography
  darkText: '#1E1742',       // Dark Text for high readability
  text: '#1E1742',
  textPrimary: '#1E1742',
  textSecondary: '#6B7280',  // Medium gray
  textMuted: '#A89AEA',      // Muted purple-gray
  textLight: '#9CA3AF',
  textOnPrimary: '#FFFFFF',
  inactive: '#9CA3AF',

  // Functional Status Colors
  success: '#10B981',
  successLight: '#ECFDF5',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  error: '#EF4444',
  errorLight: '#FEF2F2',
  info: '#3B82F6',
  infoLight: '#EFF6FF',

  // Subtle Shadows
  shadow: 'rgba(107, 88, 214, 0.08)',
};

// App Constants
export const APP_NAME = 'Price My Gem';
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
