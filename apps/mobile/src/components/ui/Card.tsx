import React from 'react';
import { View, ViewProps, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import tw from '../../utils/tw';

export const Card = ({ style, children, ...props }: ViewProps) => {
  return (
    <View
      style={[tw`bg-white rounded-2xl p-4 border border-gray-100`, style]}
      {...props}
    >
      {children}
    </View>
  );
};

export const TouchableCard = ({ style, children, ...props }: TouchableOpacityProps) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[tw`bg-white rounded-2xl p-4 border border-gray-100`, style]}
      {...props}
    >
      {children}
    </TouchableOpacity>
  );
};
