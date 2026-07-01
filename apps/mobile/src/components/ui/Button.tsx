import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TouchableOpacityProps,
  Animated,
} from 'react-native';
import tw from '../../utils/tw';
import { motionPresets } from '../../lib/motion';

interface ButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  style,
  children,
  ...props
}: ButtonProps) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: motionPresets.tap.scale,
      useNativeDriver: true,
      damping: motionPresets.spring.damping,
      stiffness: motionPresets.spring.stiffness,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      damping: motionPresets.spring.damping,
      stiffness: motionPresets.spring.stiffness,
    }).start();
  };

  const variants = {
    primary: tw`bg-primary shadow-resting`,
    secondary: tw`bg-accent shadow-resting`,
    danger: tw`bg-danger shadow-resting`,
    ghost: tw`bg-transparent border border-neutral-200`,
  };

  const sizes = {
    sm: tw`py-8 px-12 rounded-sm`,
    md: tw`py-12 px-16 rounded-md`,
    lg: tw`py-16 px-24 rounded-lg`,
  };

  const textColors = {
    primary: tw`text-surface`,
    secondary: tw`text-surface`,
    danger: tw`text-surface`,
    ghost: tw`text-neutral-900`,
  };

  const isDisabled = disabled || loading;

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, fullWidth && tw`w-full`]}>
      <TouchableOpacity
        activeOpacity={0.85}
        disabled={isDisabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          tw`flex-row items-center justify-center`,
          variants[variant],
          sizes[size],
          isDisabled && tw`opacity-50`,
          style,
        ]}
        {...props}
      >
        {loading ? (
          <ActivityIndicator size="small" color={variant === 'ghost' ? '#111827' : '#FFFFFF'} />
        ) : (
          <Text
            style={[
              tw`text-center text-body-emphasis`,
              textColors[variant],
              size === 'lg' ? tw`text-h3` : tw`text-body-emphasis`,
            ]}
          >
            {children}
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};
