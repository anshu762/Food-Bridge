import { View, Text } from 'react-native';

export default function MyRequests() {
  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <Text className="text-2xl font-bold text-primary-600">My Requests</Text>
      <Text className="mt-2 text-gray-600">Track your donation requests</Text>
    </View>
  );
}
