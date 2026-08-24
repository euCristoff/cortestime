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
  secondaryGradient: string;
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
  // Location and highlight details
  locationPinBg: string;
  locationPinColor: string;
  tagPillBg: string;
  tagPillText: string;
}

export const THEME_PRESETS: VitrineThemePreset[] = [
  {
    id: 'branco-vermelho',
    name: 'Branco & Vermelho (Clean)',
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
    accentBadgeBg: '#dc2626',
    accentBadgeText: '#ffffff',
    accentBadgeBorder: '#b91c1c',
    dividerColor: '#fee2e2',
  },
  {
    id: 'preto-vermelho',
    name: 'Preto & Vermelho (Dark)',
    primary: '#ef4444',
    secondary: '#dc2626',
    gradient: true,
    mode: 'dark',
    bgMain: '#0c1322',
    bgSecondary: '#070d18',
    cardBg: '#131d33',
    cardHover: '#18243e',
    cardBorder: '#253b65',
    cardInnerBg: '#17243f',
    textPrimary: '#f8fafc',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    accentBadgeBg: '#ef4444',
    accentBadgeText: '#ffffff',
    accentBadgeBorder: '#dc2626',
    dividerColor: '#1e293b',
  },
  {
    id: 'cortestime',
    name: 'Cortestime Royal & Ciano',
    primary: '#2563eb',
    secondary: '#06b6d4',
    gradient: true,
    mode: 'dark',
    bgMain: '#051b42',
    bgSecondary: '#03122c',
    cardBg: '#092963',
    cardHover: '#0e347b',
    cardBorder: '#164599',
    cardInnerBg: '#0c3275',
    textPrimary: '#ffffff',
    textSecondary: '#bfdbfe',
    textMuted: '#93c5fd',
    accentBadgeBg: '#2563eb',
    accentBadgeText: '#ffffff',
    accentBadgeBorder: '#1d4ed8',
    dividerColor: '#133e85',
  },
  {
    id: 'premium-gold',
    name: 'Black & Gold Nobre',
    primary: '#f59e0b',
    secondary: '#d97706',
    gradient: true,
    mode: 'dark',
    bgMain: '#09090b',
    bgSecondary: '#000000',
    cardBg: '#141418',
    cardHover: '#1c1c22',
    cardBorder: '#2e2616',
    cardInnerBg: '#1c1810',
    textPrimary: '#ffffff',
    textSecondary: '#d4d4d8',
    textMuted: '#a1a1aa',
    accentBadgeBg: '#f59e0b',
    accentBadgeText: '#000000',
    accentBadgeBorder: '#d97706',
    dividerColor: '#262626',
  },
  {
    id: 'esmeralda',
    name: 'Esmeralda & Menta',
    primary: '#10b981',
    secondary: '#059669',
    gradient: true,
    mode: 'dark',
    bgMain: '#031a14',
    bgSecondary: '#02120e',
    cardBg: '#09362a',
    cardHover: '#0d4435',
    cardBorder: '#125844',
    cardInnerBg: '#0c3f31',
    textPrimary: '#ecfdf5',
    textSecondary: '#a7f3d0',
    textMuted: '#6ee7b7',
    accentBadgeBg: '#10b981',
    accentBadgeText: '#022c22',
    accentBadgeBorder: '#059669',
    dividerColor: '#0e4a3b',
  },
  {
    id: 'dark-rose',
    name: 'Dark Rose & Carmim',
    primary: '#f43f5e',
    secondary: '#be123c',
    gradient: true,
    mode: 'dark',
    bgMain: '#110c14',
    bgSecondary: '#09060b',
    cardBg: '#1e1424',
    cardHover: '#271a2e',
    cardBorder: '#3d2040',
    cardInnerBg: '#281730',
    textPrimary: '#fff1f2',
    textSecondary: '#fecdd3',
    textMuted: '#fda4af',
    accentBadgeBg: '#f43f5e',
    accentBadgeText: '#ffffff',
    accentBadgeBorder: '#e11d48',
    dividerColor: '#2e1530',
  },
  {
    id: 'roxo-neon',
    name: 'Roxo Real & Violeta',
    primary: '#8b5cf6',
    secondary: '#6366f1',
    gradient: true,
    mode: 'dark',
    bgMain: '#0f0d1c',
    bgSecondary: '#080710',
    cardBg: '#1a1633',
    cardHover: '#231e45',
    cardBorder: '#362c66',
    cardInnerBg: '#231d45',
    textPrimary: '#f5f3ff',
    textSecondary: '#ddd6fe',
    textMuted: '#c4b5fd',
    accentBadgeBg: '#8b5cf6',
    accentBadgeText: '#ffffff',
    accentBadgeBorder: '#7c3aed',
    dividerColor: '#28204d',
  },
  {
    id: 'carvao-laranja',
    name: 'Carvão & Laranja',
    primary: '#f97316',
    secondary: '#ea580c',
    gradient: true,
    mode: 'dark',
    bgMain: '#121214',
    bgSecondary: '#0a0a0c',
    cardBg: '#1c1c20',
    cardHover: '#24242a',
    cardBorder: '#36281e',
    cardInnerBg: '#261e18',
    textPrimary: '#fafafa',
    textSecondary: '#fed7aa',
    textMuted: '#fdba74',
    accentBadgeBg: '#f97316',
    accentBadgeText: '#ffffff',
    accentBadgeBorder: '#ea580c',
    dividerColor: '#27272a',
  },
];

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  if (!hex || typeof hex !== 'string') return { r: 5, g: 27, b: 66 };
  const cleanHex = hex.replace('#', '').trim();
  let fullHex = cleanHex;
  if (cleanHex.length === 3) {
    fullHex = cleanHex.split('').map(c => c + c).join('');
  }
  if (fullHex.length !== 6) return { r: 5, g: 27, b: 66 };
  const r = parseInt(fullHex.substring(0, 2), 16);
  const g = parseInt(fullHex.substring(2, 4), 16);
  const b = parseInt(fullHex.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return { r: 5, g: 27, b: 66 };
  return { r, g, b };
}

export function getLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

export function getContrastTextColor(hex: string): string {
  return getLuminance(hex) > 0.55 ? '#09090b' : '#ffffff';
}

export function hexToRgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Intelligent color generator that calculates an ultra-modern, harmonious theme
 * for ANY combination of primary and secondary colors.
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

  // 1. Check if an explicit preset match exists
  const matchedPreset = THEME_PRESETS.find(p => p.id === presetId) ||
    THEME_PRESETS.find(p => p.primary.toLowerCase() === pColor.toLowerCase() && p.secondary.toLowerCase() === sColor.toLowerCase());

  if (matchedPreset && (!primaryColor || primaryColor.toLowerCase() === matchedPreset.primary.toLowerCase())) {
    const isDark = matchedPreset.mode === 'dark';
    const primaryGrad = matchedPreset.gradient
      ? `linear-gradient(135deg, ${matchedPreset.primary} 0%, ${matchedPreset.secondary} 100%)`
      : matchedPreset.primary;
    const secondaryGrad = matchedPreset.gradient
      ? `linear-gradient(135deg, ${matchedPreset.secondary} 0%, ${matchedPreset.primary} 100%)`
      : matchedPreset.secondary;

    return {
      presetId: matchedPreset.id,
      mode: matchedPreset.mode,
      isDark,
      primaryColor: matchedPreset.primary,
      secondaryColor: matchedPreset.secondary,
      gradientEnabled: matchedPreset.gradient,
      primaryGradient: primaryGrad,
      secondaryGradient: secondaryGrad,
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
      locationPinBg: isDark ? hexToRgba(matchedPreset.primary, 0.2) : hexToRgba(matchedPreset.primary, 0.12),
      locationPinColor: matchedPreset.primary,
      tagPillBg: matchedPreset.primary,
      tagPillText: getContrastTextColor(matchedPreset.primary),
    };
  }

  // 2. Intelligent Dynamic Engine for ANY pair of Primary & Secondary Colors
  const lumP = getLuminance(pColor);
  const lumS = getLuminance(sColor);

  // If primary color is very light (like pure white, cream, or light pastels), render an ultra-clean Light Theme
  const isLightMode = lumP > 0.65 || pColor.toLowerCase() === '#ffffff' || pColor.toLowerCase() === '#fafafa';
  const isDark = !isLightMode;

  const primaryGrad = isGradient
    ? `linear-gradient(135deg, ${pColor} 0%, ${sColor} 100%)`
    : pColor;
  const secondaryGrad = isGradient
    ? `linear-gradient(135deg, ${sColor} 0%, ${pColor} 100%)`
    : sColor;

  const btnTextColor = getContrastTextColor(pColor);

  if (isLightMode) {
    // Dynamic Light Theme
    const accentColor = lumS < 0.6 ? sColor : '#dc2626';
    return {
      presetId: presetId || 'custom',
      mode: 'light',
      isDark: false,
      primaryColor: pColor,
      secondaryColor: sColor,
      gradientEnabled: isGradient,
      primaryGradient: primaryGrad,
      secondaryGradient: secondaryGrad,
      bgMain: '#fafafa',
      bgSecondary: '#f4f4f5',
      cardBg: '#ffffff',
      cardHover: hexToRgba(accentColor, 0.04),
      cardBorder: hexToRgba(accentColor, 0.14),
      cardInnerBg: hexToRgba(accentColor, 0.05),
      textPrimary: '#09090b',
      textSecondary: '#52525b',
      textMuted: '#71717a',
      primaryButtonBg: primaryGrad,
      primaryButtonText: btnTextColor,
      primaryButtonHover: sColor,
      accentBadgeBg: accentColor,
      accentBadgeText: '#ffffff',
      accentBadgeBorder: hexToRgba(accentColor, 0.3),
      dividerColor: hexToRgba(accentColor, 0.1),
      statusOpenBg: '#f0fdf4',
      statusOpenText: '#166534',
      statusOpenBorder: '#bbf7d0',
      statusClosedBg: '#f0f9ff',
      statusClosedText: '#0369a1',
      statusClosedBorder: '#bae6fd',
      curveFill: '#fafafa',
      locationPinBg: hexToRgba(accentColor, 0.12),
      locationPinColor: accentColor,
      tagPillBg: accentColor,
      tagPillText: '#ffffff',
    };
  }

  // Dynamic Dark Theme with harmonic tinted background
  // Calculates subtle hue and tone from primary & secondary colors for high-end richness
  const rgbP = hexToRgb(pColor);
  const rgbS = hexToRgb(sColor);

  // Background tint: ~3% primary blend with pure dark canvas
  const bgMainR = Math.min(22, Math.round(rgbP.r * 0.07 + 7));
  const bgMainG = Math.min(26, Math.round(rgbP.g * 0.07 + 9));
  const bgMainB = Math.min(38, Math.round(rgbP.b * 0.08 + 12));
  const bgMain = `rgb(${bgMainR}, ${bgMainG}, ${bgMainB})`;

  // Card background: slightly lighter tint (~8-12%)
  const cardR = Math.min(36, Math.round(rgbP.r * 0.12 + 15));
  const cardG = Math.min(42, Math.round(rgbP.g * 0.12 + 18));
  const cardB = Math.min(58, Math.round(rgbP.b * 0.14 + 24));
  const cardBg = `rgb(${cardR}, ${cardG}, ${cardB})`;

  // Inner card / hover
  const cardHoverR = Math.min(48, cardR + 6);
  const cardHoverG = Math.min(54, cardG + 6);
  const cardHoverB = Math.min(72, cardB + 8);
  const cardHover = `rgb(${cardHoverR}, ${cardHoverG}, ${cardHoverB})`;

  // Border: secondary color with subtle alpha for a high-end refined outline
  const cardBorder = hexToRgba(sColor, 0.22);
  const cardInnerBg = hexToRgba(sColor, 0.12);
  const dividerColor = hexToRgba(sColor, 0.15);

  return {
    presetId: presetId || 'custom',
    mode: 'dark',
    isDark: true,
    primaryColor: pColor,
    secondaryColor: sColor,
    gradientEnabled: isGradient,
    primaryGradient: primaryGrad,
    secondaryGradient: secondaryGrad,
    bgMain,
    bgSecondary: '#000000',
    cardBg,
    cardHover,
    cardBorder,
    cardInnerBg,
    textPrimary: '#f8fafc',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    primaryButtonBg: primaryGrad,
    primaryButtonText: btnTextColor,
    primaryButtonHover: sColor,
    accentBadgeBg: pColor,
    accentBadgeText: btnTextColor,
    accentBadgeBorder: hexToRgba(sColor, 0.4),
    dividerColor,
    statusOpenBg: 'rgba(16, 185, 129, 0.15)',
    statusOpenText: '#34d399',
    statusOpenBorder: 'rgba(52, 211, 153, 0.3)',
    statusClosedBg: 'rgba(56, 189, 248, 0.15)',
    statusClosedText: '#38bdf8',
    statusClosedBorder: 'rgba(56, 189, 248, 0.3)',
    curveFill: bgMain,
    locationPinBg: hexToRgba(pColor, 0.2),
    locationPinColor: pColor,
    tagPillBg: pColor,
    tagPillText: btnTextColor,
  };
}

export function compressImageFile(file: File, maxWidth = 900, maxHeight = 900, quality = 0.75): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => resolve('');
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => resolve((e.target?.result as string) || '');
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve((e.target?.result as string) || '');
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = (e.target?.result as string) || '';
    };
    reader.readAsDataURL(file);
  });
}

export function compressDataUrl(dataUrl: string, maxWidth = 800, maxHeight = 800, quality = 0.75): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith('data:image') || dataUrl.length < 80000) {
    return Promise.resolve(dataUrl);
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.onerror = () => resolve(dataUrl);
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = dataUrl;
  });
}

