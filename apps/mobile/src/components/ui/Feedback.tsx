import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, ViewStyle } from 'react-native';
import { AlertCircle, PackageOpen } from 'lucide-react-native';
import { Button } from './Button';
import tw from '../../utils/tw';

export const Skeleton = ({ style }: { style?: ViewStyle }) => {
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
      style={[{ opacity: animValue }, tw`bg-gray-200 rounded-lg`, style]}
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
    <View style={tw`flex-1 items-center justify-center p-6`}>
      <View style={tw`h-20 w-20 rounded-full bg-gray-50 items-center justify-center mb-4`}>
        <Icon size={40} color="#9CA3AF" />
      </View>
      <Text style={tw`text-xl font-semibold text-gray-900 text-center mb-2`}>{title}</Text>
      {subtitle && <Text style={tw`text-base text-gray-500 text-center mb-6`}>{subtitle}</Text>}
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
    <View style={tw`flex-1 items-center justify-center p-6`}>
      <View style={tw`h-20 w-20 rounded-full bg-red-50 items-center justify-center mb-4`}>
        <AlertCircle size={40} color="#EF4444" />
      </View>
      <Text style={tw`text-xl font-semibold text-gray-900 text-center mb-2`}>
        Something went wrong
      </Text>
      <Text style={tw`text-base text-gray-500 text-center mb-6`}>
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
