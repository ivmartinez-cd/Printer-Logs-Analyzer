import React from 'react'
import { StyleSheet, View, Modal, TouchableOpacity } from 'react-native'
import { CameraView } from 'expo-camera'
import { X } from 'lucide-react-native'
import { AppText } from './AppText'
import { theme } from '../theme'

export function BarcodeScannerModal({ visible, onClose, onScanned, paused }: {
  visible: boolean
  onClose: () => void
  onScanned: (e: { data: string }) => void
  /** Si true, ignora nuevas lecturas (escaneo ya procesado). */
  paused: boolean
}) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.scannerContainer}>
        <CameraView
          style={StyleSheet.absoluteFill}
          barcodeScannerSettings={{
            barcodeTypes: ['code128', 'code39', 'code93', 'ean13', 'ean8', 'upc_a', 'upc_e', 'itf14', 'codabar', 'datamatrix', 'qr'],
          }}
          onBarcodeScanned={paused ? undefined : onScanned}
        />
        {/* Overlay UI */}
        <View style={styles.scannerOverlay}>
          <View style={styles.scannerHeader}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.scannerCloseBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <X size={24} color="#fff" />
            </TouchableOpacity>
            <AppText style={styles.scannerTitle}>Escanear Código de Barras</AppText>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.scannerViewfinder}>
            {/* Corner markers */}
            <View style={[styles.scannerCorner, styles.scannerCornerTL]} />
            <View style={[styles.scannerCorner, styles.scannerCornerTR]} />
            <View style={[styles.scannerCorner, styles.scannerCornerBL]} />
            <View style={[styles.scannerCorner, styles.scannerCornerBR]} />
          </View>

          <AppText style={styles.scannerHint}>
            Apuntá la cámara al código de barras del equipo
          </AppText>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
  },
  scannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
  },
  scannerCloseBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
  },
  scannerTitle: {
    color: '#fff',
    fontSize: 16,
    fontFamily: theme.fontFamily.bold,
  },
  scannerViewfinder: {
    width: 260,
    height: 160,
    position: 'relative',
  },
  scannerCorner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: theme.colors.primary,
  },
  scannerCornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 8,
  },
  scannerCornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 8,
  },
  scannerCornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 8,
  },
  scannerCornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 8,
  },
  scannerHint: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontFamily: theme.fontFamily.medium,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
})
