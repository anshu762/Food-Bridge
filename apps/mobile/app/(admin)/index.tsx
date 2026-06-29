import { View, Text } from 'react-native';
import tw from '../../src/utils/tw';

export default function AdminHome() {
  return (
    <View style={tw`flex-1 items-center justify-center bg-white px-6`}>
      <Text style={tw`text-2xl font-bold text-primary-600`}>Admin Panel</Text>
      <Text style={tw`mt-2 text-gray-600`}>Manage users and listings</Text>
    </View>
  );
}