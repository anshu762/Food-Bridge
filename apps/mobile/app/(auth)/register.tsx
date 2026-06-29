import React, { useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { registerSchema } from '@food-bridge/shared';
import { ControlledInput } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { useAuthStore } from '../../src/store/authStore';
import { api } from '../../src/services/api';
import { useToast } from '../../src/components/ui/Toast';
import { useNetworkStatus } from '../../src/hooks/useNetworkStatus';
import { z } from 'zod';
import { cn } from '../../src/utils/cn';

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const [role, setRole] = useState<'DONOR' | 'RECEIVER'>('RECEIVER');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuthStore();
  const { showToast } = useToast();
  const { isOnline } = useNetworkStatus();

  const { control, handleSubmit, setValue } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', role: 'RECEIVER', orgName: '', name: '', phone: '' },
    mode: 'onBlur',
  });

  const handleRoleChange = (newRole: 'DONOR' | 'RECEIVER') => {
    setRole(newRole);
    setValue('role', newRole, { shouldValidate: true });
  };

  const onSubmit = async (data: RegisterForm) => {
    if (!isOnline) {
      showToast({
        message: 'You are currently offline. Please check your connection.',
        type: 'error',
      });
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.post('/auth/register', data);

      const { user, accessToken, refreshToken } = res.data.data;
      await login(user, accessToken, refreshToken);
      // Navigation is handled by authStore
    } catch (error: any) {
      // Show specific field errors if returned by backend, else generic
      showToast({
        message: error.response?.data?.error || 'Failed to register. Please try again.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, paddingTop: 40 }}>
        <View className="mb-6 items-center">
          <Text className="text-3xl font-bold text-primary-600 mb-2">Create Account</Text>
          <Text className="text-gray-500 text-center text-base">
            Join Food Bridge to start making a difference.
          </Text>
        </View>

        {/* Role Selector */}
        <View className="flex-row bg-gray-100 rounded-xl p-1 mb-6">
          <TouchableOpacity
            onPress={() => handleRoleChange('RECEIVER')}
            className={cn(
              'flex-1 py-3 items-center rounded-lg',
              role === 'RECEIVER' && 'bg-white shadow-sm',
            )}
          >
            <Text
              className={cn(
                'font-semibold',
                role === 'RECEIVER' ? 'text-primary-700' : 'text-gray-500',
              )}
            >
              Receiver
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleRoleChange('DONOR')}
            className={cn(
              'flex-1 py-3 items-center rounded-lg',
              role === 'DONOR' && 'bg-white shadow-sm',
            )}
          >
            <Text
              className={cn(
                'font-semibold',
                role === 'DONOR' ? 'text-primary-700' : 'text-gray-500',
              )}
            >
              Donor
            </Text>
          </TouchableOpacity>
        </View>

        <ControlledInput control={control} name="name" label="Full Name" placeholder="John Doe" />

        {role === 'DONOR' && (
          <ControlledInput
            control={control}
            name="orgName"
            label="Organization Name"
            placeholder="Food Bank Inc."
          />
        )}

        <ControlledInput
          control={control}
          name="email"
          label="Email Address"
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <ControlledInput
          control={control}
          name="phone"
          label="Phone Number"
          placeholder="+1 234 567 8900"
          keyboardType="phone-pad"
        />

        <ControlledInput
          control={control}
          name="password"
          label="Password"
          placeholder="Create a strong password"
          secureTextEntryToggle
          secureTextEntry
        />

        <Button fullWidth onPress={handleSubmit(onSubmit)} loading={isLoading} className="mt-4">
          Sign Up
        </Button>

        <View className="flex-row justify-center mt-6 mb-8">
          <Text className="text-gray-500">Already have an account? </Text>
          <Text
            className="text-primary-600 font-semibold"
            onPress={() => router.push('/(auth)/login')}
          >
            Log In
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
