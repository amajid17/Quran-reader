// src/components/TajweedLegendModal.tsx
//
// Full-screen reference guide for all tajweed rules, grouped by
// phonological family. Replaces the inline collapsible legend that used
// to live directly inside ReaderScreen.
//
// Colors here are the canonical alquran.cloud mapping (dark-bg adjusted),
// the same single source of truth used everywhere else in the app —
// NOT the placeholder tajweed-* tokens in the newer DESIGN.md export,
// which don't match what's actually rendered in the reference screenshots.

import React from 'react';
import { Modal, View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '../theme';

interface Rule {
  labelEn: string;
  labelAr: string;
  color: string;
}

interface Family {
  id: string;
  labelEn: string;
  labelAr: string;
  rules: Rule[];
}

const FAMILIES: Family[] = [
  {
    id: 'madd',
    labelEn: 'Prolongation (Madd)',
    labelAr: 'المد',
    rules: [
      { labelEn: 'Obligatory Prolongation',  labelAr: 'المد الواجب',  color: '#2144C1' },
      { labelEn: 'Permissible Prolongation', labelAr: 'المد الجائز', color: '#4050FF' },
    ],
  },
  {
    id: 'ghunnah',
    labelEn: 'Nasal (Ghunnah)',
    labelAr: 'الغنة',
    rules: [
      { labelEn: 'Nasalization', labelAr: 'غنة', color: '#FF7E1E' },
    ],
  },
  {
    id: 'ikhfa',
    labelEn: 'Concealment (Ikhfa)',
    labelAr: 'الإخفاء',
    rules: [
      { labelEn: 'Concealment', labelAr: 'إخفاء', color: '#9400A8' },
    ],
  },
  {
    id: 'idgham',
    labelEn: 'Merging (Idgham)',
    labelAr: 'الإدغام',
    rules: [
      { labelEn: 'Merging with Nasalization',    labelAr: 'إدغام بغنة',      color: '#22C49A' },
      { labelEn: 'Merging without Nasalization', labelAr: 'إدغام بغير غنة', color: '#2ECC00' },
    ],
  },
  {
    id: 'iqlab',
    labelEn: 'Conversion (Iqlab)',
    labelAr: 'الإقلاب',
    rules: [
      { labelEn: 'Conversion', labelAr: 'إقلاب', color: '#26BFFD' },
    ],
  },
  {
    id: 'qalqalah',
    labelEn: 'Echo (Qalqalah)',
    labelAr: 'القلقلة',
    rules: [
      { labelEn: 'Echo', labelAr: 'قلقلة', color: '#DD0008' },
    ],
  },
  {
    id: 'silent',
    labelEn: 'Silent / Structural',
    labelAr: 'حروف صامتة',
    rules: [
      { labelEn: 'Silent Letter', labelAr: 'حرف صامت', color: '#AAAAAA' },
    ],
  },
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function TajweedLegendModal({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerSide} />
          <Text style={styles.headerTitle}>Tajweed Rules</Text>
          <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={8}>
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.section }}
        >
          <Text style={styles.intro}>
            A reference guide for the phonological rules of Quranic recitation,
            categorized by their ruling families.
          </Text>

          {FAMILIES.map(family => (
            <View key={family.id}>
              {/* Family header row */}
              <View style={styles.familyHeader}>
                <Text style={styles.familyLabelEn}>{family.labelEn.toUpperCase()}</Text>
                <Text style={styles.familyLabelAr}>{family.labelAr}</Text>
              </View>
              <View style={styles.familyDivider} />

              {/* Rule rows */}
              {family.rules.map(rule => (
                <View key={rule.labelEn} style={styles.ruleRow}>
                  <View style={[styles.dot, { backgroundColor: rule.color }]} />
                  <Text style={styles.ruleLabelEn}>{rule.labelEn}</Text>
                  <Text style={styles.ruleLabelAr}>{rule.labelAr}</Text>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screen,
    paddingBottom: Spacing.default,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.bdr,
  },
  headerSide: {
    width: 24,
  },
  headerTitle: {
    ...Typography.englishPrimary,
    fontSize: 17,
    fontWeight: '700',
    color: Colors.txt,
    flex: 1,
    textAlign: 'center',
  },
  closeBtn: {
    width: 24,
    alignItems: 'flex-end',
  },
  closeBtnText: {
    ...Typography.englishPrimary,
    color: Colors.dim,
  },
  intro: {
    ...Typography.englishSecondary,
    color: Colors.dim,
    lineHeight: 20,
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.section,
    paddingBottom: Spacing.relaxed,
  },
  familyHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.section,
    paddingBottom: Spacing.tight,
  },
  familyLabelEn: {
    ...Typography.englishMicro,
    color: Colors.gold,
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  familyLabelAr: {
    ...Typography.englishMicro,
    fontFamily: 'ScheherazadeNew',
    fontSize: 13,
    color: Colors.dim,
    writingDirection: 'rtl',
  },
  familyDivider: {
    height: 0.5,
    backgroundColor: Colors.bdr,
    marginHorizontal: Spacing.screen,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.relaxed,
    paddingHorizontal: Spacing.screen,
    paddingVertical: Spacing.relaxed,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  ruleLabelEn: {
    ...Typography.englishPrimary,
    fontWeight: '400',
    color: Colors.txt,
    flex: 1,
  },
  ruleLabelAr: {
    ...Typography.arabicUI,
    fontSize: 20,
    color: Colors.ar,
    writingDirection: 'rtl',
  },
});
