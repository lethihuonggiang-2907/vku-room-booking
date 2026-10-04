export const colors = {
  // Brand colors (VKU Vietnam - Korea University style)
  primary: '#0D47A1',       // Deep VKU Blue
  primaryDark: '#0A337A',
  primaryLight: '#E8F0FE',
  primaryGradientStart: '#0D47A1',
  primaryGradientEnd: '#1976D2',

  secondary: '#FF6F00',     // Vibrant Accent Orange
  secondaryLight: '#FFF3E0',

  // Status colors
  success: '#10B981',       // Trống / Có thể đặt
  successLight: '#ECFDF5',
  successDark: '#047857',
  
  danger: '#EF4444',        // Đã đặt / Quá giờ / Hủy
  dangerLight: '#FEF2F2',
  dangerDark: '#B91C1C',

  warning: '#F59E0B',       // Chờ duyệt / Cảnh báo
  warningLight: '#FFFBEB',

  info: '#3B82F6',
  infoLight: '#EFF6FF',

  // Neutral tones
  background: '#F8FAFC',    // Slate 50
  surface: '#FFFFFF',       // Card / White
  surfaceElevated: '#FFFFFF',
  surfaceSubtle: '#F1F5F9', // Slate 100
  surfaceMuted: '#E2E8F0',  // Slate 200

  // Text
  text: '#0F172A',          // Slate 900
  textSecondary: '#475569', // Slate 600
  textMuted: '#94A3B8',     // Slate 400
  textLight: '#CBD5E1',     // Slate 300
  textWhite: '#FFFFFF',
  white: '#FFFFFF',
  black: '#000000',

  // Borders
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  borderFocus: '#0D47A1',

  // Overlay
  overlay: 'rgba(15, 23, 42, 0.55)',
  
  // Building brand badge colors
  buildingA: { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  buildingB: { bg: '#FAF5FF', text: '#6D28D9', border: '#E9D5FF' },
  buildingC: { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0' },
  buildingV: { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA' },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
};

export const borderRadius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  full: 9999,
};

export const shadows = {
  none: {},
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const typography = {
  fontSize: {
    xs: 11,
    sm: 13,
    md: 14,
    base: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    hero: 28,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    heavy: '800' as const,
  },
};

export const minTouchTarget = 44;

export const theme = {
  colors,
  spacing,
  borderRadius,
  shadows,
  typography,
  minTouchTarget,
};

export default theme;
