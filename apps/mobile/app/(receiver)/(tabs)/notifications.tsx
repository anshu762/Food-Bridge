import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Bell, BellRing, ChevronRight } from 'lucide-react-native';
import { formatDistanceToNow } from 'date-fns';
import tw from '../../../src/utils/tw';
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
} from '../../../src/hooks/useNotifications';
import { Skeleton, EmptyState, ErrorState } from '../../../src/components/ui/Feedback';
import { Button } from '../../../src/components/ui/Button';
import type { AppNotification } from '../../../src/services/notifications';

function NotificationItem({ item, onPress }: { item: AppNotification; onPress: () => void }) {
  const relativeTime = (() => {
    try {
      return formatDistanceToNow(new Date(item.createdAt), { addSuffix: true });
    } catch {
      return '';
    }
  })();

  return (
    <TouchableOpacity
      style={tw`flex-row items-center px-6 py-4 border-b border-gray-100 ${!item.read ? 'bg-primary-50/30' : ''}`}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={tw`h-10 w-10 rounded-full ${item.read ? 'bg-gray-100' : 'bg-primary-100'} items-center justify-center mr-3`}
      >
        {item.read ? <Bell size={18} color="#9CA3AF" /> : <BellRing size={18} color="#3B6D11" />}
      </View>
      <View style={tw`flex-1`}>
        <Text
          style={tw`text-sm font-semibold text-gray-900 ${item.read ? '' : ''}`}
          numberOfLines={1}
        >
          {item.title}
        </Text>
        <Text style={tw`text-xs text-gray-500 mt-0.5`} numberOfLines={2}>
          {item.message}
        </Text>
        {relativeTime ? <Text style={tw`text-xs text-gray-400 mt-0.5`}>{relativeTime}</Text> : null}
      </View>
      <ChevronRight size={16} color="#D1D5DB" />
    </TouchableOpacity>
  );
}

function NotificationsSkeleton() {
  return (
    <View style={tw`px-6 pt-4`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={tw`flex-row items-center mb-4`}>
          <Skeleton style={tw`h-10 w-10 rounded-full mr-3`} />
          <View style={tw`flex-1`}>
            <Skeleton style={tw`h-4 w-3/4 mb-1`} />
            <Skeleton style={tw`h-3 w-1/2`} />
          </View>
        </View>
      ))}
    </View>
  );
}

export default function ReceiverNotifications() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, refetch, isRefetching } = useNotifications(page);
  const { mutate: markRead } = useMarkAsRead();
  const { mutate: markAllRead, isPending: markingAll } = useMarkAllAsRead();

  const notifications = data?.notifications ?? [];
  const meta = data?.meta;

  const handleNotificationPress = useCallback(
    (item: AppNotification) => {
      if (!item.read) markRead(item.id);

      const listingId = item.data?.listingId;
      if (listingId) {
        (router as any).push(`/(receiver)/listing/${listingId}`);
      }
    },
    [markRead],
  );

  const handleLoadMore = useCallback(() => {
    if (meta && page < meta.totalPages) {
      setPage((p) => p + 1);
    }
  }, [page, meta]);

  const handleRefresh = useCallback(() => {
    setPage(1);
    refetch();
  }, [refetch]);

  const renderEmpty = useCallback(() => {
    if (isLoading) return null;
    return (
      <EmptyState
        title="No notifications yet"
        subtitle="When someone interacts with your listings or requests, you'll see it here."
        icon={Bell}
      />
    );
  }, [isLoading]);

  if (isLoading && notifications.length === 0) return <NotificationsSkeleton />;

  if (isError && notifications.length === 0) {
    return (
      <ErrorState
        message={(error as any)?.message || 'Failed to load notifications'}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <View style={tw`flex-1 bg-white`}>
      {notifications.length > 0 && (
        <View style={tw`px-6 py-3 border-b border-gray-100`}>
          <Button variant="ghost" size="sm" loading={markingAll} onPress={() => markAllRead()}>
            Mark All as Read
          </Button>
        </View>
      )}
      <FlatList
        data={notifications}
        renderItem={({ item }) => (
          <NotificationItem item={item} onPress={() => handleNotificationPress(item)} />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={notifications.length === 0 ? tw`flex-1` : tw`pb-8`}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} tintColor="#3B6D11" />
        }
      />
    </View>
  );
}
