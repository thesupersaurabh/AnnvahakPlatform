import { Platform } from 'react-native';

export const isWeb = Platform.OS === 'web';
export const isNative = !isWeb;
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

export const usePlatform = () => {
  return {
    isWeb,
    isNative,
    isIOS,
    isAndroid
  };
};

export default usePlatform; 