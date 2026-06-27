import React from 'react';
import { View, ViewProps, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { cn } from '../../utils/cn';

export const Card = ({ className, children, ...props }: ViewProps) => {
  return (
    <View
      className={cn('bg-white rounded-2xl p-4 shadow-sm border border-gray-100', className)}
      {...props}
    >
      {children}
    </View>
  );
};

export const TouchableCard = ({ className, children, ...props }: TouchableOpacityProps) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      className={cn('bg-white rounded-2xl p-4 shadow-sm border border-gray-100', className)}
      {...props}
    >
      {children}
    </TouchableOpacity>
  );
};
