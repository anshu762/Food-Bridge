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
      style={tw`flex-row items-center p-16 border-b border-neutral-100 ${!item.read ? 'bg-primary-50/30' : 'bg-surface'}`}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={tw`h-48 w-48 rounded-full ${item.read ? 'bg-neutral-100' : 'bg-primary-100'} items-center justify-center mr-12`}
      >
        {item.read ? <Bell size={24} color="#9CA3AF" /> : <BellRing size={24} color="#1B7A4D" />}
      </View>
      <View style={tw`flex-1`}>
        <Text style={tw`text-body-emphasis text-neutral-900`} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={tw`text-caption text-neutral-500 mt-4`} numberOfLines={2}>
          {item.message}
        </Text>
        {relativeTime ? (
          <Text style={tw`text-caption text-neutral-400 mt-4`}>{relativeTime}</Text>
        ) : null}
      </View>
      <ChevronRight size={16} color="#D1D5DB" />
    </TouchableOpacity>
  );
}

function NotificationsSkeleton() {
  return (
    <View style={tw`px-16 pt-16`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={tw`flex-row items-center mb-16`}>
          <Skeleton style={tw`h-48 w-48 rounded-full mr-12`} />
          <View style={tw`flex-1`}>
            <Skeleton style={tw`h-16 w-3/4 mb-4`} />
            <Skeleton style={tw`h-12 w-1/2`} />
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
    <View style={tw`flex-1 bg-surface`}>
      {notifications.length > 0 && (
        <View style={tw`px-16 py-12 border-b border-neutral-100`}>
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
        contentContainerStyle={notifications.length === 0 ? tw`flex-1` : tw`pb-32`}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} tintColor="#1B7A4D" />
        }
      />
    </View>
  );
}
