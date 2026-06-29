import { View, Text } from 'react-native';
import tw from '../../src/utils/tw';

export default function MyRequests() {
  return (
    <View style={tw`flex-1 items-center justify-center bg-white px-6`}>
      <Text style={tw`text-2xl font-bold text-primary-600`}>My Requests</Text>
      <Text style={tw`mt-2 text-gray-600`}>Track your donation requests</Text>
    </View>
  );
}