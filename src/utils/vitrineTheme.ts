export interface VitrineThemePreset {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  gradient: boolean;
  mode: 'dark' | 'light';
  bgMain: string;
  bgSecondary: string;
  cardBg: string;
  cardHover: string;
  cardBorder: string;
  cardInnerBg: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accentBadgeBg: string;
  accentBadgeText: string;
  accentBadgeBorder: string;
  dividerColor: string;
}

export interface VitrineTokens {
  presetId: string;
  mode: 'dark' | 'light';
  isDark: boolean;
  primaryColor: string;
  secondaryColor: string;
  gradientEnabled: boolean;
  primaryGradient: string;
  bgMain: string;
  bgSecondary: string;
  cardBg: string;
  cardHover: string;
  cardBorder: string;
  cardInnerBg: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  primaryButtonBg: string;
  primaryButtonText: string;
  primaryButtonHover: string;
  accentBadgeBg: string;
  accentBadgeText: string;
  accentBadgeBorder: string;
  dividerColor: string;
  // Status indicators (Open/Closed)
  statusOpenBg: string;
  statusOpenText: string;
  statusOpenBorder: string;
  statusClosedBg: string;
  statusClosedText: string;
  statusClosedBorder: string;
  // Top curve fill for Modelo 1
  curveFill: string;
}

export const THEME_PRESETS: VitrineThemePreset[] = [
  {
    id: 'branco-vermelho',
    name: 'Branco & Vermelho',
    primary: '#dc2626',
    secondary: '#ef4444',
    gradient: true,
    mode: 'light',
    bgMain: '#fafafa',
    bgSecondary: '#f4f4f5',
    cardBg: '#ffffff',
    cardHover: '#fef2f2',
    cardBorder: '#fee2e2',
    cardInnerBg: '#fef2f2',
    textPrimary: '#09090b',
    textSecondary: '#52525b',
    textMuted: '#71717a',
    accentBadgeBg: '#fee2e2',
    accentBadgeText: '#dc2626',
    accentBadgeBorder: '#fecaca',
    dividerColor: '#fee2e2',
  },
  {
    id: 'preto-vermelho',
    name: 'Preto & Vermelho',
    primary: '#ef4444',
    secondary: '#dc2626',
    gradient: true,
    mode: 'dark',
    bgMain: '#09090b',
    bgSecondary: '#121215',
    cardBg: '#18181b',
    cardHover: '#202024',
    cardBorder: '#2e1e24',
    cardInnerBg: '#23181c',
    textPrimary: '#fafafa',
    textSecondary: '#a1a1aa',
    textMuted: '#71717a',
    accentBadgeBg: '#2d1519',
    accentBadgeText: '#f87171',
    accentBadgeBorder: '#4c1d24',
    dividerColor: '#27272a',
  },
  {
    id: 'classico',
    name: 'Clássico Amadeirado',
    primary: '#d97706',
    secondary: '#b45309',
    gradient: true,
    mode: 'dark',
    bgMain: '#140e0a',
    bgSecondary: '#1c140e',
    cardBg: '#231912',
    cardHover: '#2b1f17',
    cardBorder: '#3d2b1f',
    cardInnerBg: '#2e2017',
    textPrimary: '#fef3c7',
    textSecondary: '#d5b99a',
    textMuted: '#9e856e',
    accentBadgeBg: '#352214',
    accentBadgeText: '#fbbf24',
    accentBadgeBorder: '#523722',
    dividerColor: '#362519',
  },
  {
    id: 'dark',
    name: 'Dark Rose',
    primary: '#f43f5e',
    secondary: '#e11d48',
    gradient: false,
    mode: 'dark',
    bgMain: '#090d16',
    bgSecondary: '#0f172a',
    cardBg: '#131d33',
    cardHover: '#18243e',
    cardBorder: '#233354',
    cardInnerBg: '#18243e',
    textPrimary: '#f8fafc',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    accentBadgeBg: '#2e1022',
    accentBadgeText: '#fb7185',
    accentBadgeBorder: '#4c1d37',
    dividerColor: '#1e293b',
  },
  {
    id: 'carvao',
    name: 'Carvão & Dourado',
    primary: '#eab308',
    secondary: '#ca8a04',
    gradient: true,
    mode: 'dark',
    bgMain: '#101012',
    bgSecondary: '#18181c',
    cardBg: '#1e1e24',
    cardHover: '#25252c',
    cardBorder: '#32323c',
    cardInnerBg: '#272730',
    textPrimary: '#f4f4f5',
    textSecondary: '#a1a1aa',
    textMuted: '#71717a',
    accentBadgeBg: '#2c2511',
    accentBadgeText: '#fde047',
    accentBadgeBorder: '#473b1b',
    dividerColor: '#27272a',
  },
  {
    id: 'premium',
    name: 'Black & Gold Premium',
    primary: '#fbbf24',
    secondary: '#d97706',
    gradient: true,
    mode: 'dark',
    bgMain: '#050505',
    bgSecondary: '#0d0d0d',
    cardBg: '#141414',
    cardHover: '#1c1c1c',
    cardBorder: '#2b2615',
    cardInnerBg: '#1c1910',
    textPrimary: '#ffffff',
    textSecondary: '#d4d4d8',
    textMuted: '#a1a1aa',
    accentBadgeBg: '#261d08',
    accentBadgeText: '#fde047',
    accentBadgeBorder: '#4a380f',
    dividerColor: '#262626',
  },
  {
    id: 'negresco',
    name: 'Negresco Sólido',
    primary: '#facc15',
    secondary: '#eab308',
    gradient: false,
    mode: 'dark',
    bgMain: '#000000',
    bgSecondary: '#0a0a0a',
    cardBg: '#121212',
    cardHover: '#1a1a1a',
    cardBorder: '#242424',
    cardInnerBg: '#171717',
    textPrimary: '#ffffff',
    textSecondary: '#a3a3a3',
    textMuted: '#737373',
    accentBadgeBg: '#1c1c1c',
    accentBadgeText: '#fde047',
    accentBadgeBorder: '#383838',
    dividerColor: '#1f1f1f',
  },
  {
    id: 'aco',
    name: 'Aço & Ciano',
    primary: '#38bdf8',
    secondary: '#0284c7',
    gradient: true,
    mode: 'dark',
    bgMain: '#0b1120',
    bgSecondary: '#0f172a',
    cardBg: '#17233d',
    cardHover: '#1e2e4e',
    cardBorder: '#253b65',
    cardInnerBg: '#1c2c4c',
    textPrimary: '#f8fafc',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    accentBadgeBg: '#082f49',
    accentBadgeText: '#7dd3fc',
    accentBadgeBorder: '#0369a1',
    dividerColor: '#1e293b',
  },
  {
    id: 'cortestime',
    name: 'Cortestime Classic',
    primary: '#2563eb',
    secondary: '#1d4ed8',
    gradient: true,
    mode: 'dark',
    bgMain: '#051b42',
    bgSecondary: '#082559',
    cardBg: '#092963',
    cardHover: '#0e347b',
    cardBorder: '#164599',
    cardInnerBg: '#0c3275',
    textPrimary: '#ffffff',
    textSecondary: '#bfdbfe',
    textMuted: '#93c5fd',
    accentBadgeBg: '#0b357a',
    accentBadgeText: '#bffd32',
    accentBadgeBorder: '#1d4ed8',
    dividerColor: '#133e85',
  },
  {
    id: 'esmeralda',
    name: 'Esmeralda Nobre',
    primary: '#10b981',
    secondary: '#059669',
    gradient: true,
    mode: 'dark',
    bgMain: '#031a14',
    bgSecondary: '#06261d',
    cardBg: '#09362a',
    cardHover: '#0d4435',
    cardBorder: '#125844',
    cardInnerBg: '#0c3f31',
    textPrimary: '#ecfdf5',
    textSecondary: '#a7f3d0',
    textMuted: '#6ee7b7',
    accentBadgeBg: '#084334',
    accentBadgeText: '#6ee7b7',
    accentBadgeBorder: '#0f766e',
    dividerColor: '#0e4a3b',
  },
];

export function getLuminance(hex: string): number {
  if (!hex || typeof hex !== 'string') return 0.5;
  const cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length !== 6 && cleanHex.length !== 3) return 0.5;
  
  let fullHex = cleanHex;
  if (cleanHex.length === 3) {
    fullHex = cleanHex.split('').map(c => c + c).join('');
  }
  
  const r = parseInt(fullHex.substring(0, 2), 16) / 255;
  const g = parseInt(fullHex.substring(2, 4), 16) / 255;
  const b = parseInt(fullHex.substring(4, 6), 16) / 255;
  
  if (isNaN(r) || isNaN(g) || isNaN(b)) return 0.5;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export function getContrastTextColor(hex: string): string {
  return getLuminance(hex) > 0.55 ? '#09090b' : '#ffffff';
}

export function hexToRgba(hex: string, alpha: number): string {
  if (!hex || typeof hex !== 'string') return `rgba(0,0,0,${alpha})`;
  const cleanHex = hex.replace('#', '').trim();
  let fullHex = cleanHex;
  if (cleanHex.length === 3) {
    fullHex = cleanHex.split('').map(c => c + c).join('');
  }
  if (fullHex.length !== 6) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(fullHex.substring(0, 2), 16);
  const g = parseInt(fullHex.substring(2, 4), 16);
  const b = parseInt(fullHex.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(0,0,0,${alpha})`;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Resolves full tokens from current state
 */
export function resolveVitrineTokens(
  presetId?: string,
  primaryColor?: string,
  secondaryColor?: string,
  gradientEnabled?: boolean
): VitrineTokens {
  const pColor = primaryColor || '#051b42';
  const sColor = secondaryColor || '#2563eb';
  const isGradient = gradientEnabled !== false;

  // 1. Check if matching exact preset by ID or exact colors
  const matchedPreset = THEME_PRESETS.find(p => p.id === presetId) ||
    THEME_PRESETS.find(p => p.primary.toLowerCase() === pColor.toLowerCase() && p.secondary.toLowerCase() === sColor.toLowerCase());

  if (matchedPreset && (!primaryColor || primaryColor.toLowerCase() === matchedPreset.primary.toLowerCase())) {
    const isDark = matchedPreset.mode === 'dark';
    const primaryGrad = matchedPreset.gradient
      ? `linear-gradient(135deg, ${matchedPreset.primary} 0%, ${matchedPreset.secondary} 100%)`
      : matchedPreset.primary;

    return {
      presetId: matchedPreset.id,
      mode: matchedPreset.mode,
      isDark,
      primaryColor: matchedPreset.primary,
      secondaryColor: matchedPreset.secondary,
      gradientEnabled: matchedPreset.gradient,
      primaryGradient: primaryGrad,
      bgMain: matchedPreset.bgMain,
      bgSecondary: matchedPreset.bgSecondary,
      cardBg: matchedPreset.cardBg,
      cardHover: matchedPreset.cardHover,
      cardBorder: matchedPreset.cardBorder,
      cardInnerBg: matchedPreset.cardInnerBg,
      textPrimary: matchedPreset.textPrimary,
      textSecondary: matchedPreset.textSecondary,
      textMuted: matchedPreset.textMuted,
      primaryButtonBg: primaryGrad,
      primaryButtonText: getContrastTextColor(matchedPreset.primary),
      primaryButtonHover: matchedPreset.secondary,
      accentBadgeBg: matchedPreset.accentBadgeBg,
      accentBadgeText: matchedPreset.accentBadgeText,
      accentBadgeBorder: matchedPreset.accentBadgeBorder,
      dividerColor: matchedPreset.dividerColor,
      statusOpenBg: isDark ? 'rgba(16, 185, 129, 0.15)' : '#f0fdf4',
      statusOpenText: isDark ? '#34d399' : '#166534',
      statusOpenBorder: isDark ? 'rgba(52, 211, 153, 0.3)' : '#bbf7d0',
      statusClosedBg: isDark ? 'rgba(56, 189, 248, 0.15)' : '#f0f9ff',
      statusClosedText: isDark ? '#38bdf8' : '#0369a1',
      statusClosedBorder: isDark ? 'rgba(56, 189, 248, 0.3)' : '#bae6fd',
      curveFill: matchedPreset.bgMain,
    };
  }

  // 2. Custom or dynamic calculations
  const lumP = getLuminance(pColor);
  const lumS = getLuminance(sColor);
  const isLight = lumP > 0.65 || pColor.toLowerCase() === '#ffffff' || pColor.toLowerCase() === '#fafafa';
  const isDark = !isLight;
  const primaryGrad = isGradient
    ? `linear-gradient(135deg, ${pColor} 0%, ${sColor} 100%)`
    : pColor;

  if (isLight) {
    return {
      presetId: presetId || 'custom',
      mode: 'light',
      isDark: false,
      primaryColor: pColor,
      secondaryColor: sColor,
      gradientEnabled: isGradient,
      primaryGradient: primaryGrad,
      bgMain: '#fafafa',
      bgSecondary: '#f4f4f5',
      cardBg: '#ffffff',
      cardHover: hexToRgba(pColor, 0.05),
      cardBorder: hexToRgba(pColor, 0.18),
      cardInnerBg: hexToRgba(pColor, 0.06),
      textPrimary: '#09090b',
      textSecondary: '#52525b',
      textMuted: '#71717a',
      primaryButtonBg: primaryGrad,
      primaryButtonText: getContrastTextColor(pColor),
      primaryButtonHover: sColor,
      accentBadgeBg: hexToRgba(pColor, 0.12),
      accentBadgeText: pColor,
      accentBadgeBorder: hexToRgba(pColor, 0.28),
      dividerColor: hexToRgba(pColor, 0.12),
      statusOpenBg: '#f0fdf4',
      statusOpenText: '#166534',
      statusOpenBorder: '#bbf7d0',
      statusClosedBg: '#f0f9ff',
      statusClosedText: '#0369a1',
      statusClosedBorder: '#bae6fd',
      curveFill: '#fafafa',
    };
  }

  // Dark Custom (Calculates subtle tones and tints from chosen palette)
  return {
    presetId: presetId || 'custom',
    mode: 'dark',
    isDark: true,
    primaryColor: pColor,
    secondaryColor: sColor,
    gradientEnabled: isGradient,
    primaryGradient: primaryGrad,
    bgMain: '#09090b',
    bgSecondary: '#000000',
    cardBg: '#121215',
    cardHover: '#18181c',
    cardBorder: hexToRgba(pColor, 0.25),
    cardInnerBg: hexToRgba(pColor, 0.12),
    textPrimary: '#fafafa',
    textSecondary: '#a1a1aa',
    textMuted: '#71717a',
    primaryButtonBg: primaryGrad,
    primaryButtonText: getContrastTextColor(pColor),
    primaryButtonHover: sColor,
    accentBadgeBg: hexToRgba(pColor, 0.18),
    accentBadgeText: pColor,
    accentBadgeBorder: hexToRgba(pColor, 0.4),
    dividerColor: hexToRgba(pColor, 0.15),
    statusOpenBg: 'rgba(16, 185, 129, 0.15)',
    statusOpenText: '#34d399',
    statusOpenBorder: 'rgba(52, 211, 153, 0.3)',
    statusClosedBg: 'rgba(56, 189, 248, 0.15)',
    statusClosedText: '#38bdf8',
    statusClosedBorder: 'rgba(56, 189, 248, 0.3)',
    curveFill: '#09090b',
  };
}
