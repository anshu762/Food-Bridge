import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import tw from '../../src/utils/tw';

export default function TermsOfService() {
  const router = useRouter();

  return (
    <View style={tw`flex-1 bg-white`}>
      <View style={tw`flex-row items-center pt-12 pb-4 px-4 border-b border-gray-100`}>
        <TouchableOpacity onPress={() => router.back()} style={tw`mr-4`}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={tw`text-xl font-bold text-gray-900`}>Terms of Service</Text>
      </View>
      <ScrollView contentContainerStyle={tw`p-6 pb-12`}>
        <Text style={tw`text-gray-700 leading-relaxed mb-4`}>Last updated: October 2023</Text>
        <Text style={tw`text-lg font-bold text-gray-900 mb-2 mt-4`}>1. Acceptance of Terms</Text>
        <Text style={tw`text-gray-700 leading-relaxed mb-4`}>
          By accessing or using the Food Bridge application, you agree to be bound by these Terms of
          Service. If you disagree with any part of the terms, you may not access the service.
        </Text>
        <Text style={tw`text-lg font-bold text-gray-900 mb-2 mt-4`}>
          2. Food Safety & Liability
        </Text>
        <Text style={tw`text-gray-700 leading-relaxed mb-4`}>
          Food Bridge is a platform facilitating the donation of food. Donors agree to only list
          food that is safe for human consumption. Receivers accept food at their own risk. Food
          Bridge is not liable for any illness, injury, or damages arising from the consumption of
          donated food.
        </Text>
        <Text style={tw`text-lg font-bold text-gray-900 mb-2 mt-4`}>
          3. User Accounts & Verification
        </Text>
        <Text style={tw`text-gray-700 leading-relaxed mb-4`}>
          Users must provide accurate information when registering. Donors must complete the
          verification process to list food. Food Bridge reserves the right to suspend or terminate
          accounts that violate our guidelines.
        </Text>
        <Text style={tw`text-lg font-bold text-gray-900 mb-2 mt-4`}>4. Acceptable Use</Text>
        <Text style={tw`text-gray-700 leading-relaxed mb-4`}>
          You agree not to use the platform for any unlawful purpose, to harass other users, or to
          list non-food items. We reserve the right to remove any listings or ban users at our
          discretion.
        </Text>
      </ScrollView>
    </View>
  );
}
