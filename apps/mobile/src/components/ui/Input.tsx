import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps, TouchableOpacity } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import tw from '../../utils/tw';
import { useController, UseControllerProps } from 'react-hook-form';

interface InputProps extends TextInputProps {
  label?: string;
  helperText?: string;
  secureTextEntryToggle?: boolean;
  error?: string;
}

export const Input = React.forwardRef<TextInput, InputProps>(
  ({ label, helperText, error, secureTextEntryToggle, secureTextEntry, style, ...props }, ref) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const isSecure = secureTextEntry && !isPasswordVisible;

    return (
      <View style={tw`mb-16 w-full`}>
        {label && <Text style={tw`mb-8 text-body-emphasis text-neutral-900`}>{label}</Text>}
        <View style={tw`relative justify-center`}>
          <TextInput
            ref={ref}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            style={[
              tw`w-full rounded-md border bg-neutral-50 px-16 py-12 text-body text-neutral-900`,
              isFocused ? tw`border-primary` : tw`border-neutral-200`,
              error && tw`border-danger`,
              style,
            ]}
            secureTextEntry={isSecure}
            placeholderTextColor="#4B5563"
            {...props}
          />
          {secureTextEntryToggle && (
            <TouchableOpacity
              style={tw`absolute right-16`}
              onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            >
              {isPasswordVisible ? (
                <EyeOff color="#4B5563" size={20} />
              ) : (
                <Eye color="#4B5563" size={20} />
              )}
            </TouchableOpacity>
          )}
        </View>
        {error ? (
          <Text style={tw`mt-4 text-caption text-danger`}>{error}</Text>
        ) : helperText ? (
          <Text style={tw`mt-4 text-caption text-neutral-600`}>{helperText}</Text>
        ) : null}
      </View>
    );
  },
);

Input.displayName = 'Input';

// Wrapper for React Hook Form integration
export function ControlledInput<T extends Record<string, any>>(
  props: InputProps & UseControllerProps<T>,
) {
  const { name, control, rules, defaultValue, ...inputProps } = props;
  const { field, fieldState } = useController({ name, control, rules, defaultValue });

  return (
    <Input
      {...inputProps}
      value={field.value}
      onChangeText={field.onChange}
      onBlur={field.onBlur}
      error={fieldState.error?.message}
    />
  );
}
