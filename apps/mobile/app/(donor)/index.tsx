import { View, Text } from 'react-native';

export default function DonorHome() {
  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <Text className="text-2xl font-bold text-primary-600">Donor Dashboard</Text>
      <Text className="mt-2 text-gray-600">Manage your food listings</Text>
    </View>
  );
}
