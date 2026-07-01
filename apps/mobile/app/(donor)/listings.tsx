import React, { useState } from 'react';
import { View, Text, FlatList, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useInfiniteMyListings } from '../../src/hooks/useListings';
import { TouchableCard } from '../../src/components/ui/Card';
import { Badge } from '../../src/components/ui/Badge';
import { differenceInHours, differenceInMinutes, formatDistanceToNowStrict } from 'date-fns';
import { Tabs } from '../../src/components/ui/Tabs';
import { ErrorState, EmptyState, Skeleton } from '../../src/components/ui/Feedback';
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
    isRefetching,
  } = useInfiniteMyListings(activeTab === 'ALL' ? {} : { status: activeTab });

  const listings = data?.pages.flatMap((page) => page) || [];

  const getEmptyStateMessage = () => {
    switch (activeTab) {
      case 'AVAILABLE':
        return "You don't have any available listings right now.";
      case 'RESERVED':
        return 'None of your listings are currently reserved.';
      case 'COLLECTED':
        return 'No listings have been collected yet.';
      case 'EXPIRED':
        return "You don't have any expired listings.";
      case 'CANCELLED':
        return "You haven't cancelled any listings.";
      default:
        return "You haven't created any food listings yet.";
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
        style={tw`mb-16 flex-row items-center p-12`}
        onPress={() => router.push(`/(donor)/listing/${item.id}` as any)}
      >
        <Image source={{ uri: item.photos[0] }} style={tw`w-64 h-64 rounded-sm bg-neutral-200`} />
        <View style={tw`ml-16 flex-1`}>
          <View style={tw`flex-row justify-between items-start mb-4`}>
            <Text style={tw`text-body-emphasis text-neutral-900 flex-1`} numberOfLines={1}>
              {item.foodType}
            </Text>
            <Badge status={item.status} />
          </View>
          <Text style={tw`text-body text-neutral-600 mb-8`}>
            {item.quantity} {item.unit}
          </Text>

          {isAvailable && !isExpiredLocally && (
            <Text
              style={tw`text-caption ${isUrgent ? 'text-danger font-semibold' : 'text-neutral-600'}`}
            >
              {timeText}
            </Text>
          )}
          {isAvailable && isExpiredLocally && (
            <Text style={tw`text-caption font-semibold text-danger`}>Expired</Text>
          )}
        </View>
      </TouchableCard>
    );
  };

  const formattedTabs = TABS.map((t) => ({
    key: t,
    title: t === 'ALL' ? 'All' : t.charAt(0) + t.slice(1).toLowerCase(),
  }));

  return (
    <View style={tw`flex-1 bg-neutral-50`}>
      <View style={tw`bg-surface pt-16`}>
        <Tabs tabs={formattedTabs} activeTab={activeTab} onChange={setActiveTab} />
      </View>

      {isLoading ? (
        <View style={tw`flex-1 p-16 space-y-16`}>
          {[1, 2, 3].map((i) => (
            <View
              key={i}
              style={tw`flex-row bg-surface rounded-lg p-12 border border-neutral-200 shadow-resting mb-16`}
            >
              <Skeleton style={tw`w-64 h-64 rounded-sm`} />
              <View style={tw`ml-16 flex-1 justify-center space-y-8`}>
                <View style={tw`flex-row justify-between items-center`}>
                  <Skeleton style={tw`h-16 w-32 rounded`} />
                  <Skeleton style={tw`h-24 w-24 rounded-pill`} />
                </View>
                <Skeleton style={tw`h-16 w-24 rounded`} />
                <Skeleton style={tw`h-12 w-48 rounded`} />
              </View>
            </View>
          ))}
        </View>
      ) : isError ? (
        <ErrorState
          message={`Couldn't load listings. ${error?.message || 'An error occurred.'}`}
          onRetry={refetch as any}
        />
      ) : listings.length === 0 ? (
        <EmptyState
          title="No Listings"
          subtitle={getEmptyStateMessage()}
          actionLabel={activeTab === 'ALL' ? 'Create Listing' : undefined}
          onAction={activeTab === 'ALL' ? () => router.push('/(donor)/create') : undefined}
        />
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          initialNumToRender={10}
          windowSize={21}
          maxToRenderPerBatch={10}
          contentContainerStyle={tw`p-16`}
          onEndReached={() => {
            if (hasNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#1B7A4D" />
          }
          ListFooterComponent={
            isFetchingNextPage ? <ActivityIndicator style={tw`my-16`} color="#1B7A4D" /> : null
          }
        />
      )}
    </View>
  );
}
