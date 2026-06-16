# Printer Logs Analyzer - Mobile App (Android APK)

Este directorio contiene el código base móvil desarrollado con **React Native** + **Expo SDK 51** y configurado para compilarse como un archivo **APK instalable en Android**.

## Requisitos Previos

1. Tener instalado **Node.js** (versión 18 o superior).
2. Tener instalado el CLI de Expo globalmente (opcional):
   ```bash
   npm install -g expo-cli
   ```
3. Tener instalado el CLI de EAS (Expo Application Services) para compilar en la nube:
   ```bash
   npm install -g eas-cli
   ```

## Configuración del Proyecto

1. Entra al directorio móvil e instala las dependencias:
   ```bash
   cd mobile
   npm install
   ```

2. Ejecuta la aplicación de forma nativa en un dispositivo Android o emulador:
   ```bash
   npm run android
   ```
   *Este comando compilará el código nativo e instalará la aplicación directamente en el dispositivo o emulador conectado.*

## Cómo generar el archivo APK (Android)

Para generar un archivo APK autocontenido que puedas instalar directamente en cualquier dispositivo Android, sigue estos pasos:

1. **Inicia sesión en tu cuenta de Expo**:
   ```bash
   eas login
   ```
   *Si no tienes una cuenta, créala gratis en [expo.dev](https://expo.dev).*

2. **Configura el proyecto en EAS** (solo la primera vez):
   ```bash
   eas project:init
   ```

3. **Compila para generar el APK**:
   ```bash
   npm run build:preview
   ```
   *(Este comando ejecuta `eas build -p android --profile preview`)*

4. **Descarga e instala**:
   Al finalizar la compilación en la nube de Expo, la terminal te proporcionará un código QR y un enlace directo de descarga. Escanea el QR con tu teléfono para descargar e instalar el archivo **`.apk`**.

## Arquitectura del Proyecto Móvil

*   `App.tsx`: Punto de entrada de la aplicación móvil (envoltorios de navegación y estado global).
*   `src/theme/`: Definición de tokens de diseño premium (Dark Mode, Glassmorphism).
*   `src/store/`: Reutilización de los stores de **Zustand** para análisis (`useAnalysisStore`) y UI.
*   `src/services/api.ts`: Cliente HTTP adaptado para React Native que admite cambiar la URL base del backend en tiempo de ejecución.
*   `src/navigation/`: Configuración de la navegación por pestañas inferiores (Bottom Tab Navigator).
*   `src/components/`: Componentes táctiles móviles y modales deslizables (Bottom Sheets).
*   `src/screens/`: Pantallas de la aplicación móvil que corresponden a las vistas principales de la web.
