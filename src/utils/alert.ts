import { Alert, Platform } from 'react-native';

export const showAlert = (
  title: string,
  message?: string,
  onConfirm?: () => void,
  onCancel?: () => void,
  confirmText: string = 'OK',
  cancelText: string = 'Cancel',
  destructive: boolean = false
) => {
  if (Platform.OS === 'web') {
    if (onCancel) {
      const result = window.confirm(`${title}${message ? '\n\n' + message : ''}`);
      if (result && onConfirm) onConfirm();
      else if (!result && onCancel) onCancel();
    } else {
      window.alert(`${title}${message ? '\n\n' + message : ''}`);
      if (onConfirm) onConfirm();
    }
  } else {
    const buttons: any[] = [];
    if (onCancel) {
      buttons.push({ text: cancelText, style: 'cancel', onPress: onCancel });
    }
    buttons.push({
      text: confirmText,
      style: destructive ? 'destructive' : 'default',
      onPress: onConfirm,
    });
    Alert.alert(title, message, buttons);
  }
};
