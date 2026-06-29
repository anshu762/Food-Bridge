import React, { useState, useEffect } from 'react';
import { View, Text, Alert, Platform } from 'react-native';
import * as Location from 'expo-location';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface Step4FormData {
  pickupLat: number;
  pickupLng: number;
  pickupAddress: string;
}

interface Props {
  initialData: Partial<Step4FormData>;
  onNext: (data: Step4FormData) => void;
  onBack: () => void;
}

export function CreateListingStep4({ initialData, onNext, onBack }: Props) {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    initialData.pickupLat && initialData.pickupLng 
      ? { lat: initialData.pickupLat, lng: initialData.pickupLng } 
      : null
  );
  const [address, setAddress] = useState(initialData.pickupAddress || '');

  useEffect(() => {
    if (!location) {
      (async () => {
        try {
          let { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            setLocation({ lat: 37.7749, lng: -122.4194 });
            return;
          }

          let currentLocation = await Location.getCurrentPositionAsync({});
          setLocation({ lat: currentLocation.coords.latitude, lng: currentLocation.coords.longitude });
        } catch (error) {
          setLocation({ lat: 37.7749, lng: -122.4194 });
        }
      })();
    }
  }, []);

  const handleNext = () => {
    if (!location || !address.trim()) {
      Alert.alert('Missing Info', 'Please provide a valid address and location pin.');
      return;
    }
    onNext({
      pickupLat: location.lat,
      pickupLng: location.lng,
      pickupAddress: address,
    });
  };

  return (
    <View className="flex-1 space-y-4">
      <Text className="text-lg font-bold text-gray-900 mb-2">Where is the food?</Text>

      <Input
        label="Pickup Address"
        placeholder="Enter full address or recognizable landmark"
        value={address}
        onChangeText={setAddress}
      />

      <View className="flex-1 rounded-xl overflow-hidden border border-gray-300 mt-2 bg-gray-100 items-center justify-center p-4">
        <Text className="text-gray-600 font-medium text-center mb-2">Interactive Map is disabled on Web</Text>
        <Text className="text-gray-500 text-sm text-center">
          {location ? `Location acquired: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Acquiring location...'}
        </Text>
      </View>
      
      <Text className="text-xs text-gray-500 text-center mb-2">Provide the address above and your location will be attached automatically.</Text>

      <View className="flex-row space-x-4 mt-auto">
        <View className="flex-1">
          <Button variant="ghost" onPress={onBack}>Back</Button>
        </View>
        <View className="flex-1">
          <Button onPress={handleNext} disabled={!address || !location}>Next</Button>
        </View>
      </View>
    </View>
  );
}
