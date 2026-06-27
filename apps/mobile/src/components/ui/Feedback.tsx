import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { AlertCircle, PackageOpen } from 'lucide-react-native';
import { Button } from './Button';
import { cn } from '../../utils/cn';

export const Skeleton = ({ className }: { className?: string }) => {
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
      style={{ opacity: animValue }}
      className={cn('bg-gray-200 rounded-lg', className)}
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
    <View className="flex-1 items-center justify-center p-6">
      <View className="h-20 w-20 rounded-full bg-gray-50 items-center justify-center mb-4">
        <Icon size={40} color="#9CA3AF" />
      </View>
      <Text className="text-xl font-semibold text-gray-900 text-center mb-2">{title}</Text>
      {subtitle && <Text className="text-base text-gray-500 text-center mb-6">{subtitle}</Text>}
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
    <View className="flex-1 items-center justify-center p-6">
      <View className="h-20 w-20 rounded-full bg-red-50 items-center justify-center mb-4">
        <AlertCircle size={40} color="#EF4444" />
      </View>
      <Text className="text-xl font-semibold text-gray-900 text-center mb-2">
        Something went wrong
      </Text>
      <Text className="text-base text-gray-500 text-center mb-6">
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
