import { useEffect } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text } from 'react-native';
import { AppProvider } from '../src/providers/AppProvider';
import { useAuthStore } from '../src/store/authStore';
import { useNetworkStatus } from '../src/hooks/useNetworkStatus';

function RootNavigation() {
  const { isHydrated, user } = useAuthStore();
  const segments = useSegments();
  const { isOnline } = useNetworkStatus();

  useEffect(() => {
    if (!isHydrated) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inDonorGroup = segments[0] === '(donor)';
    const inReceiverGroup = segments[0] === '(receiver)';
    const inAdminGroup = segments[0] === '(admin)';

    if (!user && !inAuthGroup) {
      (router as any).replace('/(auth)/login');
    } else if (user) {
      if (user.role === 'DONOR' && !inDonorGroup) {
        (router as any).replace('/(donor)');
      } else if (user.role === 'RECEIVER' && !inReceiverGroup) {
        (router as any).replace('/(receiver)');
      } else if (user.role === 'ADMIN' && !inAdminGroup) {
        (router as any).replace('/(admin)');
      }
    }
  }, [user, isHydrated, segments]);

  if (!isHydrated) {
    return null;
  }

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="dark" />
      {!isOnline && (
        <View style={{ paddingTop: 50, backgroundColor: '#EF4444', paddingBottom: 10 }}>
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>
            No Internet Connection
          </Text>
        </View>
      )}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(donor)" />
        <Stack.Screen name="(receiver)" />
        <Stack.Screen name="(admin)" />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <AppProvider>
      <RootNavigation />
    </AppProvider>
  );
}
