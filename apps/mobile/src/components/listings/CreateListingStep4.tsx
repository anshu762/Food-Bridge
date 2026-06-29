import React, { useState, useEffect } from 'react';
import { View, Text, Alert } from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker, Region } from 'react-native-maps';
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!location) {
      (async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          // Fallback location if permission denied (e.g., center of a generic city)
          setLocation({ lat: 37.7749, lng: -122.4194 });
          return;
        }

        let currentLocation = await Location.getCurrentPositionAsync({});
        setLocation({ lat: currentLocation.coords.latitude, lng: currentLocation.coords.longitude });
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

  const initialRegion: Region | undefined = location ? {
    latitude: location.lat,
    longitude: location.lng,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  } : undefined;

  return (
    <View className="flex-1 space-y-4">
      <Text className="text-lg font-bold text-gray-900 mb-2">Where is the food?</Text>

      <Input
        label="Pickup Address"
        placeholder="Enter full address or recognizable landmark"
        value={address}
        onChangeText={setAddress}
      />

      <View className="flex-1 rounded-xl overflow-hidden border border-gray-300 mt-2">
        {location ? (
          <MapView
            style={{ flex: 1 }}
            initialRegion={initialRegion}
            onPress={(e) => setLocation({ 
              lat: e.nativeEvent.coordinate.latitude, 
              lng: e.nativeEvent.coordinate.longitude 
            })}
          >
            <Marker 
              coordinate={{ latitude: location.lat, longitude: location.lng }}
              draggable
              onDragEnd={(e) => setLocation({ 
                lat: e.nativeEvent.coordinate.latitude, 
                lng: e.nativeEvent.coordinate.longitude 
              })}
            />
          </MapView>
        ) : (
          <View className="flex-1 items-center justify-center bg-gray-100">
            <Text className="text-gray-500">Loading map...</Text>
          </View>
        )}
      </View>
      <Text className="text-xs text-gray-500 text-center mb-2">You can drag the pin or tap to adjust the exact location.</Text>

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
