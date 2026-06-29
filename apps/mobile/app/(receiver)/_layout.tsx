import { Stack } from 'expo-router';

export default function ReceiverLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="listing/[id]"
        options={{
          title: 'Listing Details',
          headerShown: true,
          headerTintColor: '#3B6D11',
        }}
      />
    </Stack>
  );
}
