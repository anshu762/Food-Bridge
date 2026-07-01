import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, ViewStyle } from 'react-native';
import { AlertCircle, PackageOpen } from 'lucide-react-native';
import { Button } from './Button';
import tw from '../../utils/tw';

export const Skeleton = ({
  style,
  variant = 'rect',
}: {
  style?: ViewStyle;
  variant?: 'rect' | 'circle';
}) => {
  const animValue = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animValue, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [animValue]);

  return (
    <Animated.View
      style={[
        { opacity: animValue },
        tw`bg-neutral-200`,
        variant === 'circle' ? tw`rounded-pill` : tw`rounded-md`,
        style,
      ]}
    />
  );
};

export const EmptyState = ({
  title,
  subtitle,
  icon: Icon = PackageOpen,
  actionLabel,
  onAction,
}: {
  title: string;
  subtitle?: string;
  icon?: any;
  actionLabel?: string;
  onAction?: () => void;
}) => {
  return (
    <View style={tw`flex-1 items-center justify-center p-24`}>
      <View style={tw`h-64 w-64 rounded-pill bg-neutral-50 items-center justify-center mb-16`}>
        <Icon size={32} color="#9CA3AF" />
      </View>
      <Text style={tw`text-h2 text-neutral-900 text-center mb-8`}>{title}</Text>
      {subtitle && <Text style={tw`text-body text-neutral-600 text-center mb-24`}>{subtitle}</Text>}
      {actionLabel && onAction && (
        <Button variant="secondary" onPress={onAction}>
          {actionLabel}
        </Button>
      )}
    </View>
  );
};

export const ErrorState = ({ message, onRetry }: { message?: string; onRetry?: () => void }) => {
  return (
    <View style={tw`flex-1 items-center justify-center p-24`}>
      <View style={tw`h-64 w-64 rounded-pill bg-danger/10 items-center justify-center mb-16`}>
        <AlertCircle size={32} color="#D9432E" />
      </View>
      <Text style={tw`text-h2 text-neutral-900 text-center mb-8`}>Something went wrong</Text>
      <Text style={tw`text-body text-neutral-600 text-center mb-24`}>
        {message || 'We could not load this content. Please try again.'}
      </Text>
      {onRetry && (
        <Button variant="primary" onPress={onRetry}>
          Try Again
        </Button>
      )}
    </View>
  );
};
