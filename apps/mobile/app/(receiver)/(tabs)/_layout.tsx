import { Tabs } from 'expo-router';
import { Home, Search, PackageOpen, User } from 'lucide-react-native';

export default function ReceiverTabsLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#5f8f2a', headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color }) => <Home color={color} />,
        }}
      />
      <Tabs.Screen
        name="browse"
        options={{
          title: 'Browse',
          tabBarIcon: ({ color }) => <Search color={color} />,
        }}
      />
      <Tabs.Screen
        name="my-requests"
        options={{
          title: 'My Requests',
          tabBarIcon: ({ color }) => <PackageOpen color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User color={color} />,
        }}
      />
    </Tabs>
  );
}
