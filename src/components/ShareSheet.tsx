import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Modal, Pressable, Share, StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, useAppTheme } from '../theme';
import { AppText } from './AppText';
import { Button } from './Button';

type Props = {
  url: string;
  message: string;
  visible: boolean;
  onClose: () => void;
};

// Bottom sheet with a QR code friends can scan, plus share and copy buttons.
export function ShareSheet({ url, message, visible, onClose }: Props) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const [copied, setCopied] = useState(false);

  const share = () => {
    Share.share({ message: `${message} ${url}`, url }).catch(() => {});
  };

  const copy = async () => {
    await Clipboard.setStringAsync(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
      <View style={[styles.sheet, { paddingBottom: 20 + insets.bottom }]}>
        <View style={styles.handle} />
        <AppText weight="black" style={styles.title}>
          Share {theme.title}
        </AppText>
        <AppText weight="regular" muted style={styles.subtitle}>
          Scan with a phone camera to play.
        </AppText>
        <View style={styles.qr}>
          <QRCode value={url} size={200} color={theme.ink} backgroundColor="#FFFFFF" />
        </View>
        <AppText selectable style={[styles.url, { color: theme.accent }]}>
          {url}
        </AppText>
        <View style={styles.actions}>
          <Button label="Share link" onPress={share} style={styles.action} />
          <Button label={copied ? 'Copied' : 'Copy link'} variant="secondary" onPress={copy} style={styles.action} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(19, 64, 90, 0.35)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 560,
    backgroundColor: colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8,
  },
  handle: { width: 44, height: 5, borderRadius: 3, backgroundColor: colors.border, marginBottom: 8 },
  title: { fontSize: 22 },
  subtitle: { fontSize: 15 },
  qr: {
    padding: 14,
    marginVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
  },
  url: { fontSize: 16, marginBottom: 8 },
  actions: { flexDirection: 'row', gap: 10, alignSelf: 'stretch' },
  action: { flex: 1 },
});
