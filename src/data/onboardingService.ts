// src/data/onboardingService.ts
//
// Tracks whether the user has completed onboarding.
// A single AsyncStorage flag — no pub-sub needed since it is only
// read on app launch and written once when the user taps "Get Started".

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'quran-reader:onboarding:v1';

export async function hasCompletedOnboarding(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

export async function markOnboardingComplete(): Promise<void> {
  await AsyncStorage.setItem(KEY, 'true');
}

export async function resetOnboarding(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
