import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, TouchableOpacityProps } from 'react-native';
import tw from '../../utils/tw';

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
  const variants = {
    primary: tw`bg-primary-600`,
    secondary: tw`bg-accent-500`,
    danger: tw`bg-red-500`,
    ghost: tw`bg-transparent border border-gray-200`,
  };

  const sizes = {
    sm: tw`py-2 px-4`,
    md: tw`py-3 px-6`,
    lg: tw`py-4 px-8`,
  };

  const textColors = {
    primary: tw`text-white`,
    secondary: tw`text-white`,
    danger: tw`text-white`,
    ghost: tw`text-gray-700`,
  };

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      disabled={isDisabled}
      style={[
        tw`flex-row items-center justify-center rounded-xl`,
        variants[variant],
        sizes[size],
        fullWidth && tw`w-full`,
        isDisabled && tw`opacity-60`,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'ghost' ? '#374151' : '#ffffff'} />
      ) : (
        <Text
          style={[
            tw`font-semibold text-center`,
            textColors[variant],
            size === 'lg' ? tw`text-lg` : tw`text-base`,
          ]}
        >
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
};
