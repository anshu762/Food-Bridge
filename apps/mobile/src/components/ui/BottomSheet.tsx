import React from 'react';
import { View, Modal, TouchableOpacity } from 'react-native';
import tw from '../../utils/tw';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const BottomSheet = ({ visible, onClose, children }: BottomSheetProps) => {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={tw`flex-1 justify-end bg-neutral-900/50`}>
        <TouchableOpacity style={tw`flex-1`} onPress={onClose} activeOpacity={1} />
        <View style={tw`bg-surface rounded-t-xl p-24 w-full shadow-raised pb-48`}>
          <View style={tw`w-48 h-4 bg-neutral-200 rounded-pill self-center mb-24`} />
          {children}
        </View>
      </View>
    </Modal>
  );
};
