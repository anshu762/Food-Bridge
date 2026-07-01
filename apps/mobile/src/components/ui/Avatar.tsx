import React from 'react';
import { View, Text, Image } from 'react-native';
import tw from '../../utils/tw';

interface AvatarProps {
  src?: string | null;
  fallback: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Avatar = ({ src, fallback, size = 'md' }: AvatarProps) => {
  const sizeStyles = {
    sm: tw`w-32 h-32`,
    md: tw`w-48 h-48`,
    lg: tw`w-64 h-64`,
  };

  const textStyles = {
    sm: tw`text-caption font-semibold`,
    md: tw`text-body-emphasis`,
    lg: tw`text-h2`,
  };

  return (
    <View
      style={[
        tw`rounded-pill bg-primary-100 items-center justify-center overflow-hidden`,
        sizeStyles[size],
      ]}
    >
      {src ? (
        <Image source={{ uri: src }} style={tw`w-full h-full`} resizeMode="cover" />
      ) : (
        <Text style={[tw`text-primary-dark`, textStyles[size]]}>
          {fallback.substring(0, 2).toUpperCase()}
        </Text>
      )}
    </View>
  );
};
