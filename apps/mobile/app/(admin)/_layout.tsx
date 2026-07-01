import { Tabs } from 'expo-router';
import { Users, FileCheck, ShieldAlert } from 'lucide-react-native';

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#1B7A4D',
        tabBarInactiveTintColor: '#4B5563',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          elevation: 0,
          shadowOpacity: 0,
        },
        headerStyle: {
          backgroundColor: '#FFFFFF',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#E5E7EB',
        },
        headerTitleStyle: {
          fontWeight: '700',
          color: '#111827',
          fontSize: 20,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Pending Verifications',
          tabBarLabel: 'Verifications',
          tabBarIcon: ({ color }) => <FileCheck color={color} />,
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: 'Users',
          tabBarLabel: 'Users',
          tabBarIcon: ({ color }) => <Users color={color} />,
        }}
      />
      <Tabs.Screen
        name="listings"
        options={{
          title: 'Moderation',
          tabBarLabel: 'Moderation',
          tabBarIcon: ({ color }) => <ShieldAlert color={color} />,
        }}
      />
    </Tabs>
  );
}
