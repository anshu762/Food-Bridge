import React, { useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useMyListings } from '../../src/hooks/useListings';
import { useMyImpact } from '../../src/hooks/useImpact';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { EmptyState, ErrorState } from '../../src/components/ui/Feedback';
import { Heart, Utensils, Clock, ChevronRight } from 'lucide-react-native';

export default function DonorDashboard() {
  const router = useRouter();
  
  const { 
    data: listings, 
    isLoading: isListingsLoading, 
    isError: isListingsError,
    refetch: refetchListings,
    isRefetching: isListingsRefetching
  } = useMyListings({});

  const {
    data: impact,
    isLoading: isImpactLoading,
    refetch: refetchImpact,
    isRefetching: isImpactRefetching
  } = useMyImpact();

  useFocusEffect(
    useCallback(() => {
      refetchListings();
      refetchImpact();
    }, [refetchListings, refetchImpact])
  );

  const onRefresh = useCallback(() => {
    refetchListings();
    refetchImpact();
  }, [refetchListings, refetchImpact]);

  if (isListingsLoading || isImpactLoading) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  if (isListingsError) {
    return (
      <View className="flex-1 bg-white">
        <ErrorState message="Failed to load dashboard: Could not fetch data" onRetry={onRefresh} />
      </View>
    );
  }

  const allListings = listings || [];
  
  // Calculate stats
  const activeListings = allListings.filter((l: any) => l.status === 'AVAILABLE');
  
  // Find listings that have PENDING requests (and are not themselves resolved completely)
  const listingsWithPendingRequests = allListings.filter((listing: any) => 
    listing.status === 'AVAILABLE' && 
    listing.requests?.some((r: any) => r.status === 'PENDING')
  );

  const totalMealsSaved = impact?.mealsSaved || 0;
  const totalDonations = impact?.donationsCompleted || 0;

  if (allListings.length === 0) {
    return (
      <View className="flex-1 bg-white">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} />}>
          <View className="p-6 pt-12 items-center text-center">
            <Heart color="#059669" size={48} className="mb-4" />
            <Text className="text-2xl font-bold text-gray-900 mb-2">Welcome to FoodBridge!</Text>
            <Text className="text-gray-600 text-center mb-8">You haven't created any food listings yet. Start your journey by donating surplus food.</Text>
            
            <Button 
              onPress={() => router.push('/(donor)/create')} 
              className="w-full"
            >
              Create Your First Donation
            </Button>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView 
        refreshControl={<RefreshControl refreshing={isListingsRefetching || isImpactRefetching} onRefresh={onRefresh} colors={['#059669']} />}
        contentContainerStyle={{ padding: 16 }}
        className="flex-1"
      >
        <Text className="text-xl font-bold text-gray-900 mb-4">Your Impact</Text>
        <View className="flex-row space-x-4 mb-8">
          <Card className="flex-1 bg-emerald-50 border-emerald-100 items-center py-6">
            <Utensils color="#059669" size={24} className="mb-2" />
            <Text className="text-3xl font-bold text-emerald-700">{totalMealsSaved}</Text>
            <Text className="text-sm font-medium text-emerald-600 mt-1">Meals Saved</Text>
          </Card>
          
          <Card className="flex-1 bg-blue-50 border-blue-100 items-center py-6">
            <Heart color="#2563eb" size={24} className="mb-2" />
            <Text className="text-3xl font-bold text-blue-700">{totalDonations}</Text>
            <Text className="text-sm font-medium text-blue-600 mt-1">Completed</Text>
          </Card>
        </View>

        <Text className="text-xl font-bold text-gray-900 mb-4">Dashboard</Text>

        <TouchableOpacity 
          className="bg-white p-4 rounded-2xl border border-gray-100 mb-4 flex-row items-center shadow-sm"
          onPress={() => router.push('/(donor)/listings')}
          activeOpacity={0.7}
        >
          <View className="w-12 h-12 bg-gray-50 rounded-full items-center justify-center mr-4">
            <Utensils color="#4b5563" size={24} />
          </View>
          <View className="flex-1">
            <Text className="font-bold text-gray-900 text-lg">{activeListings.length}</Text>
            <Text className="text-gray-500 font-medium text-sm">Active Listings</Text>
          </View>
          <ChevronRight color="#9ca3af" size={20} />
        </TouchableOpacity>

        <TouchableOpacity 
          className="bg-white p-4 rounded-2xl border border-gray-100 mb-4 flex-row items-center shadow-sm"
          onPress={() => {
            // Navigate to the first listing needing attention, or just the listings tab
            if (listingsWithPendingRequests.length > 0) {
              router.push(`/(donor)/listing/${listingsWithPendingRequests[0].id}` as any);
            } else {
              router.push('/(donor)/listings');
            }
          }}
          activeOpacity={0.7}
        >
          <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${listingsWithPendingRequests.length > 0 ? 'bg-amber-50' : 'bg-gray-50'}`}>
            <Clock color={listingsWithPendingRequests.length > 0 ? "#d97706" : "#4b5563"} size={24} />
          </View>
          <View className="flex-1">
            <Text className="font-bold text-gray-900 text-lg">{listingsWithPendingRequests.length}</Text>
            <Text className={`font-medium text-sm ${listingsWithPendingRequests.length > 0 ? 'text-amber-600' : 'text-gray-500'}`}>
              Pending Requests
            </Text>
            {listingsWithPendingRequests.length > 0 && (
              <Text className="text-xs text-gray-400 mt-1">Tap to review</Text>
            )}
          </View>
          <ChevronRight color="#9ca3af" size={20} />
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}
