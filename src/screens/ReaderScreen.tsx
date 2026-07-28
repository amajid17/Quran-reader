// src/screens/ReaderScreen.tsx

import React, {
  useEffect, useRef, useState, useCallback, useMemo, memo,
} from 'react';
import {
  View, Text, FlatList, Pressable, StyleSheet,
  Animated, LayoutChangeEvent, ListRenderItemInfo, ViewToken,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import TajweedVerse from 'rn-tajweed-verse';
import { useTheme } from '../theme/ThemeContext';
import type { QuranStackParamList, Ayah, AppSettings } from '../types';
import { DEFAULT_SETTINGS } from '../types';
import { readSurah, getSurahMeta, surahToJuz, stripTajweed } from '../data/quranData';
import { bookmarkService } from '../data/bookmarkService';
import { settingsService, scaleToFontSize } from '../data/settingsService';
import AyahActionSheet, { AyahActionSheetTarget } from '../components/AyahActionSheet';
import TajweedLegendModal from '../components/TajweedLegendModal';
import type { ColorScheme } from '../theme';

type Props = NativeStackScreenProps<QuranStackParamList, 'Reader'>;

const toArabicIndic = (n: number): string =>
  String(n).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);

const BISMILLAH        = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';
const SCROLL_THRESHOLD = 8;

// ── AyahItem ──────────────────────────────────────────────────────
// Defined OUTSIDE ReaderScreen so it is never re-created on parent renders.
// React.memo ensures it only re-renders when its own props change.
// This means long-pressing ayah 5 (changing sheetTarget) only re-renders
// ayah 5, not all 286 ayahs in Al-Baqarah.
interface AyahItemProps {
  item:                Ayah;
  prevJuz:             number | null;
  bookmarked:          boolean;
  isSelected:          boolean;
  tajweedConfig:       object;
  translationFontSize: number;
  styles:              ReturnType<typeof makeStyles>;
  Colors:              ColorScheme;
  onLongPress:         (ayah: Ayah) => void;
}

const AyahItem = memo(function AyahItem({
  item, prevJuz, bookmarked, isSelected,
  tajweedConfig, translationFontSize, styles, Colors, onLongPress,
}: AyahItemProps) {
  const isJuzBoundary = prevJuz !== null && item.juz !== prevJuz;

  return (
    <View>
      {isJuzBoundary && (
        <View style={styles.juzBoundary}>
          <View style={styles.juzBoundaryLine} />
          <View style={styles.juzBoundaryBadge}>
            <Text style={styles.juzBoundaryAr}>جزء {toArabicIndic(item.juz)}</Text>
            <Text style={styles.juzBoundaryEn}>Juz {item.juz}</Text>
          </View>
          <View style={styles.juzBoundaryLine} />
        </View>
      )}
      <Pressable
        onLongPress={() => onLongPress(item)}
        delayLongPress={350}
        style={[styles.ayahCard, isSelected && styles.ayahCardSelected]}
      >
        <TajweedVerse verse={item.text} config={tajweedConfig} />
        {item.translation && (
          <Text style={[styles.translation, { fontSize: translationFontSize }]}>
            {item.translation}
          </Text>
        )}
        <View style={styles.ayahFooter}>
          <View style={[styles.ayahBadge, bookmarked && styles.ayahBadgeBookmarked]}>
            <Text style={styles.ayahBadgeText}>{toArabicIndic(item.numberInSurah)}</Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
});

// ── ReaderScreen ──────────────────────────────────────────────────
export default function ReaderScreen({ route, navigation }: Props) {
  const { surahNumber, scrollToAyah } = route.params;
  const insets = useSafeAreaInsets();
  const { Colors, Spacing, Radius } = useTheme();
  const styles = useMemo(() => makeStyles(Colors, Spacing, Radius), [Colors, Spacing, Radius]);

  const standardTabBarStyle = useMemo(() => ({
    backgroundColor: Colors.s1,
    borderTopColor:  Colors.bdr,
    borderTopWidth:  0.5,
  }), [Colors.s1, Colors.bdr]);

  const listRef = useRef<FlatList>(null);

  const [legendModalOpen, setLegendModalOpen] = useState(false);
  const [bookmarkedAyahs, setBookmarkedAyahs] = useState<Set<number>>(new Set());
  const [sheetTarget, setSheetTarget]         = useState<AyahActionSheetTarget | null>(null);
  const [headerH, setHeaderH]                 = useState(130);
  const [navBarH, setNavBarH]                 = useState(80);
  const [settings, setSettings]               = useState<AppSettings>(DEFAULT_SETTINGS);

  const headerAnim      = useRef(new Animated.Value(1)).current;
  const navAnim         = useRef(new Animated.Value(1)).current;
  const lastScrollY     = useRef(0);
  const lastWrittenAyah = useRef<number>(-1);

  const surahData = readSurah(surahNumber);
  const meta      = getSurahMeta(surahNumber);
  const juz       = surahToJuz(surahNumber);
  const hasPrev   = surahNumber > 1;
  const hasNext   = surahNumber < 114;

  const arabicFontSize      = scaleToFontSize(settings.fontSizeScale);
  const arabicLineHeight    = arabicFontSize * 2;
  const translationFontSize = Math.max(12, Math.round(arabicFontSize * 0.46));

  // ── TajweedVerse config ─────────────────────────────────────────
  const tajweedConfig = useMemo(() => {
    const off = Colors.ar;
    const r   = settings.tajweedRules;
    const tj  = Colors.tajweed;
    return {
      style: {
        fontFamily: 'ScheherazadeNew',
        fontSize:   arabicFontSize,
        lineHeight: arabicLineHeight,
        color:      Colors.ar,
        direction:  'rtl',
      },
      tajweed: {
        ham_wasl:          { style: { color: r.silent    ? tj.ham_wasl          : off }, onPress: null },
        slnt:              { style: { color: r.silent    ? tj.slnt              : off }, onPress: null },
        madda_normal:      { style: { color: r.madd      ? tj.madda_normal      : off }, onPress: null },
        madda_permissible: { style: { color: r.madd      ? tj.madda_permissible : off }, onPress: null },
        madda_necessary:   { style: { color: r.madd      ? tj.madda_necessary   : off }, onPress: null },
        madda_obligatory:  { style: { color: r.madd      ? tj.madda_obligatory  : off }, onPress: null },
        qlq:               { style: { color: r.qalqalah  ? tj.qlq               : off }, onPress: null },
        ikhf_shfw:         { style: { color: r.ikhfa     ? tj.ikhf_shfw         : off }, onPress: null },
        ikhf:              { style: { color: r.ikhfa     ? tj.ikhf              : off }, onPress: null },
        idghm_shfw:        { style: { color: r.idgham    ? tj.idghm_shfw        : off }, onPress: null },
        iqlb:              { style: { color: r.iqlab     ? tj.iqlb              : off }, onPress: null },
        idgh_ghn:          { style: { color: r.idgham    ? tj.idgh_ghn          : off }, onPress: null },
        idgh_w_ghn:        { style: { color: r.idgham    ? tj.idgh_w_ghn        : off }, onPress: null },
        idgh_mus:          { style: { color: r.idgham    ? tj.idgh_mus          : off }, onPress: null },
        ghn:               { style: { color: r.ghunnah   ? tj.ghn               : off }, onPress: null },
      },
    };
  }, [settings.tajweedRules, arabicFontSize, arabicLineHeight, Colors]);

  // ── Settings subscription ───────────────────────────────────────
  useEffect(() => {
    return settingsService.subscribe(setSettings);
  }, []);

  // ── Tab bar: hide on enter, restore on leave ────────────────────
  useEffect(() => {
    const parent = navigation.getParent();
    parent?.setOptions({ tabBarStyle: { display: 'none' } });
    return () => {
      parent?.setOptions({ tabBarStyle: standardTabBarStyle });
    };
  }, [navigation, standardTabBarStyle]);

  // ── Header title + settings gear ───────────────────────────────
  useEffect(() => {
    navigation.setOptions({
      title: meta.name,
      headerStyle:     { backgroundColor: Colors.s1 },
      headerTintColor: Colors.gold,
      headerRight: () => (
        <Pressable
          hitSlop={8}
          onPress={() => (navigation as any).getParent()?.getParent()?.navigate('Settings')}
        >
          <Ionicons name="settings-outline" size={20} color={Colors.gold} />
        </Pressable>
      ),
    });
  }, [navigation, meta.name, Colors]);

  // ── Scroll to ayah on mount ─────────────────────────────────────
  useEffect(() => {
    if (!scrollToAyah || scrollToAyah <= 1) return;
    setTimeout(() => {
      listRef.current?.scrollToIndex({ index: scrollToAyah - 1, animated: false });
    }, 300);
  }, [scrollToAyah]);

  // ── Bookmark subscription ───────────────────────────────────────
  useEffect(() => {
    return bookmarkService.subscribe(all => {
      setBookmarkedAyahs(new Set(
        all.filter(b => b.surahNumber === surahNumber).map(b => b.ayahNumber)
      ));
    });
  }, [surahNumber]);

  // ── Last-read tracking ──────────────────────────────────────────
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (!viewableItems.length) return;
      const first = viewableItems[0].item as Ayah;
      if (first.numberInSurah === lastWrittenAyah.current) return;
      lastWrittenAyah.current = first.numberInSurah;
      bookmarkService.setLastRead(surahNumber, first.numberInSurah, meta.englishName, meta.name);
    }
  ).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  // ── Scroll chrome ───────────────────────────────────────────────
  const springTo = useCallback((anim: Animated.Value, toValue: number) => {
    Animated.spring(anim, { toValue, useNativeDriver: true, tension: 120, friction: 14 }).start();
  }, []);

  const handleScroll = useCallback((e: any) => {
    const y    = e.nativeEvent.contentOffset.y;
    const diff = y - lastScrollY.current;
    lastScrollY.current = y;
    if (y < 10)                        { springTo(headerAnim, 1); springTo(navAnim, 1); return; }
    if (diff > SCROLL_THRESHOLD)       { springTo(headerAnim, 0); springTo(navAnim, 0); }
    else if (diff < -SCROLL_THRESHOLD) { springTo(headerAnim, 1); springTo(navAnim, 1); }
  }, [headerAnim, navAnim, springTo]);

  const headerTranslateY = useMemo(() =>
    headerAnim.interpolate({ inputRange:[0,1], outputRange:[-(headerH+10),0], extrapolate:'clamp' }),
    [headerAnim, headerH]);

  const navTranslateY = useMemo(() =>
    navAnim.interpolate({ inputRange:[0,1], outputRange:[navBarH+insets.bottom+20,0], extrapolate:'clamp' }),
    [navAnim, navBarH, insets.bottom]);

  const onHeaderLayout = useCallback((e: LayoutChangeEvent) => setHeaderH(e.nativeEvent.layout.height), []);
  const onNavLayout    = useCallback((e: LayoutChangeEvent) => setNavBarH(e.nativeEvent.layout.height), []);

  const goToSurah = useCallback((num: number) => {
    navigation.replace('Reader', { surahNumber: num });
  }, [navigation]);

  const handleLongPress = useCallback((ayah: Ayah) => {
    setSheetTarget({
      surahNumber, surahNameAr: meta.name, surahNameEn: meta.englishName,
      ayahNumber: ayah.numberInSurah, plainText: stripTajweed(ayah.text),
      bookmarked: bookmarkedAyahs.has(ayah.numberInSurah),
    });
  }, [surahNumber, meta, bookmarkedAyahs]);

  const handleToggleBookmark = useCallback((target: AyahActionSheetTarget) => {
    if (target.bookmarked) {
      bookmarkService.remove(target.surahNumber, target.ayahNumber);
    } else {
      bookmarkService.add({
        surahNumber: target.surahNumber, ayahNumber: target.ayahNumber,
        surahNameArabic: target.surahNameAr, surahNameEn: target.surahNameEn,
        textPreview: target.plainText.slice(0, 60),
      });
    }
  }, []);

  const showBismillah = settings.showBismillah && surahNumber !== 1 && surahNumber !== 9;

  // ── renderItem — useCallback so FlatList only re-registers when
  // dependencies actually change. AyahItem (React.memo) handles the
  // fine-grained per-item bailout.
  const renderItem = useCallback(({ item, index }: ListRenderItemInfo<Ayah>) => {
    return (
      <AyahItem
        item={item}
        prevJuz={index > 0 ? surahData.ayahs[index - 1].juz : null}
        bookmarked={bookmarkedAyahs.has(item.numberInSurah)}
        isSelected={sheetTarget?.ayahNumber === item.numberInSurah && sheetTarget !== null}
        tajweedConfig={tajweedConfig}
        translationFontSize={translationFontSize}
        styles={styles}
        Colors={Colors}
        onLongPress={handleLongPress}
      />
    );
  }, [bookmarkedAyahs, sheetTarget, tajweedConfig, translationFontSize, styles, Colors, handleLongPress, surahData.ayahs]);

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={surahData.ayahs}
        keyExtractor={item => String(item.number)}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        ListHeaderComponent={
          showBismillah ? <Text style={styles.bismillah}>{BISMILLAH}</Text> : null
        }
        contentContainerStyle={{
          paddingTop:    headerH,
          paddingBottom: navBarH + insets.bottom + 20,
        }}
        onScrollToIndexFailed={info => {
          listRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: false });
          setTimeout(() => {
            listRef.current?.scrollToIndex({ index: info.index, animated: false });
          }, 150);
        }}
      />

      <Animated.View
        style={[styles.headerContainer, { transform: [{ translateY: headerTranslateY }] }]}
        onLayout={onHeaderLayout}
      >
        <View style={styles.surahHeader}>
          <Text style={styles.surahNameAr}>{meta.name}</Text>
          <Text style={styles.surahMeta}>
            {meta.englishName} · {meta.englishNameTranslation} · Juz {juz}
          </Text>
        </View>
        <Pressable style={styles.legendToggle} onPress={() => setLegendModalOpen(true)}>
          <Text style={styles.legendToggleLabel}>Tajweed guide</Text>
          <Ionicons name="information-circle-outline" size={16} color={Colors.dim} />
        </Pressable>
      </Animated.View>

      <Animated.View
        style={[styles.navBar, { bottom: insets.bottom, transform: [{ translateY: navTranslateY }] }]}
        onLayout={onNavLayout}
      >
        <Pressable
          style={({ pressed }) => [styles.navBtn, !hasPrev && styles.navBtnDisabled, pressed && hasPrev && styles.navBtnPressed]}
          onPress={() => hasPrev && goToSurah(surahNumber - 1)}
          disabled={!hasPrev}
        >
          <Text style={styles.navIco}>←</Text>
          <View style={styles.navInfo}>
            <Text style={styles.navLabel}>Previous</Text>
            {hasPrev && <Text style={styles.navName}>{getSurahMeta(surahNumber - 1).englishName}</Text>}
          </View>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.navBtn, styles.navBtnRight, !hasNext && styles.navBtnDisabled, pressed && hasNext && styles.navBtnPressed]}
          onPress={() => hasNext && goToSurah(surahNumber + 1)}
          disabled={!hasNext}
        >
          <View style={styles.navInfo}>
            <Text style={[styles.navLabel, { textAlign: 'right' }]}>Next</Text>
            {hasNext && <Text style={[styles.navName, { textAlign: 'right' }]}>{getSurahMeta(surahNumber + 1).englishName}</Text>}
          </View>
          <Text style={styles.navIco}>→</Text>
        </Pressable>
      </Animated.View>

      <AyahActionSheet
        target={sheetTarget}
        onClose={() => setSheetTarget(null)}
        onToggleBookmark={handleToggleBookmark}
      />
      <TajweedLegendModal
        visible={legendModalOpen}
        onClose={() => setLegendModalOpen(false)}
      />
    </View>
  );
}

// ── Style factory ───────────────────────────────────────────────────────────
function makeStyles(
  Colors: ReturnType<typeof useTheme>['Colors'],
  Spacing: ReturnType<typeof useTheme>['Spacing'],
  Radius: ReturnType<typeof useTheme>['Radius'],
) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    headerContainer: {
      position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
      shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
    },
    surahHeader: {
      alignItems: 'center', paddingVertical: Spacing.loose,
      paddingHorizontal: Spacing.screen, borderBottomWidth: 0.5,
      borderBottomColor: Colors.bdr, backgroundColor: Colors.s1,
    },
    surahNameAr:       { fontFamily: 'ScheherazadeNew', fontSize: 28, color: Colors.ar, writingDirection: 'rtl' },
    surahMeta:         { fontFamily: 'NotoSansArabic', fontSize: 11, color: Colors.dim, marginTop: Spacing.default, textAlign: 'center' },
    legendToggle:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.screen, paddingVertical: Spacing.default, borderBottomWidth: 0.5, borderBottomColor: Colors.bdr, backgroundColor: Colors.s1 },
    legendToggleLabel: { fontFamily: 'NotoSansArabic', fontSize: 10, color: Colors.dim, textTransform: 'uppercase', letterSpacing: 0.5 },
    bismillah:         { fontFamily: 'ScheherazadeNew', fontSize: 28, color: Colors.ar, textAlign: 'center', writingDirection: 'rtl', paddingVertical: Spacing.loose, paddingHorizontal: Spacing.screen, borderBottomWidth: 0.5, borderBottomColor: Colors.bdr },
    juzBoundary:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.screen, paddingVertical: Spacing.section, gap: Spacing.default },
    juzBoundaryLine:   { flex: 1, height: 0.5, backgroundColor: Colors.gold, opacity: 0.35 },
    juzBoundaryBadge:  { alignItems: 'center', paddingHorizontal: Spacing.relaxed, paddingVertical: Spacing.tight, backgroundColor: Colors.card, borderRadius: Radius.button, borderWidth: 1, borderColor: Colors.g2 },
    juzBoundaryAr:     { fontFamily: 'ScheherazadeNew', fontSize: 14, color: Colors.gold, writingDirection: 'rtl' },
    juzBoundaryEn:     { fontFamily: 'NotoSansArabic', fontSize: 10, color: Colors.dim, textTransform: 'uppercase', letterSpacing: 0.5 },
    ayahCard:          { paddingHorizontal: Spacing.screen, paddingTop: Spacing.loose, paddingBottom: Spacing.section, borderBottomWidth: 0.5, borderBottomColor: Colors.bdr, borderLeftWidth: 3, borderLeftColor: 'transparent' },
    ayahCardSelected:  { borderLeftColor: Colors.gold, backgroundColor: Colors.s1 },
    translation:       { fontFamily: 'NotoSansArabic', fontWeight: '400', color: Colors.dim, marginTop: Spacing.default, lineHeight: 20 },
    ayahFooter:        { flexDirection: 'row', justifyContent: 'flex-start', marginTop: Spacing.default },
    ayahBadge:         { width: 36, height: 36, borderRadius: Radius.badge, borderWidth: 1.5, borderColor: Colors.g2, alignItems: 'center', justifyContent: 'center' },
    ayahBadgeBookmarked: { backgroundColor: 'rgba(200,164,74,0.12)' },
    ayahBadgeText:     { fontFamily: 'NotoSansArabic', fontSize: 11, fontWeight: '600', color: Colors.gold },
    navBar:            { position: 'absolute', left: 0, right: 0, flexDirection: 'row', gap: Spacing.default, padding: Spacing.default, borderTopWidth: 0.5, borderTopColor: Colors.bdr, backgroundColor: Colors.s1 },
    navBtn:            { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.default, backgroundColor: Colors.card, borderRadius: Radius.card, borderWidth: 1, borderColor: Colors.bdr, padding: Spacing.relaxed },
    navBtnRight:       { flexDirection: 'row-reverse' },
    navBtnPressed:     { borderColor: Colors.g2 },
    navBtnDisabled:    { opacity: 0.25 },
    navIco:            { fontFamily: 'NotoSansArabic', fontSize: 15, fontWeight: '600', color: Colors.gold },
    navInfo:           { flex: 1 },
    navLabel:          { fontFamily: 'NotoSansArabic', fontSize: 10, color: Colors.dim, textTransform: 'uppercase', letterSpacing: 0.5 },
    navName:           { fontFamily: 'NotoSansArabic', fontSize: 11, color: Colors.txt, marginTop: 2 },
  });
}
