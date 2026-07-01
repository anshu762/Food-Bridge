import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import tw from '../../src/utils/tw';

export default function PrivacyPolicy() {
  const router = useRouter();

  return (
    <View style={tw`flex-1 bg-white`}>
      <View style={tw`flex-row items-center pt-12 pb-4 px-4 border-b border-gray-100`}>
        <TouchableOpacity onPress={() => router.back()} style={tw`mr-4`}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={tw`text-xl font-bold text-gray-900`}>Privacy Policy</Text>
      </View>
      <ScrollView contentContainerStyle={tw`p-6 pb-12`}>
        <Text style={tw`text-gray-700 leading-relaxed mb-4`}>Last updated: October 2023</Text>
        <Text style={tw`text-lg font-bold text-gray-900 mb-2 mt-4`}>1. Information We Collect</Text>
        <Text style={tw`text-gray-700 leading-relaxed mb-4`}>
          We collect information you provide directly to us, such as your name, email address, phone
          number, and location data when you use the Food Bridge app. For verification purposes, we
          may also collect organizational documents or government-issued IDs.
        </Text>
        <Text style={tw`text-lg font-bold text-gray-900 mb-2 mt-4`}>
          2. How We Use Your Information
        </Text>
        <Text style={tw`text-gray-700 leading-relaxed mb-4`}>
          We use the information we collect to operate, maintain, and improve the Food Bridge
          platform. This includes facilitating food donations, verifying users, and providing
          customer support.
        </Text>
        <Text style={tw`text-lg font-bold text-gray-900 mb-2 mt-4`}>3. Location Data</Text>
        <Text style={tw`text-gray-700 leading-relaxed mb-4`}>
          Food Bridge requires access to your location to connect you with nearby food donations and
          to facilitate pickups. You can manage location permissions through your device settings.
        </Text>
        <Text style={tw`text-lg font-bold text-gray-900 mb-2 mt-4`}>4. Sharing of Information</Text>
        <Text style={tw`text-gray-700 leading-relaxed mb-4`}>
          We do not sell your personal information. We only share information with other users to
          the extent necessary to facilitate food donations (e.g., sharing pickup locations and
          contact info upon approved requests).
        </Text>
        <Text style={tw`text-lg font-bold text-gray-900 mb-2 mt-4`}>5. Contact Us</Text>
        <Text style={tw`text-gray-700 leading-relaxed mb-4`}>
          If you have any questions about this Privacy Policy, please contact us at
          support@foodbridge.app.
        </Text>
      </ScrollView>
    </View>
  );
}
