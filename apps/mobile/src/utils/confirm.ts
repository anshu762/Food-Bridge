import { Alert, Platform } from 'react-native';

type ConfirmButtons = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};

export function showConfirm(
  title: string,
  message: string,
  buttons: ConfirmButtons[],
  cancelable = true,
) {
  if (Platform.OS === 'web') {
    const cancelBtn = buttons.find((b) => b.style === 'cancel');
    const destructiveBtn = buttons.find((b) => b.style === 'destructive');
    const okBtn = buttons.find((b) => b.style !== 'cancel' && b.style !== 'destructive');
    const confirmed = window.confirm(`${title}\n\n${message}`);
    if (confirmed) {
      (destructiveBtn || okBtn)?.onPress?.();
    } else {
      cancelBtn?.onPress?.();
    }
    return;
  }
  Alert.alert(title, message, buttons, { cancelable });
}
