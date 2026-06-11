import React from 'react'
import { StyleSheet, Text, TextProps } from 'react-native'
import { theme } from '../theme'

// Reemplaza a Text con la fuente y el color por defecto de la app.
// No mutar Text.defaultProps: Hermes en builds release crashea al iniciar.
export function AppText({ style, ...props }: TextProps) {
  return <Text style={[styles.text, style]} {...props} />
}

const styles = StyleSheet.create({
  text: {
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.text,
  },
})
