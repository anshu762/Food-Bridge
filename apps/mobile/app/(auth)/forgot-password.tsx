import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { forgotPasswordSchema } from '@food-bridge/shared';
import { ControlledInput } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { api } from '../../src/services/api';
import { useToast } from '../../src/components/ui/Toast';
import { useNetworkStatus } from '../../src/hooks/useNetworkStatus';
import { z } from 'zod';

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { showToast } = useToast();
  const { isOnline } = useNetworkStatus();

  const { control, handleSubmit } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    if (!isOnline) {
      showToast({ message: 'You are offline.', type: 'error' });
      return;
    }

    try {
      setIsLoading(true);
      await api.post('/auth/forgot-password', data);
      setIsSuccess(true);
    } catch (error: any) {
      showToast({
        message: error.response?.data?.error || 'Failed to request password reset.',
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
          <Text className="text-3xl font-bold text-primary-600 mb-2">Reset Password</Text>
          <Text className="text-gray-500 text-base">
            Enter your email address and we'll send you a link to reset your password.
          </Text>
        </View>

        {isSuccess ? (
          <View className="bg-green-50 p-4 rounded-xl border border-green-200 mb-6">
            <Text className="text-green-800 font-medium text-center">
              If an account exists with that email, a reset link has been sent. Please check your
              inbox.
            </Text>
            {/* For development purposes, allow manual routing to reset-password screen */}
            {process.env.NODE_ENV !== 'production' && (
              <Button
                variant="ghost"
                className="mt-4"
                onPress={() => router.push('/(auth)/reset-password' as any)}
              >
                [Dev] Go to Reset Screen
              </Button>
            )}
          </View>
        ) : (
          <>
            <ControlledInput
              control={control}
              name="email"
              label="Email Address"
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Button fullWidth onPress={handleSubmit(onSubmit)} loading={isLoading} className="mt-2">
              Send Reset Link
            </Button>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
