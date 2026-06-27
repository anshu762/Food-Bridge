import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { resetPasswordSchema } from '@food-bridge/shared';
import { ControlledInput } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { api } from '../../src/services/api';
import { useToast } from '../../src/components/ui/Toast';
import { useNetworkStatus } from '../../src/hooks/useNetworkStatus';
import { z } from 'zod';

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();
  const { isOnline } = useNetworkStatus();

  const { control, handleSubmit } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token: '', newPassword: '' },
  });

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!isOnline) {
      showToast({ message: 'You are offline.', type: 'error' });
      return;
    }

    try {
      setIsLoading(true);
      await api.post('/auth/reset-password', data);
      showToast({ message: 'Password reset successfully! Please log in.', type: 'success' });
      router.replace('/(auth)/login');
    } catch (error: any) {
      showToast({
        message:
          error.response?.data?.error || 'Failed to reset password. The token may be invalid.',
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
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, paddingTop: 60 }}>
        <Button
          variant="ghost"
          className="self-start px-0 mb-6 border-0"
          onPress={() => router.back()}
        >
          ← Back to Login
        </Button>

        <View className="mb-8">
          <Text className="text-3xl font-bold text-primary-600 mb-2">Create New Password</Text>
          <Text className="text-gray-500 text-base">
            Please enter your reset token and a new secure password.
          </Text>
        </View>

        <ControlledInput
          control={control}
          name="token"
          label="Reset Token"
          placeholder="Paste your reset token here"
          autoCapitalize="none"
        />

        <ControlledInput
          control={control}
          name="newPassword"
          label="New Password"
          placeholder="Enter a new password"
          secureTextEntryToggle
          secureTextEntry
        />

        <Button fullWidth onPress={handleSubmit(onSubmit)} loading={isLoading} className="mt-4">
          Reset Password
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
