// src/components/AyahActionSheet.tsx
//
// Long-press action sheet shown for a single ayah. Slides up from the
// bottom over a dark scrim. Three actions: Bookmark, Copy, Share.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal, View, Text, Pressable, StyleSheet,
  Animated, Easing, Dimensions, Share,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography, Spacing, Radius, Motion } from '../theme';
import { useTheme } from '../theme/ThemeContext';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const COPY_RESET_MS = 1500;

export interface AyahActionSheetTarget {
  surahNumber: number;
  surahNameAr: string;
  surahNameEn: string;
  ayahNumber:  number;
  plainText:   string;
  bookmarked:  boolean;
}

interface Props {
  target:           AyahActionSheetTarget | null;
  onClose:          () => void;
  onToggleBookmark: (target: AyahActionSheetTarget) => void;
}

export default function AyahActionSheet({ target, onClose, onToggleBookmark }: Props) {
  const insets       = useSafeAreaInsets();
  const { Colors, mode } = useTheme();
  const styles       = useMemo(() => makeStyles(Colors), [mode]);

  const translateY   = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const scrimOpacity = useRef(new Animated.Value(0)).current;

  const [copied, setCopied]   = useState(false);
  const copyResetTimer        = useRef<ReturnType<typeof setTimeout> | null>(null);

  const visible = target !== null;

  useEffect(() => {
    if (visible) setCopied(false);
  }, [visible, target?.ayahNumber]);

  useEffect(() => {
    return () => {
      if (copyResetTimer.current) clearTimeout(copyResetTimer.current);
    };
  }, []);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(scrimOpacity, {
          toValue: 1, duration: Motion.state,
          easing: Easing.out(Easing.ease), useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0, duration: Motion.state,
          easing: Easing.out(Easing.ease), useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  function handleClose() {
    Animated.parallel([
      Animated.timing(scrimOpacity, {
        toValue: 0, duration: Motion.state,
        easing: Easing.out(Easing.ease), useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT, duration: Motion.state,
        easing: Easing.out(Easing.ease), useNativeDriver: true,
      }),
    ]).start(() => {
      setCopied(false);
      onClose();
    });
  }

  async function handleCopy() {
    if (!target) return;
    await Clipboard.setStringAsync(target.plainText);
    setCopied(true);
    if (copyResetTimer.current) clearTimeout(copyResetTimer.current);
    copyResetTimer.current = setTimeout(() => {
      handleClose();
    }, COPY_RESET_MS);
  }

  async function handleShare() {
    if (!target) return;
    const reference = `${target.surahNameEn} ${target.surahNumber}:${target.ayahNumber}`;
    await Share.share({ message: `${target.plainText}\n\n— ${reference}` });
    handleClose();
  }

  function handleBookmark() {
    if (!target) return;
    onToggleBookmark(target);
    handleClose();
  }

  if (!target) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <Pressable style={styles.scrimTouch} onPress={handleClose}>
        <Animated.View style={[styles.scrim, { opacity: scrimOpacity }]} />
      </Pressable>

      <Animated.View
        style={[
          styles.sheet,
          { paddingBottom: insets.bottom + Spacing.section, transform: [{ translateY }] },
        ]}
      >
        <View style={styles.handle} />

        <View style={styles.refRow}>
          <Text style={styles.refText}>
            {target.surahNameEn.toUpperCase()} {target.surahNumber}:{target.ayahNumber}
          </Text>
          <View style={styles.numChip}>
            <Text style={styles.numChipText}>{target.ayahNumber}</Text>
          </View>
        </View>

        <Text style={styles.preview} numberOfLines={3}>
          {target.plainText}
        </Text>

        <View style={styles.divider} />

        {/* Bookmark */}
        <Pressable
          style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
          onPress={handleBookmark}
        >
          <Text style={[styles.actionIcon, target.bookmarked && styles.actionIconActive]}>
            {target.bookmarked ? '★' : '☆'}
          </Text>
          <Text style={styles.actionLabel}>
            {target.bookmarked ? 'Remove Bookmark' : 'Bookmark Ayah'}
          </Text>
        </Pressable>

        {/* Copy */}
        <Pressable
          style={({ pressed }) => [
            styles.action,
            pressed && !copied && styles.actionPressed,
            copied && styles.actionCopied,
          ]}
          onPress={handleCopy}
          disabled={copied}
        >
          <Text style={[styles.actionIcon, copied && styles.actionIconCopied]}>
            {copied ? '✓' : '⧉'}
          </Text>
          <Text style={[styles.actionLabel, copied && styles.actionLabelCopied]}>
            {copied ? 'Copied!' : 'Copy Text'}
          </Text>
        </Pressable>

        {/* Share */}
        <Pressable
          style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
          onPress={handleShare}
        >
          <Text style={styles.actionIcon}>↗</Text>
          <Text style={styles.actionLabel}>Share Ayah</Text>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

function makeStyles(Colors: ReturnType<typeof useTheme>['Colors']) {
  return StyleSheet.create({
    scrimTouch: { ...StyleSheet.absoluteFillObject },
    // Scrim stays dark in both themes — it overlays the screen content
    // and a dark translucent overlay is correct on both light and dark.
    scrim:      { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
    sheet: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      backgroundColor: Colors.card,
      borderTopLeftRadius: Radius.card + 4, borderTopRightRadius: Radius.card + 4,
      paddingTop: Spacing.default, paddingHorizontal: Spacing.section,
      borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, borderColor: Colors.bdr,
    },
    handle:            { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.bdr, alignSelf: 'center', marginBottom: Spacing.section },
    refRow:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: Spacing.default },
    refText:           { ...Typography.englishMicro, color: Colors.dim, letterSpacing: 0.5 },
    numChip:           { width: 24, height: 24, borderRadius: Radius.badge, backgroundColor: Colors.s2, alignItems: 'center', justifyContent: 'center' },
    numChipText:       { ...Typography.englishMicro, color: Colors.gold },
    preview:           { ...Typography.arabicReader, fontSize: 22, lineHeight: 40, color: Colors.ar, writingDirection: 'rtl', textAlign: 'right', marginTop: Spacing.relaxed },
    divider:           { height: 1, backgroundColor: Colors.bdr, marginVertical: Spacing.section },
    action:            { flexDirection: 'row', alignItems: 'center', gap: Spacing.section, paddingVertical: Spacing.relaxed },
    actionPressed:     { opacity: 0.6 },
    actionCopied:      { backgroundColor: 'rgba(200,164,74,0.08)', borderRadius: Radius.button },
    actionIcon:        { width: 24, textAlign: 'center', fontSize: 18, color: Colors.gold },
    actionIconActive:  { color: Colors.gold },
    actionIconCopied:  { color: Colors.gold },
    actionLabel:       { ...Typography.englishPrimary, color: Colors.txt },
    actionLabelCopied: { color: Colors.gold },
  });
}
