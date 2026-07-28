// src/screens/SearchScreen.tsx
//
// Real-time surah search. Filters all 114 surahs by:
//   - English transliterated name (e.g. "Al-Baqarah")
//   - English translation (e.g. "The Cow")
//   - Arabic name (for Arabic keyboard users)
//   - Surah number (type "2" → Al-Baqarah)
//
// Tapping a result navigates to the Reader at that surah's first ayah.

import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  ListRenderItemInfo,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Colors, Typography, Spacing, Radius } from '../theme';
import type { RootTabParamList, QuranStackParamList, SurahMeta } from '../types';
import { getAllSurahMeta } from '../data/quranData';
import SurahRow, { SURAH_ROW_HEIGHT } from '../components/SurahRow';

type Props = CompositeScreenProps<
  BottomTabScreenProps<RootTabParamList, 'Search'>,
  NativeStackScreenProps<QuranStackParamList>
>;

const ALL_SURAHS = getAllSurahMeta(); // resolved once at module level

const Separator = () => <View style={styles.separator} />;

function EmptyResults({ query }: { query: string }) {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No results for "{query}"</Text>
      <Text style={styles.emptySubtitle}>
        Try the English name, translation, or surah number
      </Text>
    </View>
  );
}

export default function SearchScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);

  const results = useMemo<SurahMeta[]>(() => {
    const q = query.trim();
    if (!q) return ALL_SURAHS;

    const lower = q.toLowerCase();
    const num   = parseInt(q, 10);

    return ALL_SURAHS.filter(s =>
      s.englishName.toLowerCase().includes(lower)          ||
      s.englishNameTranslation.toLowerCase().includes(lower) ||
      s.name.includes(q)                                   || // Arabic
      (!isNaN(num) && s.number === num)
    );
  }, [query]);

  const getItemLayout = useCallback(
    (_: ArrayLike<SurahMeta> | null | undefined, index: number) => ({
      length: SURAH_ROW_HEIGHT,
      offset: SURAH_ROW_HEIGHT * index,
      index,
    }),
    []
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<SurahMeta>) => (
      <SurahRow
        surah={item}
        onPress={() =>
          navigation.navigate('Quran', {
            screen: 'Reader',
            params: { surahNumber: item.number, scrollToAyah: 1 },
          })
        }
      />
    ),
    [navigation]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Search bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder="Search surahs…"
            placeholderTextColor={Colors.dim}
            returnKeyType="search"
            clearButtonMode="while-editing"   // iOS only
            autoCorrect={false}
            autoCapitalize="none"
            selectionColor={Colors.gold}
          />
          {/* Android clear button */}
          {Platform.OS === 'android' && query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Text style={styles.clearBtn}>✕</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Results count */}
      {query.trim().length > 0 && (
        <Text style={styles.resultCount}>
          {results.length === 1
            ? '1 surah'
            : `${results.length} surahs`}
        </Text>
      )}

      {/* Results list */}
      <FlatList
        data={results}
        renderItem={renderItem}
        keyExtractor={s => s.number.toString()}
        getItemLayout={query.trim() ? undefined : getItemLayout}
        ItemSeparatorComponent={Separator}
        ListEmptyComponent={
          query.trim() ? <EmptyResults query={query.trim()} /> : null
        }
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={
          results.length === 0 ? styles.emptyList : styles.listContent
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: Colors.bg,
  },
  searchContainer: {
    paddingHorizontal: Spacing.screen,
    paddingVertical:   Spacing.default,
    backgroundColor:   Colors.bg,
  },
  searchBar: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: Colors.s1,
    borderRadius:    Radius.button,
    borderWidth:     1,
    borderColor:     Colors.bdr,
    paddingHorizontal: Spacing.relaxed,
    height:          44,
    gap:             Spacing.default,
  },
  searchIcon: {
    fontSize:   16,
    lineHeight: 20,
  },
  input: {
    flex:       1,
    ...Typography.englishPrimary,
    color:      Colors.txt,
    // Remove default padding on Android so text aligns with icon
    paddingVertical: 0,
  },
  clearBtn: {
    ...Typography.englishSecondary,
    color: Colors.dim,
  },
  resultCount: {
    ...Typography.englishMicro,
    color:             Colors.dim,
    paddingHorizontal: Spacing.screen,
    paddingBottom:     Spacing.tight,
  },
  separator: {
    height:          StyleSheet.hairlineWidth,
    backgroundColor: Colors.bdr,
    marginLeft:      72,
  },
  listContent: {
    paddingBottom: Spacing.loose,
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex:              1,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: Spacing.loose,
    gap:               Spacing.default,
  },
  emptyTitle: {
    ...Typography.englishPrimary,
    color:     Colors.dim,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...Typography.englishSecondary,
    color:     Colors.dim,
    textAlign: 'center',
  },
});
