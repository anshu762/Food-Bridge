import { View, Text } from 'react-native';
import tw from '../../src/utils/tw';

export default function ManageUsers() {
  return (
    <View style={tw`flex-1 items-center justify-center bg-white px-6`}>
      <Text style={tw`text-2xl font-bold text-primary-600`}>Manage Users</Text>
      <Text style={tw`mt-2 text-gray-600`}>View and manage user accounts</Text>
    </View>
  );
}