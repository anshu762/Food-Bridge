import { Tabs } from 'expo-router';
import { Home, List, Bell, BarChart3, User } from 'lucide-react-native';
import { View, Text } from 'react-native';
import { useUnreadCount } from '../../src/hooks/useNotifications';
import tw from '../../src/utils/tw';

function NotificationsBadge() {
  const { data: count } = useUnreadCount();
  if (!count || count === 0) return null;
  return (
    <View style={tw`absolute -top-1 -right-2 bg-red-500 rounded-full h-4 min-w-4 items-center justify-center px-1`}>
      <Text style={tw`text-white text-xs font-bold`}>{count > 9 ? '9+' : count}</Text>
    </View>
  );
}

export default function DonorLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#5f8f2a', headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home color={color} />,
        }}
      />
      <Tabs.Screen
        name="listings"
        options={{
          title: 'Listings',
          tabBarIcon: ({ color }) => <List color={color} />,
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: 'Requests',
          tabBarIcon: ({ color }) => <Bell color={color} />,
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
          title: 'Notifications',
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
