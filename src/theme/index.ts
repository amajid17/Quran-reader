// src/theme/index.ts
//
// Single source of truth for all visual values. Two full color schemes —
// DarkColors (default, "Deep Night") and LightColors ("Parchment Light") —
// are exported separately. `Colors` remains exported as DarkColors for
// backward compatibility: any screen still using the static import
// continues to render in dark mode unchanged until migrated to useTheme().

// ── Dark scheme ("Deep Night") ──────────────────────────────────────────────
export const DarkColors = {
  bg:   '#070B14',
  s1:   '#0B1120',
  s2:   '#10182A',
  card: '#121A2C',
  bdr:  '#1B2B44',
  gold: '#C8A44A',
  g2:   '#8A6A28',
  txt:  '#C8D8EC',
  ar:   '#EEE4CC',
  dim:  '#506070',
  tajweed: {
    ham_wasl:          '#AAAAAA',
    slnt:              '#AAAAAA',
    laam_shamsiyah:    '#AAAAAA',
    madda_normal:      '#7B9FFF',
    madda_permissible: '#4050FF',
    madda_necessary:   '#4466DD',
    madda_obligatory:  '#2144C1',
    qlq:               '#DD0008',
    ikhf_shfw:         '#D500B7',
    ikhf:              '#9400A8',
    idghm_shfw:        '#58B800',
    iqlb:              '#26BFFD',
    idgh_ghn:          '#22C49A',
    idgh_w_ghn:        '#2ECC00',
    idgh_mus:          '#A1A1A1',
    idgh_mut:          '#A1A1A1',
    ghn:               '#FF7E1E',
  },
} as const;

// ── Light scheme ("Parchment Light") ────────────────────────────────────────
export const LightColors = {
  bg:   '#FAF6EE',
  s1:   '#F2EBDA',
  s2:   '#E8DFC8',
  card: '#FFFDF7',
  bdr:  '#D9CFB5',
  gold: '#C8A44A',
  g2:   '#8A6A28',
  txt:  '#2C2A22',
  ar:   '#1A1810',
  dim:  '#7A715C',
  tajweed: {
    ham_wasl:          '#8A8A8A',
    slnt:              '#8A8A8A',
    laam_shamsiyah:    '#8A8A8A',
    madda_normal:      '#3D5FDB',
    madda_permissible: '#2A3FB8',
    madda_necessary:   '#1A1F8C',
    madda_obligatory:  '#16297A',
    qlq:               '#C2000A',
    ikhf_shfw:         '#A8008F',
    ikhf:              '#7A0089',
    idghm_shfw:        '#3F8C00',
    iqlb:              '#0086A8',
    idgh_ghn:          '#0E7A5C',
    idgh_w_ghn:        '#1F8C00',
    idgh_mus:          '#7A7A7A',
    idgh_mut:          '#7A7A7A',
    ghn:               '#D86A00',
  },
} as const;

export type ColorScheme = typeof DarkColors;

export function getColors(mode: 'dark' | 'light'): ColorScheme {
  return mode === 'light' ? LightColors : DarkColors;
}

// Backward-compat default — screens not yet migrated to useTheme() always
// render dark until migrated.
export const Colors = DarkColors;

// ── Tab bar style factory ────────────────────────────────────────────────────
// Returns the correct tab bar style for the active color scheme.
// Used by AppNavigator (tab bar config) and ReaderScreen (restores the
// tab bar on unmount). Both call this with the live Colors from useTheme()
// so the style is always consistent with the active theme.
export function makeTabBarStyle(colors: ColorScheme) {
  return {
    backgroundColor: colors.s1,
    borderTopColor:  colors.bdr,
    borderTopWidth:  0.5,
  };
}

// ── FLOATING_TAB_STYLE ───────────────────────────────────────────────────────
// Kept for backward compatibility while ReaderScreen is migrated.
// DO NOT use this in new code — call makeTabBarStyle(Colors) instead.
// This will be removed once ReaderScreen uses useTheme() for its restore.
export const FLOATING_TAB_STYLE = {
  position:        'absolute' as const,
  bottom:          24,
  left:            16,
  right:           16,
  borderRadius:    20,
  height:          64,
  backgroundColor: DarkColors.s1,
  borderTopWidth:  0,
  shadowColor:     '#000',
  shadowOffset:    { width: 0, height: 8 },
  shadowOpacity:   0.4,
  shadowRadius:    16,
  elevation:       16,
} as const;

export const Typography = {
  arabicReader:       { fontFamily: 'ScheherazadeNew', fontSize: 26, lineHeight: 52 },
  arabicUI:           { fontFamily: 'ScheherazadeNew', fontSize: 20, lineHeight: 26 },
  arabicBismillah:    { fontFamily: 'ScheherazadeNew', fontSize: 28, lineHeight: 28 },
  englishPrimary:     { fontFamily: 'NotoSansArabic',  fontSize: 15, fontWeight: '600' as const },
  englishSecondary:   { fontFamily: 'NotoSansArabic',  fontSize: 11, fontWeight: '400' as const },
  englishMicro:       { fontFamily: 'NotoSansArabic',  fontSize: 10, fontWeight: '400' as const },
  ayahBadge:          { fontFamily: 'NotoSansArabic',  fontSize: 11, fontWeight: '600' as const },
  onboardingHeadline: { fontFamily: 'Literata-Bold',   fontSize: 32, lineHeight: 40 },
} as const;

export const Spacing = {
  tight:   4,
  default: 8,
  relaxed: 12,
  section: 16,
  loose:   20,
  screen:  20,
} as const;

export const Radius = {
  button: 8,
  card:   12,
  badge:  999,
} as const;

export const Motion = {
  micro:  100,
  state:  150,
  reader: 0,
} as const;
