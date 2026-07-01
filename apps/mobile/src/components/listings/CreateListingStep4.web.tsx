import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import * as Location from 'expo-location';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ErrorState } from '../ui/Feedback';
import { useUI } from '../ui/Providers';
import tw from '../../utils/tw';

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
  const { showToast } = useUI();
  const [gpsError, setGpsError] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    initialData.pickupLat && initialData.pickupLng
      ? { lat: initialData.pickupLat, lng: initialData.pickupLng }
      : null,
  );
  const [address, setAddress] = useState(initialData.pickupAddress || '');

  useEffect(() => {
    if (!location && !gpsError) {
      (async () => {
        try {
          let { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            setGpsError(true);
            return;
          }

          let currentLocation = await Location.getCurrentPositionAsync({});
          setLocation({
            lat: currentLocation.coords.latitude,
            lng: currentLocation.coords.longitude,
          });
        } catch (error) {
          setGpsError(true);
        }
      })();
    }
  }, []);

  const handleNext = () => {
    if (!location || !address.trim()) {
      showToast({ message: 'Please provide a valid address and location pin.', type: 'error' });
      return;
    }
    onNext({
      pickupLat: location.lat,
      pickupLng: location.lng,
      pickupAddress: address,
    });
  };

  return (
    <View style={tw`flex-1 space-y-4`}>
      <Text style={tw`text-lg font-bold text-gray-900 mb-2`}>Where is the food?</Text>

      <Input
        label="Pickup Address"
        placeholder="Enter full address or recognizable landmark"
        value={address}
        onChangeText={setAddress}
      />

      <View
        style={tw`flex-1 rounded-xl overflow-hidden border border-neutral-200 mt-8 bg-neutral-50 items-center justify-center p-16`}
      >
        {gpsError ? (
          <ErrorState
            message="GPS permission was denied. We need your location to pin the pickup point."
            onRetry={async () => {
              try {
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                  setGpsError(false);
                  let currentLocation = await Location.getCurrentPositionAsync({});
                  setLocation({
                    lat: currentLocation.coords.latitude,
                    lng: currentLocation.coords.longitude,
                  });
                }
              } catch (e) {}
            }}
          />
        ) : (
          <>
            <Text style={tw`text-body-emphasis text-neutral-600 text-center mb-8`}>
              Interactive Map is disabled on Web
            </Text>
            <Text style={tw`text-caption text-neutral-500 text-center`}>
              {location
                ? `Location acquired: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
                : 'Acquiring location...'}
            </Text>
          </>
        )}
      </View>

      <Text style={tw`text-xs text-gray-500 text-center mb-2`}>
        Provide the address above and your location will be attached automatically.
      </Text>

      <View style={tw`flex-row space-x-4 mt-auto`}>
        <View style={tw`flex-1`}>
          <Button variant="ghost" onPress={onBack}>
            Back
          </Button>
        </View>
        <View style={tw`flex-1`}>
          <Button onPress={handleNext} disabled={!address || !location}>
            Next
          </Button>
        </View>
      </View>
    </View>
  );
}
