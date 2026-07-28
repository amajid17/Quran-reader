// src/screens/HomeScreen.tsx

import React, { useMemo, useState, useCallback } from 'react';
import {
  View, Text, FlatList, Pressable, TextInput,
  StyleSheet, ListRenderItemInfo,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeContext';
import type { QuranStackParamList, SurahMeta } from '../types';
import { getAllSurahMeta } from '../data/quranData';
import { bookmarkService } from '../data/bookmarkService';
import type { LastRead } from '../data/bookmarkService';

type Props = NativeStackScreenProps<QuranStackParamList, 'Home'>;

const ITEM_HEIGHT = 76;

export default function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { Colors, Typography, Spacing, Radius } = useTheme();
  const styles = useMemo(() => makeStyles(Colors, Spacing, Radius), [Colors, Spacing, Radius]);

  const [query, setQuery]       = useState('');
  const [lastRead, setLastRead] = useState<LastRead | null>(null);
  const allSurahs = useMemo(() => getAllSurahMeta(), []);

  useFocusEffect(useCallback(() => {
    bookmarkService.getLastRead().then(setLastRead);
  }, []));

  const filtered = useMemo(() => {
    if (!query.trim()) return allSurahs;
    const q = query.toLowerCase();
    return allSurahs.filter(s =>
      s.englishName.toLowerCase().includes(q) ||
      s.englishNameTranslation.toLowerCase().includes(q) ||
      s.name.includes(query) ||
      String(s.number).startsWith(q)
    );
  }, [query, allSurahs]);

  const openSurah = useCallback((surahNumber: number, scrollToAyah?: number) => {
    navigation.navigate('Reader', { surahNumber, scrollToAyah });
  }, [navigation]);

  const openSettings = useCallback(() => {
    (navigation as any).getParent()?.getParent()?.navigate('Settings');
  }, [navigation]);

  const getItemLayout = useCallback((_: any, index: number) => ({
    length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index,
  }), []);

  function renderItem({ item }: ListRenderItemInfo<SurahMeta>) {
    return (
      <Pressable
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        onPress={() => openSurah(item.number)}
      >
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.number}</Text>
        </View>
        <View style={styles.body}>
          <Text style={styles.nameEn}>{item.englishName}</Text>
          <Text style={styles.meaning}>{item.englishNameTranslation}</Text>
          <Text style={styles.meta}>
            {item.revelationType} · {item.numberOfAyahs} ayahs · Juz {item.juzNumber}
          </Text>
        </View>
        <Text style={styles.nameAr}>{item.name}</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.default }]}>
        <View style={styles.headerSide} />
        <Text style={styles.headerTitle}>القرآن الكريم</Text>
        <Pressable style={styles.headerSide} onPress={openSettings} hitSlop={8}>
          <Ionicons name="settings-outline" size={20} color={Colors.gold} />
        </Pressable>
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, meaning or number…"
          placeholderTextColor={Colors.dim}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => String(item.number)}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        initialNumToRender={20}
        windowSize={5}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.section }}
        ListHeaderComponent={
          lastRead && !query ? (
            <Pressable
              style={styles.continueChip}
              onPress={() => openSurah(lastRead.surahNumber, lastRead.ayahNumber)}
            >
              <View style={styles.continueLeft}>
                <Ionicons name="play-circle" size={18} color={Colors.gold} />
                <View>
                  <Text style={styles.continueLabel}>Continue reading</Text>
                  <Text style={styles.continueMeta}>
                    {lastRead.surahNameEn} · Ayah {lastRead.ayahNumber}
                  </Text>
                </View>
              </View>
              <Ionicons name="arrow-forward" size={14} color={Colors.gold} />
            </Pressable>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No results for "{query}"</Text>
          </View>
        }
      />
    </View>
  );
}

function makeStyles(
  Colors: ReturnType<typeof useTheme>['Colors'],
  Spacing: ReturnType<typeof useTheme>['Spacing'],
  Radius: ReturnType<typeof useTheme>['Radius'],
) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: Spacing.screen, paddingBottom: Spacing.default,
      borderBottomWidth: 0.5, borderBottomColor: Colors.bdr, backgroundColor: Colors.s1,
    },
    headerSide:  { width: 28, alignItems: 'flex-end' },
    headerTitle: {
      fontFamily: 'ScheherazadeNew', fontSize: 22, color: Colors.txt,
      writingDirection: 'rtl', textAlign: 'center', flex: 1,
    },
    searchWrap: {
      paddingHorizontal: Spacing.screen, paddingVertical: Spacing.default,
      borderBottomWidth: 0.5, borderBottomColor: Colors.bdr,
      backgroundColor: Colors.bg,
    },
    searchInput: {
      backgroundColor: Colors.s2, borderWidth: 1, borderColor: Colors.bdr,
      borderRadius: Radius.button, color: Colors.txt,
      paddingHorizontal: Spacing.section, paddingVertical: Spacing.relaxed,
      fontFamily: 'NotoSansArabic', fontSize: 15,
    },
    continueChip: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      margin: Spacing.section, marginBottom: Spacing.default,
      backgroundColor: Colors.card,
      borderWidth: 1, borderColor: Colors.g2, borderRadius: Radius.card,
      paddingHorizontal: Spacing.section, paddingVertical: Spacing.relaxed,
    },
    continueLeft:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.relaxed },
    continueLabel: { fontFamily: 'NotoSansArabic', fontSize: 10, color: Colors.gold, textTransform: 'uppercase', letterSpacing: 0.5 },
    continueMeta:  { fontFamily: 'NotoSansArabic', fontSize: 15, fontWeight: '600', color: Colors.txt, marginTop: 2 },
    row: {
      flexDirection: 'row', alignItems: 'center',
      height: ITEM_HEIGHT, paddingHorizontal: Spacing.screen,
      borderBottomWidth: 0.5, borderBottomColor: Colors.bdr, gap: Spacing.relaxed,
      backgroundColor: Colors.bg,
    },
    rowPressed: { backgroundColor: Colors.s2 },
    badge: {
      width: 42, height: 42, borderRadius: Radius.badge,
      borderWidth: 1.5, borderColor: Colors.g2, backgroundColor: Colors.card,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    badgeText: { fontFamily: 'NotoSansArabic', fontSize: 11, fontWeight: '600', color: Colors.gold },
    body:    { flex: 1, gap: 2 },
    nameEn:  { fontFamily: 'NotoSansArabic', fontSize: 15, fontWeight: '600', color: Colors.txt },
    meaning: { fontFamily: 'NotoSansArabic', fontSize: 11, color: Colors.dim, fontStyle: 'italic' },
    meta:    { fontFamily: 'NotoSansArabic', fontSize: 10, color: Colors.dim },
    nameAr:  { fontFamily: 'ScheherazadeNew', fontSize: 20, color: Colors.ar, writingDirection: 'rtl', flexShrink: 0 },
    empty:     { paddingTop: 60, alignItems: 'center' },
    emptyText: { fontFamily: 'NotoSansArabic', fontSize: 11, color: Colors.dim },
  });
}
