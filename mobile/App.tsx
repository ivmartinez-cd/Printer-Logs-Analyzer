import React, { useState, useEffect } from 'react'
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { NavigationContainer, DarkTheme } from '@react-navigation/native'
import { LinearGradient } from 'expo-linear-gradient'
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter'
import * as Sentry from '@sentry/react-native'
import { RootNavigator } from './src/navigation/RootNavigator'
import { ToastOverlay } from './src/components/ToastOverlay'
import { theme } from './src/theme'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'

// Inicializar Sentry para reportar errores en producción
Sentry.init({
  dsn: 'https://placeholder@o0.ingest.sentry.io/0', // Reemplazar con el DSN real del proyecto
  tracesSampleRate: 1.0,
  _experiments: {
    profilesSampleRate: 1.0,
  },
})

// Forzar el tema oscuro por defecto basado en los tokens premium
const AppTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: theme.colors.background,
    card: theme.colors.surface,
    text: theme.colors.text,
    border: theme.colors.border,
    primary: theme.colors.primary,
  },
}

// Configuración de Deep Linking para abrir la app desde otras aplicaciones
const linking = {
  prefixes: ['hplogs://'],
  config: {
    screens: {
      Analyzer: 'analyze/:serial',
    },
  },
}

// Tiempo mínimo (ms) que la pantalla de carga permanece visible. Sin esto, en
// release las fuentes cargan tan rápido que el splash apenas parpadea.
const MIN_SPLASH_MS = 1600

function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  })

  const [minTimeElapsed, setMinTimeElapsed] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), MIN_SPLASH_MS)
    return () => clearTimeout(timer)
  }, [])

  const appReady = fontsLoaded && minTimeElapsed

  if (!appReady) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#081c30', '#06080c', '#030508']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.85 }}
        />
        <View style={styles.loadingContent}>
          <View style={styles.logoRow}>
            <Text style={styles.logoMain}>HP Logs </Text>
            <Text style={styles.logoSuffix}>ANALYZER</Text>
          </View>
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 28 }} />
        </View>
      </View>
    )
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <BottomSheetModalProvider>
          <NavigationContainer theme={AppTheme} linking={linking}>
            <StatusBar style="light" />
            <RootNavigator />
            <ToastOverlay />
          </NavigationContainer>
        </BottomSheetModalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // La fuente Inter puede no estar cargada aún: fontWeight asegura el peso con la fuente del sistema.
  logoMain: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '700',
    fontFamily: theme.fontFamily.bold,
  },
  logoSuffix: {
    color: theme.colors.primary,
    fontSize: 30,
    fontWeight: '500',
    fontFamily: theme.fontFamily.medium,
    letterSpacing: 0.5,
  },
})

export default Sentry.wrap(App)
