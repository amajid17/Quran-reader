// src/screens/SettingsScreen.tsx

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, Switch, Alert, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeContext';
import type { RootStackParamList, AppSettings } from '../types';
import { DEFAULT_SETTINGS } from '../types';
import { settingsService, scaleToFontSize } from '../data/settingsService';
import { bookmarkService }   from '../data/bookmarkService';
import { completionService } from '../data/completionService';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const TAJWEED_ROWS: { key: keyof AppSettings['tajweedRules']; label: string; color: string }[] = [
  { key: 'madd',     label: 'Madd (Prolongation)',    color: '#7B9FFF' },
  { key: 'ghunnah',  label: 'Ghunnah (Nasalization)', color: '#FF7E1E' },
  { key: 'ikhfa',    label: 'Ikhfa (Concealment)',    color: '#9400A8' },
  { key: 'idgham',   label: 'Idgham (Merging)',       color: '#22C49A' },
  { key: 'iqlab',    label: 'Iqlab (Conversion)',     color: '#26BFFD' },
  { key: 'qalqalah', label: 'Qalqalah (Echo)',        color: '#DD0008' },
  { key: 'silent',   label: 'Silent / Structural',    color: '#AAAAAA' },
];

export default function SettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  // mode is a primitive string — reliable as a useMemo dependency.
  // Spacing and Radius are static constants that never change identity,
  // but are passed through so makeStyles has full access to them.
  const { Colors, Spacing, Radius, mode, setMode } = useTheme();
  const styles = useMemo(() => makeStyles(Colors, Spacing, Radius), [mode]);

  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const unsubscribe = settingsService.subscribe(setSettings);
    return unsubscribe;
  }, []);

  const previewSize = scaleToFontSize(settings.fontSizeScale);

  function handleClearBookmarks() {
    Alert.alert(
      'Clear all bookmarks?',
      'This removes every saved ayah. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => bookmarkService.clearAll() },
      ]
    );
  }

  function handleClearLastRead() {
    Alert.alert(
      'Clear last read position?',
      'The app will no longer remember where you left off.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => bookmarkService.clearLastRead() },
      ]
    );
  }

  function handleClearProgress() {
    Alert.alert(
      'Clear reading progress?',
      'This removes all surah completion marks from the home list. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => completionService.clear() },
      ]
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.headerSide} onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={Colors.gold} />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.section }}
      >
        {/* ── APPEARANCE ─────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>Appearance</Text>
        <View style={styles.card}>
          <View style={styles.fontSizeRow}>
            <Text style={styles.rowLabel}>Arabic Font Size</Text>
            <Text style={[styles.fontPreview, { fontSize: previewSize * 0.55 }]}>
              بِسْمِ اللَّهِ
            </Text>
          </View>
          <View style={styles.sliderRow}>
            <Text style={styles.sliderA}>A</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              value={settings.fontSizeScale}
              onValueChange={v => settingsService.update({ fontSizeScale: v })}
              minimumTrackTintColor={Colors.gold}
              maximumTrackTintColor={Colors.bdr}
              thumbTintColor={Colors.gold}
            />
            <Text style={styles.sliderALg}>A</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>UI Theme</Text>
              <Text style={styles.rowSub}>
                {mode === 'dark' ? 'Deep Night is active.' : 'Parchment Light is active.'}
                {' '}Switch between the two reading palettes.
              </Text>
            </View>
            <Switch
              value={mode === 'dark'}
              onValueChange={isDark => setMode(isDark ? 'dark' : 'light')}
              trackColor={{ true: Colors.g2, false: Colors.bdr }}
              thumbColor={Colors.gold}
            />
          </View>
        </View>

        {/* ── TAJWEED RULES ──────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>Tajweed Rules</Text>
        <View style={styles.card}>
          {TAJWEED_ROWS.map((row, i) => (
            <View key={row.key}>
              <View style={styles.toggleRow}>
                <View style={[styles.dot, { backgroundColor: row.color }]} />
                <Text style={[styles.rowLabel, { flex: 1 }]}>{row.label}</Text>
                <Switch
                  value={settings.tajweedRules[row.key]}
                  onValueChange={v => settingsService.updateTajweedRule(row.key, v)}
                  trackColor={{ true: Colors.g2, false: Colors.bdr }}
                  thumbColor={settings.tajweedRules[row.key] ? Colors.gold : Colors.dim}
                />
              </View>
              {i < TAJWEED_ROWS.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {/* ── READING EXPERIENCE ─────────────────────────────────── */}
        <Text style={styles.sectionLabel}>Reading Experience</Text>
        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <Text style={[styles.rowLabel, { flex: 1 }]}>Show Bismillah</Text>
            <Switch
              value={settings.showBismillah}
              onValueChange={v => settingsService.update({ showBismillah: v })}
              trackColor={{ true: Colors.g2, false: Colors.bdr }}
              thumbColor={settings.showBismillah ? Colors.gold : Colors.dim}
            />
          </View>
          <View style={styles.divider} />
          <Pressable
            style={styles.toggleRow}
            onPress={() => Alert.alert(
              'More languages coming soon',
              'Only English (Sahih International) is bundled right now.'
            )}
          >
            <Text style={[styles.rowLabel, { flex: 1 }]}>Translation Language</Text>
            <Text style={styles.rowValue}>English</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.dim} />
          </Pressable>
        </View>

        {/* ── DATA & STORAGE ─────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>Data & Storage</Text>
        <View style={styles.card}>
          <Pressable style={styles.dangerRow} onPress={handleClearBookmarks}>
            <Text style={styles.dangerLabel}>Clear Bookmarks</Text>
            <Ionicons name="trash-outline" size={18} color="#DD0008" />
          </Pressable>

          <View style={styles.divider} />

          <Pressable style={styles.dangerRow} onPress={handleClearLastRead}>
            <Text style={styles.dangerLabel}>Clear Last Read Position</Text>
            <Ionicons name="time-outline" size={18} color="#DD0008" />
          </Pressable>

          <View style={styles.divider} />

          <Pressable style={styles.dangerRow} onPress={handleClearProgress}>
            <Text style={styles.dangerLabel}>Clear Reading Progress</Text>
            <Ionicons name="checkmark-circle-outline" size={18} color="#DD0008" />
          </Pressable>
        </View>

        {/* ── FOOTER ─────────────────────────────────────────────── */}
        <View style={styles.footer}>
          <View style={styles.footerIcon}>
            <Ionicons name="book-outline" size={22} color={Colors.gold} />
          </View>
          <Text style={styles.footerTitle}>Quran App</Text>
          <Text style={styles.footerVersion}>Version 1.0.0 (Sacred Focus)</Text>
          <Text style={styles.footerNote}>Typography provided by Google Fonts.</Text>
          <Text style={styles.footerNote}>Arabic Typeface: Scheherazade New</Text>
          <Text style={styles.footerNote}>UI Typeface: Noto Sans Arabic</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function makeStyles(
  Colors: ReturnType<typeof useTheme>['Colors'],
  Spacing: ReturnType<typeof useTheme>['Spacing'],
  Radius:  ReturnType<typeof useTheme>['Radius'],
) {
  return StyleSheet.create({
    container:    { flex: 1, backgroundColor: Colors.bg },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: Spacing.screen, paddingBottom: Spacing.default,
      borderBottomWidth: 0.5, borderBottomColor: Colors.bdr,
    },
    headerSide:  { width: 32 },
    headerTitle: { fontFamily: 'NotoSansArabic', fontSize: 17, fontWeight: '700', color: Colors.txt },

    sectionLabel: {
      fontFamily: 'NotoSansArabic', fontSize: 10, color: Colors.gold,
      fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase',
      paddingHorizontal: Spacing.screen,
      paddingTop: Spacing.section, paddingBottom: Spacing.default,
    },
    card: {
      marginHorizontal: Spacing.screen,
      backgroundColor: Colors.s1,
      borderRadius: Radius.card,
      borderWidth: 1, borderColor: Colors.bdr,
      paddingHorizontal: Spacing.section, paddingVertical: Spacing.relaxed,
    },
    divider: { height: 0.5, backgroundColor: Colors.bdr, marginVertical: Spacing.relaxed },

    fontSizeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    fontPreview: { fontFamily: 'ScheherazadeNew', color: Colors.ar, writingDirection: 'rtl' },
    sliderRow:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.default, marginTop: Spacing.relaxed },
    slider:      { flex: 1, height: 32 },
    sliderA:     { fontFamily: 'NotoSansArabic', fontSize: 12, color: Colors.dim },
    sliderALg:   { fontFamily: 'NotoSansArabic', fontSize: 18, color: Colors.dim },

    toggleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.relaxed, paddingVertical: Spacing.tight },
    rowLabel:  { fontFamily: 'NotoSansArabic', fontSize: 15, color: Colors.txt, fontWeight: '400' },
    rowSub:    { fontFamily: 'NotoSansArabic', fontSize: 11, color: Colors.dim, marginTop: 2, maxWidth: 240, lineHeight: 16 },
    rowValue:  { fontFamily: 'NotoSansArabic', fontSize: 11, color: Colors.dim },
    dot:       { width: 10, height: 10, borderRadius: 5 },

    dangerRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.relaxed },
    dangerLabel: { fontFamily: 'NotoSansArabic', fontSize: 15, fontWeight: '400', color: '#DD0008' },

    footer: { alignItems: 'center', paddingTop: Spacing.loose + Spacing.section, paddingHorizontal: Spacing.screen, gap: 2 },
    footerIcon: {
      width: 48, height: 48, borderRadius: 24,
      backgroundColor: Colors.s1, alignItems: 'center', justifyContent: 'center',
      marginBottom: Spacing.default,
    },
    footerTitle:   { fontFamily: 'NotoSansArabic', fontSize: 15, color: Colors.txt },
    footerVersion: { fontFamily: 'NotoSansArabic', fontSize: 11, color: Colors.dim, marginBottom: Spacing.relaxed },
    footerNote:    { fontFamily: 'NotoSansArabic', fontSize: 10, color: Colors.dim, opacity: 0.7 },
  });
}
