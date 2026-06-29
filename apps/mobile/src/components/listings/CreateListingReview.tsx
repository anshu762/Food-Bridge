import React from 'react';
import { View, Text, ScrollView, Image } from 'react-native';
import { Button } from '../ui/Button';
import { DraftListing } from '../../store/useDraftStore';
import { format } from 'date-fns';

interface Props {
  data: DraftListing;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
  error?: string | null;
}

export function CreateListingReview({ data, onSubmit, onBack, isSubmitting, error }: Props) {
  return (
    <View className="flex-1 space-y-4">
      <Text className="text-lg font-bold text-gray-900 mb-2">Review & Submit</Text>

      {error ? (
        <View className="bg-red-50 p-3 rounded-lg border border-red-200">
          <Text className="text-red-600 font-medium">{error}</Text>
        </View>
      ) : null}

      <ScrollView className="flex-1 rounded-xl bg-gray-50 p-4 border border-gray-200">
        <View className="space-y-4">
          <View>
            <Text className="text-xs text-gray-500 uppercase tracking-wider">Food Details</Text>
            <Text className="text-base font-medium text-gray-900">{data.foodType}</Text>
            {data.description ? (
              <Text className="text-sm text-gray-700 mt-1">{data.description}</Text>
            ) : null}
            <Text className="text-sm text-gray-600 mt-1">
              Quantity: {data.quantity} {data.unit}
            </Text>
          </View>

          <View className="h-px bg-gray-200" />

          <View>
            <Text className="text-xs text-gray-500 uppercase tracking-wider">Timing</Text>
            <Text className="text-sm text-gray-900 mt-1">
              <Text className="font-medium">Prepared:</Text> {data.preparedAt ? format(new Date(data.preparedAt), 'PPp') : 'N/A'}
            </Text>
            <Text className="text-sm text-gray-900 mt-1">
              <Text className="font-medium">Safe Until:</Text> {data.safeUntil ? format(new Date(data.safeUntil), 'PPp') : 'N/A'}
            </Text>
          </View>

          <View className="h-px bg-gray-200" />

          <View>
            <Text className="text-xs text-gray-500 uppercase tracking-wider">Pickup Location</Text>
            <Text className="text-sm text-gray-900 mt-1">{data.pickupAddress}</Text>
          </View>

          <View className="h-px bg-gray-200" />

          <View>
            <Text className="text-xs text-gray-500 uppercase tracking-wider mb-2">Photos</Text>
            <ScrollView horizontal className="flex-row space-x-2">
              {data.photos?.map((uri, i) => (
                <Image key={i} source={{ uri }} className="w-16 h-16 rounded-md bg-gray-200" />
              ))}
            </ScrollView>
          </View>
        </View>
      </ScrollView>

      <View className="flex-row space-x-4 mt-4">
        <View className="flex-1">
          <Button variant="ghost" onPress={onBack} disabled={isSubmitting}>Edit</Button>
        </View>
        <View className="flex-1">
          <Button onPress={onSubmit} loading={isSubmitting}>Submit</Button>
        </View>
      </View>
    </View>
  );
}
