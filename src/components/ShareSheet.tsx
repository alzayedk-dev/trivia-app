import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Modal, Pressable, Share, StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, useAppTheme, useDesktopLayout } from '../theme';
import { AppText } from './AppText';
import { Button } from './Button';

type Props = {
  url: string;
  message: string;
  visible: boolean;
  onClose: () => void;
};

// A QR code friends can scan, plus share and copy buttons. On phones it slides
// up from the bottom; on computers it's a centred popup.
export function ShareSheet({ url, message, visible, onClose }: Props) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const desktop = useDesktopLayout();
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
    <Modal visible={visible} transparent animationType={desktop ? 'fade' : 'slide'} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
      {/* Lets taps outside the popup fall through to the backdrop above. */}
      <View pointerEvents="box-none" style={[styles.wrap, desktop && styles.wrapDesktop]}>
        <View style={[styles.sheet, desktop ? styles.sheetDesktop : { paddingBottom: 20 + insets.bottom }]}>
          {!desktop && <View style={styles.handle} />}
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
          {desktop && <Button label="Close" variant="secondary" onPress={onClose} style={styles.close} />}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(36, 36, 90, 0.4)' },
  wrap: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  wrapDesktop: { justifyContent: 'center', padding: 24 },
  sheet: {
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
  sheetDesktop: {
    maxWidth: 440,
    borderRadius: 28,
    paddingTop: 28,
    paddingBottom: 24,
    paddingHorizontal: 28,
    shadowColor: colors.shadow,
    shadowOpacity: 0.25,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 16 },
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
  close: { alignSelf: 'stretch', minHeight: 52, marginTop: 4 },
});
