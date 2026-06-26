import { View, Text } from 'react-native';

export default function CreateListing() {
  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <Text className="text-2xl font-bold text-primary-600">Create Listing</Text>
      <Text className="mt-2 text-gray-600">List surplus food for donation</Text>
    </View>
  );
}
