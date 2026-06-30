import { Platform } from 'react-native';

let HapticsModule: any = null;
if (Platform.OS !== 'web') {
  try {
    HapticsModule = require('expo-haptics');
  } catch {}
}

export function notifySuccess() {
  if (HapticsModule) {
    HapticsModule.notificationAsync(HapticsModule.NotificationFeedbackType.Success);
  }
}

export function notifyWarning() {
  if (HapticsModule) {
    HapticsModule.notificationAsync(HapticsModule.NotificationFeedbackType.Warning);
  }
}

export function impactMedium() {
  if (HapticsModule) {
    HapticsModule.impactAsync(HapticsModule.ImpactFeedbackStyle.Medium);
  }
}
