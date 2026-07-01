import { Tabs } from 'expo-router';
import { Home, Search, PackageOpen, Bell, BarChart3, User } from 'lucide-react-native';
import { View, Text } from 'react-native';
import { useUnreadCount } from '../../../src/hooks/useNotifications';
import tw from '../../../src/utils/tw';

function NotificationsBadge() {
  const { data: count } = useUnreadCount();
  if (!count || count === 0) return null;
  return (
    <View
      style={tw`absolute -top-4 -right-8 bg-danger rounded-pill h-16 min-w-[16px] items-center justify-center px-4`}
    >
      <Text style={tw`text-surface text-caption font-bold`}>{count > 9 ? '9+' : count}</Text>
    </View>
  );
}

export default function ReceiverTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1B7A4D',
        tabBarInactiveTintColor: '#4B5563',
        headerShown: false,
      }}
    >
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
        name="impact"
        options={{
          title: 'Impact',
          tabBarIcon: ({ color }) => <BarChart3 color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color }) => (
            <View>
              <Bell color={color} />
              <NotificationsBadge />
            </View>
          ),
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
