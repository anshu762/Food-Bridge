import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Bell } from 'lucide-react-native';
import tw from '../../utils/tw';

interface PushNotificationBannerProps {
  title: string;
  body: string;
  onPress?: () => void;
}

export const PushNotificationBanner = ({ title, body, onPress }: PushNotificationBannerProps) => {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={tw`m-16 bg-surface rounded-lg p-16 shadow-raised flex-row items-center border border-neutral-100`}
    >
      <View style={tw`w-48 h-48 rounded-pill bg-primary-50 items-center justify-center mr-16`}>
        <Bell color="#1B7A4D" size={24} />
      </View>
      <View style={tw`flex-1`}>
        <Text style={tw`text-body-emphasis text-neutral-900 mb-4`}>{title}</Text>
        <Text style={tw`text-caption text-neutral-600`} numberOfLines={2}>
          {body}
        </Text>
      </View>
    </TouchableOpacity>
  );
};
