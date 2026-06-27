import React from 'react';
import { View, Text } from 'react-native';
import { cn } from '../../utils/cn';

type BadgeStatus =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'COLLECTED'
  | 'CANCELLED'
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED';

interface BadgeProps {
  status: BadgeStatus | string;
  className?: string;
}

export const Badge = ({ status, className }: BadgeProps) => {
  const getBadgeStyle = (s: string) => {
    switch (s) {
      case 'AVAILABLE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'RESERVED':
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'COLLECTED':
      case 'ACCEPTED':
        return 'bg-primary-100 text-primary-800 border-primary-200';
      case 'CANCELLED':
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const styleClass = getBadgeStyle(status);

  return (
    <View
      className={cn(
        'px-2.5 py-1 rounded-full border self-start',
        styleClass.split(' text-')[0],
        styleClass.split(' ').find((c) => c.startsWith('border-')),
        className,
      )}
    >
      <Text
        className={cn(
          'text-xs font-semibold',
          styleClass.split(' ').find((c) => c.startsWith('text-')),
        )}
      >
        {status}
      </Text>
    </View>
  );
};
