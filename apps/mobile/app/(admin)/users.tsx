import { View, Text } from 'react-native';

export default function ManageUsers() {
  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <Text className="text-2xl font-bold text-primary-600">Manage Users</Text>
      <Text className="mt-2 text-gray-600">View and manage user accounts</Text>
    </View>
  );
}
