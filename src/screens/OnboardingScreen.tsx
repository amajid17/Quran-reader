// src/screens/OnboardingScreen.tsx
//
// One-time welcome screen, shown only on the user's first launch.
// On mount, checks AsyncStorage — if onboarding was already completed in
// a previous session, immediately redirects to MainTabs with no visible
// flash of this content. Otherwise renders the full welcome flow.

import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors, Typography, Spacing, Radius } from '../theme';
import type { RootStackParamList } from '../types';
import { hasCompletedOnboarding, markOnboardingComplete } from '../data/onboardingService';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const FEATURES = [
  {
    icon: <MaterialCommunityIcons name="wifi-off" size={20} color={Colors.gold} />,
    title: 'Zero Network',
    desc: 'Read anywhere, completely offline.',
  },
  {
    icon: <MaterialCommunityIcons name="hand-heart-outline" size={20} color={Colors.gold} />,
    title: 'Zero Cost',
    desc: 'A waqf for the Ummah, free forever.',
  },
  {
    icon: <Ionicons name="scan-outline" size={20} color={Colors.gold} />,
    title: 'Pure Focus',
    desc: 'Minimalist design for deep reflection.',
  },
];

export default function OnboardingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    hasCompletedOnboarding().then(done => {
      if (done) {
        navigation.replace('MainTabs');
      } else {
        setChecked(true);
      }
    });
  }, [navigation]);

  async function handleGetStarted() {
    await markOnboardingComplete();
    navigation.replace('MainTabs');
  }

  // Nothing visible while the AsyncStorage check resolves — this read is
  // near-instant, so there's no meaningful loading state to show.
  if (!checked) return <View style={styles.container} />;

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + Spacing.loose, paddingBottom: insets.bottom + Spacing.section },
      ]}
    >
      {/* Central badge — gold diamond motif on a dark glowing circle */}
      <View style={styles.badgeWrap}>
        <View style={styles.badgeCircle}>
          <LinearGradient
            colors={['rgba(232,194,100,0.35)', 'transparent']}
            style={styles.badgeGlow}
          />
          <View style={styles.diamondOuter}>
            <View style={styles.diamondInner}>
              <View style={styles.diamondDot} />
            </View>
          </View>
          <LinearGradient
            colors={['transparent', 'rgba(232,194,100,0.3)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.groundGlow}
          />
        </View>
      </View>

      <Text style={styles.headline}>Sacred Focus</Text>
      <Text style={styles.subtitle}>
        Immerse yourself in the Divine words{'\n'}without distraction.
      </Text>

      <View style={styles.featureList}>
        {FEATURES.map(f => (
          <View key={f.title} style={styles.featureRow}>
            <View style={styles.featureIcon}>{f.icon}</View>
            <View style={styles.featureBody}>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={{ flex: 1 }} />

      <Pressable
        style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        onPress={handleGetStarted}
      >
        <Text style={styles.ctaText}>Get Started</Text>
        <Ionicons name="arrow-forward" size={20} color={Colors.bg} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    paddingHorizontal: Spacing.screen,
  },
  badgeWrap: {
    alignItems: 'center',
    marginTop: Spacing.section,
  },
  badgeCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Colors.s1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.bdr,
  },
  badgeGlow: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 90,
  },
  groundGlow: {
    position: 'absolute',
    bottom: 28,
    left: 30, right: 30,
    height: 2,
  },
  diamondOuter: {
    width: 70,
    height: 70,
    borderWidth: 1.5,
    borderColor: Colors.gold,
    transform: [{ rotate: '45deg' }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  diamondInner: {
    width: 38,
    height: 38,
    borderWidth: 1,
    borderColor: Colors.g2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diamondDot: {
    width: 8,
    height: 8,
    backgroundColor: Colors.gold,
    transform: [{ rotate: '45deg' }],
  },
  headline: {
    ...Typography.onboardingHeadline,
    color: Colors.ar,
    textAlign: 'center',
    marginTop: Spacing.section + Spacing.default,
  },
  subtitle: {
    ...Typography.englishSecondary,
    fontSize: 15,
    color: Colors.txt,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: Spacing.default,
    opacity: 0.85,
  },
  featureList: {
    marginTop: Spacing.loose + Spacing.section,
    gap: Spacing.relaxed,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.relaxed,
    backgroundColor: Colors.s1,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.bdr,
    padding: Spacing.section,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureBody: { flex: 1 },
  featureTitle: { ...Typography.englishPrimary, color: Colors.txt },
  featureDesc: { ...Typography.englishSecondary, color: Colors.dim, marginTop: 2 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.default,
    backgroundColor: Colors.gold,
    borderRadius: Radius.card,
    paddingVertical: Spacing.section,
  },
  ctaPressed: { opacity: 0.85 },
  ctaText: {
    ...Typography.englishPrimary,
    fontWeight: '700',
    color: Colors.bg,
    fontSize: 17,
  },
});
