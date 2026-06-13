import React from 'react'
import { Platform, StyleSheet, View } from 'react-native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { AppText } from '../components/AppText'
import { BlurView } from 'expo-blur'
import { Activity, Search } from 'lucide-react-native'

// Pantallas
import { AnalyzerScreen } from '../screens/AnalyzerScreen'
import { ErrorSearchScreen } from '../screens/ErrorSearchScreen'
import { theme } from '../theme'

const Tab = createBottomTabNavigator()

function FloatingTabBarBackground() {
  return (
    <View style={styles.tabBarBackgroundContainer}>
      <BlurView
        intensity={80}
        tint="dark"
        experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, styles.tabBarTint]} />
    </View>
  )
}

export function RootNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarShowLabel: true,
        tabBarBackground: () => <FloatingTabBarBackground />,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        headerStyle: {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.border,
          shadowOpacity: 0,
          elevation: 0,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontFamily: theme.fontFamily.bold,
          fontSize: 18,
        },
      }}
    >
      <Tab.Screen
        name="Analyzer"
        component={AnalyzerScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Activity size={size} color={color} />,
          tabBarLabel: 'Analizador',
        }}
      />
      <Tab.Screen
        name="ErrorSearch"
        component={ErrorSearchScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Search size={size} color={color} />,
          tabBarLabel: 'Catálogo',
        }}
      />
    </Tab.Navigator>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    elevation: 0,
    backgroundColor: 'transparent',
    borderRadius: 20,
    height: 64,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 5,
    paddingTop: 5,
  },
  tabBarLabel: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: 10,
  },
  tabBarBackgroundContainer: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  tabBarTint: {
    backgroundColor: theme.colors.glass,
  },
})
