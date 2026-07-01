import React, { createContext, useContext, useState, ReactNode } from 'react';
import { View, Text, Animated, TouchableOpacity, Modal } from 'react-native';
import { XCircle, CheckCircle, Info, X } from 'lucide-react-native';
import tw from '../../utils/tw';
import { Button } from './Button';
import { motionPresets } from '../../lib/motion';

export type ToastType = 'success' | 'error' | 'info';

interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

interface DialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  type?: 'default' | 'destructive';
}

interface ProvidersContextValue {
  showToast: (options: ToastOptions) => void;
  showDialog: (options: DialogOptions) => void;
}

const ProvidersContext = createContext<ProvidersContextValue | undefined>(undefined);

export const UIProvider = ({ children }: { children: ReactNode }) => {
  const [toast, setToast] = useState<ToastOptions | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  const [dialog, setDialog] = useState<DialogOptions | null>(null);

  const showToast = ({ message, type = 'info', duration = 3000 }: ToastOptions) => {
    setToast({ message, type, duration });
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: motionPresets.transition.duration,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      hideToast();
    }, duration);
  };

  const hideToast = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: motionPresets.transition.duration,
      useNativeDriver: true,
    }).start(() => setToast(null));
  };

  const showDialog = (options: DialogOptions) => {
    setDialog(options);
  };

  const closeDialog = () => {
    setDialog(null);
  };

  return (
    <ProvidersContext.Provider value={{ showToast, showDialog }}>
      {children}

      {/* Global Toast */}
      {toast && (
        <Animated.View
          style={[
            tw`absolute top-48 left-16 right-16 rounded-md p-16 flex-row justify-between items-center shadow-raised z-50`,
            { opacity: fadeAnim },
            toast.type === 'error' && tw`bg-danger`,
            toast.type === 'success' && tw`bg-primary`,
            toast.type === 'info' && tw`bg-info`,
          ]}
        >
          <View style={tw`flex-row items-center flex-1`}>
            {toast.type === 'error' && <XCircle color="white" size={24} />}
            {toast.type === 'success' && <CheckCircle color="white" size={24} />}
            {toast.type === 'info' && <Info color="white" size={24} />}
            <Text style={tw`text-surface text-body-emphasis ml-12 flex-1`}>{toast.message}</Text>
          </View>
          <TouchableOpacity onPress={hideToast} style={tw`p-4`}>
            <X color="white" size={20} />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Global Dialog */}
      <Modal visible={!!dialog} transparent animationType="fade">
        {dialog && (
          <View style={tw`flex-1 justify-center items-center bg-neutral-900/50 p-24`}>
            <View style={tw`bg-surface rounded-xl p-24 w-full shadow-raised`}>
              <Text style={tw`text-h2 text-neutral-900 mb-8`}>{dialog.title}</Text>
              <Text style={tw`text-body text-neutral-600 mb-24`}>{dialog.message}</Text>
              <View style={tw`flex-row justify-end space-x-12`}>
                <Button
                  variant="ghost"
                  size="sm"
                  style={tw`mr-12`}
                  onPress={() => {
                    dialog.onCancel?.();
                    closeDialog();
                  }}
                >
                  {dialog.cancelText || 'Cancel'}
                </Button>
                <Button
                  variant={dialog.type === 'destructive' ? 'danger' : 'primary'}
                  size="sm"
                  onPress={() => {
                    dialog.onConfirm?.();
                    closeDialog();
                  }}
                >
                  {dialog.confirmText || 'Confirm'}
                </Button>
              </View>
            </View>
          </View>
        )}
      </Modal>
    </ProvidersContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(ProvidersContext);
  if (!context) throw new Error('useUI must be used within UIProvider');
  return context;
};

// Re-export toast hook for backward compatibility if needed
export const useToast = () => {
  const { showToast } = useUI();
  return { showToast };
};
