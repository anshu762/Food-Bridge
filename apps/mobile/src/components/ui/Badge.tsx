import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import tw from '../../utils/tw';

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
  style?: ViewStyle;
}

const badgeStyles: Record<string, { bg: string; text: string; border: string }> = {
  AVAILABLE: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
  RESERVED: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
  PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
  COLLECTED: { bg: 'bg-primary-100', text: 'text-primary-800', border: 'border-primary-200' },
  ACCEPTED: { bg: 'bg-primary-100', text: 'text-primary-800', border: 'border-primary-200' },
  CANCELLED: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
  REJECTED: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
};

const defaultStyle = { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' };

export const Badge = ({ status, style: extraStyle }: BadgeProps) => {
  const s = badgeStyles[status] || defaultStyle;

  return (
    <View style={[tw`px-2.5 py-1 rounded-full border self-start ${s.bg} ${s.border}`, extraStyle]}>
      <Text style={tw`text-xs font-semibold ${s.text}`}>{status}</Text>
    </View>
  );
};
