// src/screens/JuzScreen.tsx

import React, { useMemo, useCallback } from 'react';
import {
  View, Text, FlatList, Pressable, StyleSheet, ListRenderItemInfo,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, Radius } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import type { JuzEntry } from '../types';
import { getJuzList, getSurahMeta } from '../data/quranData';

const toAr = (n: number) => String(n).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);

const TRANSLITERATIONS: Record<number, string> = {
  1:  'Alif Lam Mim',        2:  'Sayaqul',
  3:  'Tilkal Rusul',        4:  'Lan Tanalu',
  5:  'Wal Mohsanat',        6:  'La Yuhibbullah',
  7:  'Wa Iza Samiu',        8:  'Wa Law Annana',
  9:  'Qalal Malao',         10: 'Wa Alamu',
  11: 'Yaatazeroon',         12: 'Wa Ma Min Dabbah',
  13: "Wa Ma Ubarri'u",      14: 'Rubama',
  15: 'Subhanallazi',        16: 'Qal Alam',
  17: 'Iqtaraba',            18: 'Qad Aflaha',
  19: 'Wa Qalallazina',      20: 'Amman Khalaq',
  21: 'Utlu Ma Uhiya',       22: 'Wa Man Yaqnut',
  23: 'Wa Mali',             24: 'Faman Azlam',
  25: 'Ilayhi Yurad',        26: 'Ha Meem',
  27: 'Qala Fama Khatbukum', 28: 'Qad Sami Allah',
  29: 'Tabarakallazi',       30: 'Amma Yatasaeloon',
};

const ROW_HEIGHT = 88;

export default function JuzScreen() {
  const insets     = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { Colors, mode } = useTheme();
  const styles = useMemo(() => makeStyles(Colors), [mode]);

  const juzList = useMemo(() => getJuzList(), []);

  const openSettings = useCallback(() => {
    navigation.getParent()?.navigate('Settings');
  }, [navigation]);

  function handlePress(item: JuzEntry) {
    navigation.navigate('Quran', {
      screen: 'Reader',
      params: { surahNumber: item.startSurah, scrollToAyah: item.startAyah },
    });
  }

  function renderItem({ item }: ListRenderItemInfo<JuzEntry>) {
    const endSurahName = getSurahMeta(item.endSurah).englishName;
    const range = `${item.surahName} ${item.startSurah}:${item.startAyah} – ${endSurahName} ${item.endSurah}:${item.endAyah}`;

    return (
      <Pressable
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        onPress={() => handlePress(item)}
      >
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{toAr(item.number)}</Text>
        </View>
        <View style={styles.centre}>
          <Text style={styles.juzTitle}>Juz {item.number}</Text>
          <Text style={styles.range} numberOfLines={2}>{range}</Text>
        </View>
        <View style={styles.rightBlock}>
          <Text style={styles.arabicName}>{item.arabicName}</Text>
          <Text style={styles.transliteration}>{TRANSLITERATIONS[item.number]}</Text>
        </View>
        <Ionicons name="chevron-forward" size={14} color={Colors.dim} />
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.default }]}>
        <View style={styles.headerSide} />
        <Text style={styles.headerTitle}>الأجزاء الثلاثون</Text>
        <Pressable style={styles.headerSide} onPress={openSettings} hitSlop={8}>
          <Ionicons name="settings-outline" size={20} color={Colors.gold} />
        </Pressable>
      </View>

      <FlatList
        data={juzList}
        keyExtractor={item => String(item.number)}
        renderItem={renderItem}
        getItemLayout={(_, index) => ({ length: ROW_HEIGHT, offset: ROW_HEIGHT * index, index })}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 104 }}
      />
    </View>
  );
}

function makeStyles(Colors: ReturnType<typeof useTheme>['Colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },

    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: Spacing.screen, paddingBottom: Spacing.default,
      borderBottomWidth: 0.5, borderBottomColor: Colors.bdr, backgroundColor: Colors.s1,
    },
    headerSide:  { width: 28, alignItems: 'flex-end' },
    headerTitle: {
      ...Typography.arabicUI, fontSize: 22, color: Colors.txt,
      writingDirection: 'rtl', textAlign: 'center', flex: 1,
    },

    row: {
      flexDirection: 'row', alignItems: 'center',
      height: ROW_HEIGHT, paddingHorizontal: Spacing.screen,
      borderBottomWidth: 0.5, borderBottomColor: Colors.bdr,
      gap: Spacing.relaxed,
    },
    rowPressed: { backgroundColor: Colors.s2 },

    badge: {
      width: 44, height: 44, borderRadius: Radius.badge,
      backgroundColor: Colors.gold,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    badgeText: {
      fontFamily: 'NotoSansArabic', fontSize: 18, fontWeight: '700',
      color: Colors.bg, lineHeight: 30,
    },

    centre:   { flex: 1, gap: 3 },
    juzTitle: { ...Typography.englishPrimary, color: Colors.gold },
    range:    { ...Typography.englishMicro, color: Colors.dim, lineHeight: 14 },

    rightBlock:      { alignItems: 'flex-end', gap: 2 },
    arabicName:      { ...Typography.arabicUI, fontSize: 18, color: Colors.ar, writingDirection: 'rtl' },
    transliteration: { ...Typography.englishMicro, color: Colors.dim },
  });
}
