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
  (
    { label, helperText, error, secureTextEntryToggle, secureTextEntry, style, ...props },
    ref,
  ) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const isSecure = secureTextEntry && !isPasswordVisible;

    return (
      <View style={tw`mb-4 w-full`}>
        {label && <Text style={tw`mb-1 text-sm font-medium text-gray-700`}>{label}</Text>}
        <View style={tw`relative justify-center`}>
          <TextInput
            ref={ref}
            style={[
              tw`w-full rounded-xl border bg-gray-50 px-4 py-3 text-base text-gray-900`,
              error ? tw`border-red-500` : tw`border-gray-200`,
              style,
            ]}
            secureTextEntry={isSecure}
            placeholderTextColor="#9CA3AF"
            {...props}
          />
          {secureTextEntryToggle && (
            <TouchableOpacity
              style={tw`absolute right-4`}
              onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            >
              {isPasswordVisible ? (
                <EyeOff color="#6B7280" size={20} />
              ) : (
                <Eye color="#6B7280" size={20} />
              )}
            </TouchableOpacity>
          )}
        </View>
        {error ? (
          <Text style={tw`mt-1 text-sm text-red-500`}>{error}</Text>
        ) : helperText ? (
          <Text style={tw`mt-1 text-sm text-gray-500`}>{helperText}</Text>
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
