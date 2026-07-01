import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { loginSchema } from '@food-bridge/shared';
import { ControlledInput } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { useAuthStore } from '../../src/store/authStore';
import { api } from '../../src/services/api';
import { useUI } from '../../src/components/ui/Providers';
import { useNetworkStatus } from '../../src/hooks/useNetworkStatus';
import { registerForPushNotifications } from '../../src/utils/notifications';
import { z } from 'zod';
import tw from '../../src/utils/tw';

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();
  const { showToast } = useUI();
  const { isOnline } = useNetworkStatus();

  const { control, handleSubmit } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginForm) => {
    if (!isOnline) {
      showToast({
        message: 'You are currently offline. Please check your connection.',
        type: 'error',
      });
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.post('/auth/login', data);

      const { user, accessToken, refreshToken } = res.data.data;
      await login(user, accessToken, refreshToken);
      registerForPushNotifications();
    } catch (error: any) {
      showToast({
        message: error.response?.data?.error || 'Invalid email or password. Please try again.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={tw`flex-1 bg-surface`}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
        <View style={tw`mb-32 items-center`}>
          <Text style={tw`text-display text-primary-dark mb-8`}>Welcome Back</Text>
          <Text style={tw`text-body text-neutral-600 text-center`}>
            Log in to continue your journey with Food Bridge.
          </Text>
        </View>

        <ControlledInput
          control={control}
          name="email"
          label="Email Address"
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <ControlledInput
          control={control}
          name="password"
          label="Password"
          placeholder="Enter your password"
          secureTextEntryToggle
          secureTextEntry
        />

        <Button fullWidth onPress={handleSubmit(onSubmit)} loading={isLoading} style={tw`mt-16`}>
          Log In
        </Button>

        <View style={tw`flex-row justify-center mt-24`}>
          <Text style={tw`text-body text-neutral-600`}>Don't have an account? </Text>
          <Text
            style={tw`text-body-emphasis text-primary`}
            onPress={() => router.push('/(auth)/register')}
          >
            Sign Up
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
