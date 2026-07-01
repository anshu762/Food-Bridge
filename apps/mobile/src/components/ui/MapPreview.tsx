import React from 'react';
import { View, Text } from 'react-native';
import { MapPin } from 'lucide-react-native';
import tw from '../../utils/tw';

interface MapPreviewProps {
  distance: string;
  locationName: string;
}

export const MapPreview = ({ distance, locationName }: MapPreviewProps) => {
  return (
    <View
      style={tw`bg-neutral-50 rounded-lg h-128 w-full items-center justify-center relative overflow-hidden border border-neutral-200`}
    >
      {/* Mock map background */}
      <View style={tw`absolute inset-0 bg-primary-50 opacity-50`} />

      {/* Distance Pill */}
      <View
        style={tw`bg-surface px-12 py-8 rounded-pill shadow-resting flex-row items-center border border-neutral-100 z-10`}
      >
        <MapPin color="#1B7A4D" size={16} />
        <Text style={tw`ml-8 text-body-emphasis text-neutral-900`}>{distance}</Text>
        <Text style={tw`ml-4 text-body text-neutral-600`}>• {locationName}</Text>
      </View>
    </View>
  );
};
