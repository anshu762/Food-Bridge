import { Tabs } from 'expo-router';
import { Users, FileCheck, ShieldAlert } from 'lucide-react-native';

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#0f172a', // Slate-900
        tabBarInactiveTintColor: '#64748b', // Slate-500
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#f1f5f9', // Slate-100
          elevation: 0,
          shadowOpacity: 0,
        },
        headerStyle: {
          backgroundColor: '#ffffff',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#f1f5f9',
        },
        headerTitleStyle: {
          fontWeight: 'bold',
          color: '#0f172a',
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
