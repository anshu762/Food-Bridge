import React, { createContext, useContext, useState, ReactNode } from 'react';
import { View, Text, Animated, StyleSheet, TouchableOpacity } from 'react-native';
import { XCircle, CheckCircle, Info } from 'lucide-react-native';

export type ToastType = 'success' | 'error' | 'info';

interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toast, setToast] = useState<ToastOptions | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  const showToast = ({ message, type = 'info', duration = 3000 }: ToastOptions) => {
    setToast({ message, type, duration });
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      hideToast();
    }, duration);
  };

  const hideToast = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setToast(null));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Animated.View
          style={[
            styles.container,
            { opacity: fadeAnim },
            toast.type === 'error' && styles.errorBg,
            toast.type === 'success' && styles.successBg,
            toast.type === 'info' && styles.infoBg,
          ]}
        >
          <View style={styles.content}>
            {toast.type === 'error' && <XCircle color="white" size={20} />}
            {toast.type === 'success' && <CheckCircle color="white" size={20} />}
            {toast.type === 'info' && <Info color="white" size={20} />}
            <Text style={styles.text}>{toast.message}</Text>
          </View>
          <TouchableOpacity onPress={hideToast} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 9999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  errorBg: { backgroundColor: '#ef4444' }, // red-500
  successBg: { backgroundColor: '#22c55e' }, // green-500
  infoBg: { backgroundColor: '#3b82f6' }, // blue-500
  text: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 12,
    fontSize: 14,
    flex: 1,
  },
  closeBtn: {
    padding: 4,
  },
  closeText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
