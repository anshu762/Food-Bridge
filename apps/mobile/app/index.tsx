import { View, Text } from 'react-native';

export default function Home() {
  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <Text className="text-4xl font-bold text-primary-600">Food Bridge</Text>
      <Text className="mt-3 text-lg text-accent-600 text-center">
        Bridging surplus. Nourishing lives.
      </Text>
      <View className="mt-12 w-full rounded-2xl bg-primary-300 items-center justify-center py-16">
        <Text className="text-primary-600 text-xl font-semibold">Primary 300</Text>
      </View>
      <View className="mt-4 w-full rounded-2xl bg-primary-600 items-center justify-center py-16">
        <Text className="text-white text-xl font-semibold">Primary 600</Text>
      </View>
      <View className="mt-4 w-full rounded-2xl bg-accent-600 items-center justify-center py-8">
        <Text className="text-white text-xl font-semibold">Accent 600</Text>
      </View>
    </View>
  );
}
