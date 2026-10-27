import { Platform } from 'react-native';

// The native animation driver isn't available on web.
export const useNativeDriver = Platform.OS !== 'web';
