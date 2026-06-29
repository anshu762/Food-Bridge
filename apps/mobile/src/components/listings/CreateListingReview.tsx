import React from 'react';
import { View, Text, ScrollView, Image } from 'react-native';
import { Button } from '../ui/Button';
import { DraftListing } from '../../store/useDraftStore';
import { format } from 'date-fns';
import tw from '../../utils/tw';

interface Props {
  data: DraftListing;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
  error?: string | null;
}

export function CreateListingReview({ data, onSubmit, onBack, isSubmitting, error }: Props) {
  return (
    <View style={tw`flex-1 space-y-4`}>
      <Text style={tw`text-lg font-bold text-gray-900 mb-2`}>Review & Submit</Text>

      {error ? (
        <View style={tw`bg-red-50 p-3 rounded-lg border border-red-200`}>
          <Text style={tw`text-red-600 font-medium`}>{error}</Text>
        </View>
      ) : null}

      <ScrollView style={tw`flex-1 rounded-xl bg-gray-50 p-4 border border-gray-200`}>
        <View style={tw`space-y-4`}>
          <View>
            <Text style={tw`text-xs text-gray-500 uppercase tracking-wider`}>Food Details</Text>
            <Text style={tw`text-lg font-bold text-gray-900 mt-1`}>{data.title}</Text>
            <Text style={tw`text-base font-medium text-gray-700 mt-1`}>{data.foodType}</Text>
            {data.description ? (
              <Text style={tw`text-sm text-gray-700 mt-1`}>{data.description}</Text>
            ) : null}
            <Text style={tw`text-sm text-gray-600 mt-1`}>
              Quantity: {data.quantity} {data.unit}
            </Text>
          </View>

          <View style={tw`h-px bg-gray-200`} />

          <View>
            <Text style={tw`text-xs text-gray-500 uppercase tracking-wider`}>Timing</Text>
            <Text style={tw`text-sm text-gray-900 mt-1`}>
              <Text style={tw`font-medium`}>Prepared:</Text> {data.preparedAt ? format(new Date(data.preparedAt), 'PPp') : 'N/A'}
            </Text>
            <Text style={tw`text-sm text-gray-900 mt-1`}>
              <Text style={tw`font-medium`}>Safe Until:</Text> {data.safeUntil ? format(new Date(data.safeUntil), 'PPp') : 'N/A'}
            </Text>
          </View>

          <View style={tw`h-px bg-gray-200`} />

          <View>
            <Text style={tw`text-xs text-gray-500 uppercase tracking-wider`}>Pickup Location</Text>
            <Text style={tw`text-sm text-gray-900 mt-1`}>{data.pickupAddress}</Text>
          </View>

          <View style={tw`h-px bg-gray-200`} />

          <View>
            <Text style={tw`text-xs text-gray-500 uppercase tracking-wider mb-2`}>Photos</Text>
            <ScrollView horizontal style={tw`flex-row space-x-2`}>
              {data.photos?.map((uri, i) => (
                <Image key={i} source={{ uri }} style={tw`w-16 h-16 rounded-md bg-gray-200`} />
              ))}
            </ScrollView>
          </View>
        </View>
      </ScrollView>

      <View style={tw`flex-row space-x-4 mt-4`}>
        <View style={tw`flex-1`}>
          <Button variant="ghost" onPress={onBack} disabled={isSubmitting}>Edit</Button>
        </View>
        <View style={tw`flex-1`}>
          <Button onPress={onSubmit} loading={isSubmitting}>Submit</Button>
        </View>
      </View>
    </View>
  );
}