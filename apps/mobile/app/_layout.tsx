import { useEffect } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Sentry from '@sentry/react-native';
import { AppProvider } from '../src/providers/AppProvider';
import { useAuthStore } from '../src/store/authStore';
import { useNetworkStatus } from '../src/hooks/useNetworkStatus';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN || 'https://public@sentry.example.com/1',
  debug: __DEV__, // If `true`, Sentry will try to print out useful debugging information if something goes wrong with sending the event.
  environment: __DEV__ ? 'development' : 'production',
});

// Store pending deep link that arrived while not logged in
let pendingDeepLink: string | null = null;

export function getPendingDeepLink(): string | null {
  const link = pendingDeepLink;
  pendingDeepLink = null;
  return link;
}

function handleNotificationDeepLink(data: Record<string, any> | undefined) {
  if (!data) return;
  const listingId = data.listingId as string | undefined;
  const user = useAuthStore.getState().user;
  const target = listingId
    ? user?.role === 'DONOR'
      ? `/(donor)/listing/${listingId}`
      : `/(receiver)/listing/${listingId}`
    : null;

  if (!target) return;

  if (user) {
    setTimeout(() => (router as any).push(target), 300);
  } else {
    pendingDeepLink = target;
  }
}

function RootNavigation() {
  const { isHydrated, user } = useAuthStore();
  const segments = useSegments();
  const { isOnline } = useNetworkStatus();
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = Notifications.addNotificationReceivedListener((notification: any) => {
      handleNotificationDeepLink(notification.request.content.data as any);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    Notifications.getLastNotificationResponseAsync().then((response: any) => {
      if (response) {
        handleNotificationDeepLink(response.notification.request.content.data as any);
      }
    });
  }, [isHydrated]);

  // After auth, navigate to pending deep link if any
  useEffect(() => {
    if (isHydrated && user) {
      const link = getPendingDeepLink();
      if (link) {
        setTimeout(() => (router as any).push(link), 500);
      }
    }
  }, [isHydrated, user]);

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

  if (!isHydrated) return null;

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

function RootLayout() {
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

export default Sentry.wrap(RootLayout);
