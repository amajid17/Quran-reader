// src/screens/BookmarksScreen.tsx

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ListRenderItemInfo } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import type { Bookmark } from '../types';
import { bookmarkService } from '../data/bookmarkService';

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1)   return 'Just now';
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

export default function BookmarksScreen() {
  const insets     = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { Colors, Spacing, Radius } = useTheme();
  const styles = useMemo(() => makeStyles(Colors, Spacing, Radius), [Colors, Spacing, Radius]);

  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  useEffect(() => {
    const unsubscribe = bookmarkService.subscribe(list => {
      setBookmarks([...list].sort((a, b) => b.savedAt - a.savedAt));
    });
    return unsubscribe;
  }, []);

  const handleOpen = useCallback((b: Bookmark) => {
    navigation.navigate('Quran', {
      screen: 'Reader',
      params: { surahNumber: b.surahNumber, scrollToAyah: b.ayahNumber },
    });
  }, [navigation]);

  const handleDelete  = useCallback((b: Bookmark) => {
    bookmarkService.remove(b.surahNumber, b.ayahNumber);
  }, []);

  const handleOpenSettings = useCallback(() => {
    navigation.getParent()?.navigate('Settings');
  }, [navigation]);

  const handleBrowse = useCallback(() => {
    navigation.navigate('Quran');
  }, [navigation]);

  function renderItem({ item }: ListRenderItemInfo<Bookmark>) {
    return (
      <Swipeable
        overshootRight={false}
        renderRightActions={() => (
          <Pressable style={styles.deleteAction} onPress={() => handleDelete(item)}>
            <Ionicons name="trash-outline" size={20} color="#fff" />
          </Pressable>
        )}
      >
        <Pressable
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          onPress={() => handleOpen(item)}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardSurahAr}>{item.surahNameArabic}</Text>
            <Ionicons name="bookmark" size={16} color={Colors.gold} />
          </View>
          <Text style={styles.cardRef}>
            {item.surahNameEn} · {item.surahNumber}:{item.ayahNumber}
          </Text>
          <Text style={styles.cardText} numberOfLines={2}>
            {item.textPreview}
          </Text>
          <Text style={styles.cardTime}>{timeAgo(item.savedAt)}</Text>
        </Pressable>
      </Swipeable>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>المحفوظات</Text>
          <Text style={styles.headerSub}>
            {bookmarks.length} saved {bookmarks.length === 1 ? 'ayah' : 'ayahs'}
          </Text>
        </View>
        <Pressable onPress={handleOpenSettings} hitSlop={8}>
          <Ionicons name="settings-outline" size={20} color={Colors.gold} />
        </Pressable>
      </View>

      {bookmarks.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="bookmark-outline" size={32} color={Colors.gold} />
          </View>
          <Text style={styles.emptyHeading}>No Bookmarks Yet</Text>
          <Text style={styles.emptyHint}>
            Long press any ayah while reading to save it here for quick access.
          </Text>
          <Pressable style={styles.browseBtn} onPress={handleBrowse}>
            <Text style={styles.browseBtnText}>Browse Quran</Text>
            <Ionicons name="arrow-forward" size={14} color={Colors.gold} />
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={bookmarks}
          renderItem={renderItem}
          keyExtractor={item => `${item.surahNumber}:${item.ayahNumber}`}
          contentContainerStyle={{
            padding: Spacing.section, gap: Spacing.default, paddingBottom: 104,
          }}
          showsVerticalScrollIndicator={false}
        />
      )}
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
      flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
      paddingHorizontal: Spacing.screen, paddingBottom: Spacing.default,
      borderBottomWidth: 0.5, borderBottomColor: Colors.bdr, backgroundColor: Colors.s1,
    },
    headerTitle: { fontFamily: 'ScheherazadeNew', fontSize: 20, color: Colors.txt, writingDirection: 'rtl' },
    headerSub:   { fontFamily: 'NotoSansArabic', fontSize: 11, color: Colors.dim, marginTop: 3 },

    card: {
      backgroundColor: Colors.card, borderRadius: Radius.card,
      borderWidth: 1, borderColor: Colors.bdr,
      padding: Spacing.section, gap: 4,
    },
    cardPressed:  { borderColor: Colors.g2 },
    cardHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    cardSurahAr:  { fontFamily: 'ScheherazadeNew', fontSize: 16, color: Colors.gold, writingDirection: 'rtl' },
    cardRef:      { fontFamily: 'NotoSansArabic', fontSize: 10, color: Colors.dim },
    cardText:     {
      fontFamily: 'ScheherazadeNew', fontSize: 18, color: Colors.ar,
      writingDirection: 'rtl', textAlign: 'right', lineHeight: 32, marginTop: 4,
    },
    cardTime:     { fontFamily: 'NotoSansArabic', fontSize: 10, color: Colors.dim, marginTop: 4 },

    deleteAction: {
      backgroundColor: '#DD0008', justifyContent: 'center', alignItems: 'center',
      width: 72, borderRadius: Radius.card, marginLeft: Spacing.default,
    },

    empty: {
      flex: 1, alignItems: 'center', justifyContent: 'center',
      paddingHorizontal: Spacing.screen + Spacing.section, gap: Spacing.default,
    },
    emptyIcon: {
      width: 80, height: 80, borderRadius: 40,
      backgroundColor: Colors.s1, alignItems: 'center', justifyContent: 'center',
      marginBottom: Spacing.default,
    },
    emptyHeading: { fontFamily: 'NotoSansArabic', fontSize: 20, fontWeight: '700', color: Colors.txt },
    emptyHint:    { fontFamily: 'NotoSansArabic', fontSize: 11, color: Colors.dim, textAlign: 'center', lineHeight: 18 },
    browseBtn: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.default,
      borderWidth: 1, borderColor: Colors.bdr, borderRadius: Radius.badge,
      paddingHorizontal: Spacing.section, paddingVertical: Spacing.relaxed,
      marginTop: Spacing.default,
    },
    browseBtnText: { fontFamily: 'NotoSansArabic', fontSize: 15, fontWeight: '600', color: Colors.gold },
  });
}
