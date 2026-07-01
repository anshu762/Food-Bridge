import React from 'react';
import { View, Text, ScrollView, Image } from 'react-native';
import { Card } from '../ui/Card';
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
    <View style={tw`flex-1 space-y-16`}>
      <Text style={tw`text-h3 text-neutral-900 mb-8`}>Review & Submit</Text>

      {error ? (
        <View style={tw`bg-danger/10 p-12 rounded-lg border border-danger/20`}>
          <Text style={tw`text-danger text-body font-medium`}>{error}</Text>
        </View>
      ) : null}

      <ScrollView style={tw`flex-1`}>
        <Card style={tw`p-16 mb-16 border-neutral-200 bg-surface`}>
          <View style={tw`space-y-16`}>
            <View>
              <Text style={tw`text-overline text-neutral-500 mb-4`}>Food Details</Text>
              <Text style={tw`text-h3 text-neutral-900 mt-4`}>{data.title}</Text>
              <Text style={tw`text-body-emphasis text-neutral-700 mt-4`}>{data.foodType}</Text>
              {data.description ? (
                <Text style={tw`text-body text-neutral-700 mt-4`}>{data.description}</Text>
              ) : null}
              <Text style={tw`text-body text-neutral-600 mt-4`}>
                Quantity: {data.quantity} {data.unit}
              </Text>
            </View>

            <View style={tw`h-px bg-neutral-200 my-8`} />

            <View>
              <Text style={tw`text-overline text-neutral-500 mb-4`}>Timing</Text>
              <Text style={tw`text-body text-neutral-900 mt-4`}>
                <Text style={tw`font-semibold`}>Prepared:</Text>{' '}
                {data.preparedAt ? format(new Date(data.preparedAt), 'PPp') : 'N/A'}
              </Text>
              <Text style={tw`text-body text-neutral-900 mt-4`}>
                <Text style={tw`font-semibold`}>Safe Until:</Text>{' '}
                {data.safeUntil ? format(new Date(data.safeUntil), 'PPp') : 'N/A'}
              </Text>
            </View>

            <View style={tw`h-px bg-neutral-200 my-8`} />

            <View>
              <Text style={tw`text-overline text-neutral-500 mb-4`}>Pickup Location</Text>
              <Text style={tw`text-body text-neutral-900 mt-4`}>{data.pickupAddress}</Text>
            </View>

            <View style={tw`h-px bg-neutral-200 my-8`} />

            <View>
              <Text style={tw`text-overline text-neutral-500 mb-8`}>Photos</Text>
              <ScrollView horizontal style={tw`flex-row gap-8`}>
                {data.photos?.map((uri, i) => (
                  <Image key={i} source={{ uri }} style={tw`w-48 h-48 rounded-md bg-neutral-200`} />
                ))}
              </ScrollView>
            </View>
          </View>
        </Card>
      </ScrollView>

      <View style={tw`flex-row gap-16 mt-16`}>
        <View style={tw`flex-1`}>
          <Button variant="ghost" onPress={onBack} disabled={isSubmitting}>
            Edit
          </Button>
        </View>
        <View style={tw`flex-1`}>
          <Button onPress={onSubmit} loading={isSubmitting}>
            Submit
          </Button>
        </View>
      </View>
    </View>
  );
}
