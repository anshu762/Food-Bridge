import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, TouchableOpacityProps } from 'react-native';
import { cn } from '../../utils/cn';

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
  className = '',
  children,
  ...props
}: ButtonProps) => {
  const baseStyles = 'flex-row items-center justify-center rounded-xl font-medium';

  const variants = {
    primary: 'bg-primary-600',
    secondary: 'bg-accent-500',
    danger: 'bg-red-500',
    ghost: 'bg-transparent border border-gray-200',
  };

  const sizes = {
    sm: 'py-2 px-4',
    md: 'py-3 px-6',
    lg: 'py-4 px-8',
  };

  const textColors = {
    primary: 'text-white',
    secondary: 'text-white',
    danger: 'text-white',
    ghost: 'text-gray-700',
  };

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      disabled={isDisabled}
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        isDisabled && 'opacity-60',
        className,
      )}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'ghost' ? '#374151' : '#ffffff'} />
      ) : (
        <Text
          className={cn(
            'font-semibold text-center',
            textColors[variant],
            size === 'lg' ? 'text-lg' : 'text-base',
          )}
        >
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
};
