import React, { useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useMyListings } from '../../src/hooks/useListings';
import { useMyImpact } from '../../src/hooks/useImpact';
import { Card, TouchableCard } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { ErrorState } from '../../src/components/ui/Feedback';
import { Heart, Utensils, Clock, ChevronRight } from 'lucide-react-native';
import tw from '../../src/utils/tw';

export default function DonorDashboard() {
  const router = useRouter();

  const {
    data: listings,
    isLoading: isListingsLoading,
    isError: isListingsError,
    refetch: refetchListings,
    isRefetching: isListingsRefetching,
  } = useMyListings({});

  const {
    data: impact,
    isLoading: isImpactLoading,
    refetch: refetchImpact,
    isRefetching: isImpactRefetching,
  } = useMyImpact();

  useFocusEffect(
    useCallback(() => {
      refetchListings();
      refetchImpact();
    }, [refetchListings, refetchImpact]),
  );

  const onRefresh = useCallback(() => {
    refetchListings();
    refetchImpact();
  }, [refetchListings, refetchImpact]);

  if (isListingsLoading || isImpactLoading) {
    return (
      <View style={tw`flex-1 bg-white justify-center items-center`}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  if (isListingsError) {
    return (
      <View style={tw`flex-1 bg-white`}>
        <ErrorState message="Failed to load dashboard: Could not fetch data" onRetry={onRefresh} />
      </View>
    );
  }

  const allListings = listings || [];

  // Calculate stats
  const activeListings = allListings.filter((l: any) => l.status === 'AVAILABLE');

  // Find listings that have PENDING requests (and are not themselves resolved completely)
  const listingsWithPendingRequests = allListings.filter(
    (listing: any) =>
      listing.status === 'AVAILABLE' && listing.requests?.some((r: any) => r.status === 'PENDING'),
  );

  const totalMealsSaved = impact?.mealsSaved || 0;
  const totalDonations = impact?.donationsCompleted || 0;

  if (allListings.length === 0) {
    return (
      <View style={tw`flex-1 bg-surface`}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} />}
        >
          <View style={tw`p-24 pt-48 items-center text-center`}>
            <Heart color="#1B7A4D" size={48} style={tw`mb-16`} />
            <Text style={tw`text-h1 text-neutral-900 mb-8`}>Welcome to FoodBridge!</Text>
            <Text style={tw`text-body text-neutral-600 text-center mb-32`}>
              You haven't created any food listings yet. Start your journey by donating surplus
              food.
            </Text>

            <Button onPress={() => router.push('/(donor)/create')} style={tw`w-full`}>
              Create Your First Donation
            </Button>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={tw`flex-1 bg-neutral-50`}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isListingsRefetching || isImpactRefetching}
            onRefresh={onRefresh}
            tintColor="#1B7A4D"
          />
        }
        contentContainerStyle={tw`p-16`}
        style={tw`flex-1`}
      >
        <Text style={tw`text-h2 text-neutral-900 mb-16`}>Your Impact</Text>
        <View style={tw`flex-row gap-16 mb-32`}>
          <Card style={tw`flex-1 bg-primary-50 border-primary-200 items-center py-24`}>
            <Utensils color="#1B7A4D" size={24} style={tw`mb-8`} />
            <Text style={tw`text-display text-primary`}>{totalMealsSaved}</Text>
            <Text style={tw`text-body-emphasis text-primary-700 mt-4`}>Meals Saved</Text>
          </Card>

          <Card style={tw`flex-1 bg-info/10 border-info/20 items-center py-24`}>
            <Heart color="#2E7BD9" size={24} style={tw`mb-8`} />
            <Text style={tw`text-display text-info`}>{totalDonations}</Text>
            <Text style={tw`text-body-emphasis text-info mt-4`}>Completed</Text>
          </Card>
        </View>

        <Text style={tw`text-h2 text-neutral-900 mb-16`}>Dashboard</Text>

        <TouchableCard
          style={tw`mb-16 flex-row items-center p-16`}
          onPress={() => router.push('/(donor)/listings')}
        >
          <View
            style={tw`w-48 h-48 bg-neutral-50 rounded-pill items-center justify-center mr-16 border border-neutral-200`}
          >
            <Utensils color="#4B5563" size={24} />
          </View>
          <View style={tw`flex-1`}>
            <Text style={tw`text-h2 text-neutral-900`}>{activeListings.length}</Text>
            <Text style={tw`text-body text-neutral-600`}>Active Listings</Text>
          </View>
          <ChevronRight color="#4B5563" size={20} />
        </TouchableCard>

        <TouchableCard
          style={tw`mb-16 flex-row items-center p-16`}
          onPress={() => {
            if (listingsWithPendingRequests.length > 0) {
              router.push(`/(donor)/listing/${listingsWithPendingRequests[0].id}` as any);
            } else {
              router.push('/(donor)/listings');
            }
          }}
        >
          <View
            style={tw`w-48 h-48 rounded-pill items-center justify-center mr-16 border ${listingsWithPendingRequests.length > 0 ? 'bg-accent-50 border-accent-200' : 'bg-neutral-50 border-neutral-200'}`}
          >
            <Clock
              color={listingsWithPendingRequests.length > 0 ? '#BA7517' : '#4B5563'}
              size={24}
            />
          </View>
          <View style={tw`flex-1`}>
            <Text style={tw`text-h2 text-neutral-900`}>{listingsWithPendingRequests.length}</Text>
            <Text
              style={tw`text-body ${listingsWithPendingRequests.length > 0 ? 'text-accent-700 font-semibold' : 'text-neutral-600'}`}
            >
              Pending Requests
            </Text>
            {listingsWithPendingRequests.length > 0 && (
              <Text style={tw`text-caption text-neutral-600 mt-4`}>Tap to review</Text>
            )}
          </View>
          <ChevronRight color="#4B5563" size={20} />
        </TouchableCard>
      </ScrollView>
    </View>
  );
}
