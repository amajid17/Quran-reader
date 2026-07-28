// src/navigation/AppNavigator.tsx

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Typography, makeTabBarStyle } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import type { RootTabParamList, QuranStackParamList, RootStackParamList } from '../types';
import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen       from '../screens/HomeScreen';
import ReaderScreen     from '../screens/ReaderScreen';
import JuzScreen        from '../screens/JuzScreen';
import BookmarksScreen  from '../screens/BookmarksScreen';
import SettingsScreen   from '../screens/SettingsScreen';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab       = createBottomTabNavigator<RootTabParamList>();
const Stack     = createNativeStackNavigator<QuranStackParamList>();

// Icon map — focused tab shows filled icon, inactive shows outline.
// Defined outside components so the object is not re-created on every render.
const TAB_ICONS: Record<string, { focused: string; unfocused: string }> = {
  Quran:     { focused: 'book',     unfocused: 'book-outline'     },
  Juz:       { focused: 'layers',   unfocused: 'layers-outline'   },
  Bookmarks: { focused: 'bookmark', unfocused: 'bookmark-outline' },
};

// QuranStack reads Colors from useTheme() so the header updates
// immediately when the user switches dark ↔ light in Settings.
function QuranStack() {
  const { Colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle:         { backgroundColor: Colors.s1 },
        headerTintColor:     Colors.gold,
        headerTitleStyle:    { fontFamily: 'ScheherazadeNew', fontSize: 18, color: Colors.ar },
        headerShadowVisible: false,
        contentStyle:        { backgroundColor: Colors.bg },
      }}
    >
      <Stack.Screen name="Home"   component={HomeScreen}   options={{ headerShown: false }} />
      <Stack.Screen name="Reader" component={ReaderScreen} options={{ title: '' }} />
    </Stack.Navigator>
  );
}

// MainTabs reads Colors from useTheme() so the tab bar background,
// borders, and tints all respond to theme changes without a restart.
function MainTabs() {
  const { Colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,

        // makeTabBarStyle() builds the correct style for the active
        // theme — both background and border colours update live.
        tabBarStyle: makeTabBarStyle(Colors),

        tabBarActiveTintColor:   Colors.gold,
        tabBarInactiveTintColor: Colors.dim,
        tabBarLabelStyle: { ...Typography.englishSecondary, marginBottom: 2 },

        tabBarIcon: ({ color, size, focused }) => {
          const map  = TAB_ICONS[route.name];
          const name = (focused ? map?.focused : map?.unfocused) ?? 'book-outline';
          return <Ionicons name={name as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Quran"     component={QuranStack}      options={{ tabBarLabel: 'Quran' }} />
      <Tab.Screen name="Juz"       component={JuzScreen}       options={{ tabBarLabel: 'Juz' }} />
      <Tab.Screen name="Bookmarks" component={BookmarksScreen} options={{ tabBarLabel: 'Bookmarks' }} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
        <RootStack.Screen name="MainTabs"   component={MainTabs} />
        <RootStack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ presentation: 'card' }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
