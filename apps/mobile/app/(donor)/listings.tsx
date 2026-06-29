import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useInfiniteMyListings } from '../../src/hooks/useListings';
import { TouchableCard } from '../../src/components/ui/Card';
import { Badge } from '../../src/components/ui/Badge';
import { differenceInHours, differenceInMinutes, formatDistanceToNowStrict } from 'date-fns';
import { ErrorState, EmptyState } from '../../src/components/ui/Feedback';
import tw from '../../src/utils/tw';

const TABS = ['ALL', 'AVAILABLE', 'RESERVED', 'COLLECTED', 'EXPIRED', 'CANCELLED'];

export default function MyListings() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('ALL');

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isRefetching
  } = useInfiniteMyListings(activeTab === 'ALL' ? {} : { status: activeTab });

  const listings = data?.pages.flatMap(page => page) || [];

  const getEmptyStateMessage = () => {
    switch (activeTab) {
      case 'AVAILABLE': return "You don't have any available listings right now.";
      case 'RESERVED': return "None of your listings are currently reserved.";
      case 'COLLECTED': return "No listings have been collected yet.";
      case 'EXPIRED': return "You don't have any expired listings.";
      case 'CANCELLED': return "You haven't cancelled any listings.";
      default: return "You haven't created any food listings yet.";
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const isAvailable = item.status === 'AVAILABLE';
    const safeUntilDate = new Date(item.safeUntil);
    const now = new Date();
    const hoursLeft = differenceInHours(safeUntilDate, now);
    const minsLeft = differenceInMinutes(safeUntilDate, now);
    const isUrgent = isAvailable && hoursLeft < 1 && minsLeft > 0;
    const isExpiredLocally = minsLeft <= 0;

    let timeText = '';
    if (isAvailable) {
      if (isExpiredLocally) {
        timeText = 'Expired';
      } else {
        timeText = `Expires in ${formatDistanceToNowStrict(safeUntilDate)}`;
      }
    }

    return (
      <TouchableCard 
        style={tw`mb-4 flex-row items-center p-3`}
        onPress={() => router.push(`/(donor)/listing/${item.id}` as any)}
      >
        <Image 
          source={{ uri: item.photos[0] }} 
          style={tw`w-20 h-20 rounded-lg bg-gray-100`} 
        />
        <View style={tw`ml-4 flex-1`}>
          <View style={tw`flex-row justify-between items-start mb-1`}>
            <Text style={tw`font-bold text-base text-gray-900 flex-1`} numberOfLines={1}>{item.foodType}</Text>
            <Badge 
              status={item.status} 
            />
          </View>
          <Text style={tw`text-gray-600 text-sm mb-2`}>{item.quantity} {item.unit}</Text>
          
          {isAvailable && !isExpiredLocally && (
            <Text style={tw`text-xs font-medium ${isUrgent ? 'text-red-500' : 'text-gray-500'}`}>
              {timeText}
            </Text>
          )}
          {isAvailable && isExpiredLocally && (
            <Text style={tw`text-xs font-medium text-red-500`}>Expired</Text>
          )}
        </View>
      </TouchableCard>
    );
  };

  return (
    <View style={tw`flex-1 bg-gray-50`}>
      <View style={tw`bg-white pt-4 pb-2 border-b border-gray-100`}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={TABS}
          keyExtractor={(item) => item}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setActiveTab(item)}
              style={tw`px-4 py-2 rounded-full border ${
                activeTab === item 
                  ? 'bg-primary-600 border-primary-600' 
                  : 'bg-white border-gray-200'
              }`}
            >
              <Text 
                style={tw`text-sm font-medium ${
                  activeTab === item ? 'text-white' : 'text-gray-600'
                }`}
              >
                {item.charAt(0) + item.slice(1).toLowerCase()}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {isLoading ? (
        <View style={tw`flex-1 justify-center items-center`}>
          <ActivityIndicator size="large" color="#059669" />
        </View>
      ) : isError ? (
        <ErrorState 
          message={`Couldn't load listings. ${error?.message || "An error occurred."}`} 
          onRetry={refetch as any} 
        />
      ) : listings.length === 0 ? (
        <EmptyState 
          title="No Listings" 
          subtitle={getEmptyStateMessage()} 
          actionLabel={activeTab === 'ALL' ? "Create Listing" : undefined}
          onAction={activeTab === 'ALL' ? () => router.push('/(donor)/create') : undefined}
        />
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          onEndReached={() => {
            if (hasNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={['#059669']} />
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator style={tw`my-4`} color="#059669" />
            ) : null
          }
        />
      )}
    </View>
  );
}