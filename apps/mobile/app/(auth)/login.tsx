import { View, Text } from 'react-native';
import { Link } from 'expo-router';

export default function Login() {
  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <Text className="text-2xl font-bold text-primary-600 mb-6">Log In</Text>
      <Link href="/" className="text-accent-600 underline text-base">Back to Home</Link>
    </View>
  );
}
