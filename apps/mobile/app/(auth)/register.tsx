import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { registerSchema } from '@food-bridge/shared';
import { ControlledInput } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { TouchableCard } from '../../src/components/ui/Card';
import { useAuthStore } from '../../src/store/authStore';
import { api } from '../../src/services/api';
import { useUI } from '../../src/components/ui/Providers';
import { useNetworkStatus } from '../../src/hooks/useNetworkStatus';
import { HeartHandshake, PackageOpen } from 'lucide-react-native';
import { z } from 'zod';
import tw from '../../src/utils/tw';

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const [role, setRole] = useState<'DONOR' | 'RECEIVER'>('RECEIVER');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuthStore();
  const { showToast } = useUI();
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
    } catch (error: any) {
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
      style={tw`flex-1 bg-surface`}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, paddingTop: 48 }}>
        <View style={tw`mb-24 items-center`}>
          <Text style={tw`text-display text-primary-dark mb-8`}>Create Account</Text>
          <Text style={tw`text-body text-neutral-600 text-center`}>
            Join Food Bridge to start making a difference.
          </Text>
        </View>

        {/* Role Selector */}
        <View style={tw`flex-row justify-between mb-32`}>
          <TouchableCard
            style={[
              tw`flex-1 mr-8 items-center py-24`,
              role === 'RECEIVER' ? tw`border-primary bg-primary-50` : tw`border-neutral-200`,
            ]}
            onPress={() => handleRoleChange('RECEIVER')}
          >
            <PackageOpen size={32} color={role === 'RECEIVER' ? '#1B7A4D' : '#9CA3AF'} />
            <Text
              style={[
                tw`mt-8 text-body-emphasis`,
                role === 'RECEIVER' ? tw`text-primary-dark` : tw`text-neutral-600`,
              ]}
            >
              Receiver
            </Text>
          </TouchableCard>
          <TouchableCard
            style={[
              tw`flex-1 ml-8 items-center py-24`,
              role === 'DONOR' ? tw`border-primary bg-primary-50` : tw`border-neutral-200`,
            ]}
            onPress={() => handleRoleChange('DONOR')}
          >
            <HeartHandshake size={32} color={role === 'DONOR' ? '#1B7A4D' : '#9CA3AF'} />
            <Text
              style={[
                tw`mt-8 text-body-emphasis`,
                role === 'DONOR' ? tw`text-primary-dark` : tw`text-neutral-600`,
              ]}
            >
              Donor
            </Text>
          </TouchableCard>
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

        <Button fullWidth onPress={handleSubmit(onSubmit)} loading={isLoading} style={tw`mt-16`}>
          Sign Up
        </Button>

        <View style={tw`flex-row justify-center mt-24 mb-32`}>
          <Text style={tw`text-body text-neutral-600`}>Already have an account? </Text>
          <Text
            style={tw`text-body-emphasis text-primary`}
            onPress={() => router.push('/(auth)/login')}
          >
            Log In
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
