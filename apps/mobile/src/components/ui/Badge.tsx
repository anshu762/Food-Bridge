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
  AVAILABLE: { bg: 'bg-primary-50', text: 'text-primary-800', border: 'border-primary-200' },
  RESERVED: { bg: 'bg-warning/20', text: 'text-warning', border: 'border-warning/50' },
  PENDING: { bg: 'bg-warning/20', text: 'text-warning', border: 'border-warning/50' },
  COLLECTED: { bg: 'bg-primary-100', text: 'text-primary-dark', border: 'border-primary-200' },
  ACCEPTED: { bg: 'bg-primary-100', text: 'text-primary-dark', border: 'border-primary-200' },
  CANCELLED: { bg: 'bg-danger/10', text: 'text-danger', border: 'border-danger/30' },
  REJECTED: { bg: 'bg-danger/10', text: 'text-danger', border: 'border-danger/30' },
};

const defaultStyle = {
  bg: 'bg-neutral-50',
  text: 'text-neutral-900',
  border: 'border-neutral-200',
};

export const Badge = ({ status, style: extraStyle }: BadgeProps) => {
  const s = badgeStyles[status] || defaultStyle;

  return (
    <View style={[tw`px-8 py-4 rounded-pill border self-start ${s.bg} ${s.border}`, extraStyle]}>
      <Text style={tw`text-overline uppercase tracking-widest ${s.text}`}>{status}</Text>
    </View>
  );
};
