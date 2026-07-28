// src/components/AyahItem.tsx

import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

// ── Robust import for rn-tajweed-verse ───────────────────────────────────────
// The package may export as default, named, or the module root itself.
// This pattern works regardless of the export style.
const _rntv = require('rn-tajweed-verse');
const TajweedVerse: React.ComponentType<any> | null =
  _rntv?.TajweedVerse ??   // named export  { TajweedVerse }
  _rntv?.TajweedText  ??   // alt name      { TajweedText  }
  _rntv?.default      ??   // default export
  (typeof _rntv === 'function' ? _rntv : null); // module IS the component

import { Colors, Spacing } from '../theme';
import type { Ayah } from '../types';
import { tajweedConfig } from '../utils/tajweedConfig';
import { stripTajweed } from '../data/quranData';
import { useSettings } from '../context/SettingsContext';
import AyahBadge from './AyahBadge';

interface AyahItemProps {
  ayah:         Ayah;
  isBookmarked: boolean;
  isSelected:   boolean;
  onLongPress:  () => void;
}

export default function AyahItem({
  ayah,
  isBookmarked,
  isSelected,
  onLongPress,
}: AyahItemProps) {
  const { fontSize } = useSettings();

  // Merge user font-size preference into the static tajweed colour config
  const config = useMemo(() => ({
    ...tajweedConfig,
    style: {
      ...tajweedConfig.style,
      fontSize,
      lineHeight: Math.round(fontSize * 2),
    },
  }), [fontSize]);

  // Fallback style used when TajweedVerse is unavailable
  const fallbackStyle = useMemo(() => ({
    fontFamily:       'ScheherazadeNew' as const,
    fontSize,
    lineHeight:       Math.round(fontSize * 2),
    color:            Colors.ar,
    writingDirection: 'rtl'  as const,
    textAlign:        'right' as const,
  }), [fontSize]);

  return (
    <Pressable
      onLongPress={onLongPress}
      delayLongPress={400}
      style={[styles.container, isSelected && styles.containerSelected]}
      accessibilityLabel={`Ayah ${ayah.numberInSurah}`}
      accessibilityHint="Long press to bookmark, copy, or share"
    >
      {/* Render tajweed-coloured text if the component loaded correctly,
          otherwise fall back to plain Arabic text so the app stays functional */}
      {TajweedVerse ? (
        <TajweedVerse verse={ayah.text} config={config} />
      ) : (
        <Text style={fallbackStyle}>
          {stripTajweed(ayah.text)}
        </Text>
      )}

      <View style={styles.badgeRow}>
        <AyahBadge
          number={ayah.numberInSurah}
          asArabicIndic={true}
          isBookmarked={isBookmarked}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.relaxed,
    paddingLeft:     3,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  containerSelected: {
    borderLeftColor: Colors.gold,
    backgroundColor: Colors.s1,
  },
  badgeRow: {
    alignItems: 'flex-end',
    marginTop:  Spacing.tight,
  },
});
