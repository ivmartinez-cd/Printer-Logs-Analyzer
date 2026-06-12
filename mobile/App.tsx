import React from 'react'
import { ActivityIndicator, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { NavigationContainer, DarkTheme } from '@react-navigation/native'
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

function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  })

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    )
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer theme={AppTheme} linking={linking}>
          <StatusBar style="light" />
          <RootNavigator />
          <ToastOverlay />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

export default Sentry.wrap(App)
