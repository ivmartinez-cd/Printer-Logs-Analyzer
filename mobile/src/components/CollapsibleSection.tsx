import React, { useState } from 'react'
import { StyleSheet, View, Pressable, LayoutAnimation, Platform, UIManager } from 'react-native'
import { ChevronRight } from 'lucide-react-native'
import { AppText } from './AppText'
import { theme } from '../theme'

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

interface CollapsibleSectionProps {
  title: string
  icon?: string
  badge?: string | number
  defaultOpen?: boolean
  children: React.ReactNode
}

export function CollapsibleSection({
  title,
  icon,
  badge,
  defaultOpen = false,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setOpen((v) => !v)
  }

  return (
    <View style={styles.container}>
      <Pressable onPress={toggle} style={styles.header}>
        <View style={styles.headerLeft}>
          {icon ? <AppText style={styles.icon}>{icon}</AppText> : null}
          <AppText style={styles.title}>{title}</AppText>
        </View>
        <View style={styles.headerRight}>
          {badge !== undefined && badge !== null && (
            <AppText style={styles.badge}>
              {badge}
            </AppText>
          )}
          <View style={[styles.chevron, open && styles.chevronOpen]}>
            <ChevronRight size={16} color={theme.colors.textMuted} />
          </View>
        </View>
      </Pressable>
      {open && <View style={styles.body}>{children}</View>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: theme.spacing.sm,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  icon: {
    fontSize: 16,
  },
  title: {
    color: theme.colors.text,
    fontSize: 13,
    fontFamily: theme.fontFamily.semibold,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontFamily: theme.fontFamily.regular,
  },
  chevron: {
    transform: [{ rotate: '0deg' }],
  },
  chevronOpen: {
    transform: [{ rotate: '90deg' }],
  },
  body: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
})
