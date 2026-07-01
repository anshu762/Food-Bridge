import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Image,
} from 'react-native';
import { useAdminListings, useRemoveListing } from '../../src/hooks/useAdmin';
import { Skeleton, ErrorState, EmptyState } from '../../src/components/ui/Feedback';
import { Button } from '../../src/components/ui/Button';
import { ShieldAlert, Trash2 } from 'lucide-react-native';
import tw from '../../src/utils/tw';
import { formatDistanceToNow } from 'date-fns';
import { useUI } from '../../src/components/ui/Providers';
import { Card } from '../../src/components/ui/Card';

export default function ListingsModerationScreen() {
  const [filterStatus, setFilterStatus] = useState<string | undefined>('AVAILABLE');

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAdminListings(filterStatus);

  const removeMutation = useRemoveListing();
  const { showToast } = useUI();

  const [removeModalVisible, setRemoveModalVisible] = useState(false);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [removeReason, setRemoveReason] = useState('');

  const listings = data?.pages.flatMap((page) => page.data) || [];

  const handleRemovePrompt = (id: string) => {
    setSelectedListingId(id);
    setRemoveReason('');
    setRemoveModalVisible(true);
  };

  const submitRemove = async () => {
    if (!selectedListingId || !removeReason.trim()) {
      showToast({ message: 'Please provide a reason for removal.', type: 'error' });
      return;
    }

    try {
      await removeMutation.mutateAsync({ id: selectedListingId, reason: removeReason.trim() });
      setRemoveModalVisible(false);
      showToast({ message: 'Listing forcefully removed', type: 'info' });
    } catch (err: unknown) {
      const errorMessage =
        err && typeof err === 'object' && 'response' in err
          ? String(
              (err as { response?: { data?: { error?: string } } }).response?.data?.error ||
                'Failed to remove listing',
            )
          : 'Failed to remove listing';
      showToast({ message: errorMessage, type: 'error' });
    }
  };

  return (
    <View style={tw`flex-1 bg-neutral-50`}>
      <View style={tw`bg-surface px-16 py-12 border-b border-neutral-200 z-10`}>
        <View style={tw`flex-row`}>
          <TouchableOpacity
            style={tw`px-16 py-8 rounded-pill border ${filterStatus === 'AVAILABLE' ? 'bg-primary border-primary' : 'bg-surface border-neutral-200'} mr-8`}
            onPress={() => setFilterStatus('AVAILABLE')}
          >
            <Text
              style={tw`text-caption font-semibold ${filterStatus === 'AVAILABLE' ? 'text-white' : 'text-neutral-600'}`}
            >
              Available
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={tw`px-16 py-8 rounded-pill border ${filterStatus === undefined ? 'bg-primary border-primary' : 'bg-surface border-neutral-200'} mr-8`}
            onPress={() => setFilterStatus(undefined)}
          >
            <Text
              style={tw`text-caption font-semibold ${filterStatus === undefined ? 'text-white' : 'text-neutral-600'}`}
            >
              All
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading && !isRefetching ? (
        <View style={tw`p-16`}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} style={tw`w-full h-160 rounded-md mb-16`} />
          ))}
        </View>
      ) : isError ? (
        <ErrorState
          message={error instanceof Error ? error.message : 'Failed to load listings'}
          onRetry={refetch}
        />
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={tw`p-16 ${listings.length === 0 ? 'flex-1' : ''}`}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#1B7A4D" />
          }
          ListEmptyComponent={
            <EmptyState
              title="No listings found"
              subtitle="There are no listings matching the current filter."
              icon={ShieldAlert}
            />
          }
          initialNumToRender={5}
          windowSize={11}
          maxToRenderPerBatch={5}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={tw`py-16 items-center`}>
                <Text style={tw`text-neutral-500`}>Loading more listings...</Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <Card style={tw`mb-16 overflow-hidden bg-surface border-neutral-200 p-0`}>
              <View style={tw`flex-row`}>
                <Image source={{ uri: item.imageUrl }} style={tw`w-128 h-128 bg-neutral-200`} />
                <View style={tw`p-12 flex-1 justify-between`}>
                  <View>
                    <View style={tw`flex-row justify-between items-start`}>
                      <Text
                        style={tw`text-body-emphasis text-neutral-900 mb-4 flex-1`}
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                      <View style={tw`bg-neutral-100 px-8 py-2 rounded ml-8`}>
                        <Text style={tw`text-neutral-600 text-caption font-semibold`}>
                          {item.status}
                        </Text>
                      </View>
                    </View>
                    <Text style={tw`text-neutral-600 text-body`} numberOfLines={1}>
                      {item.donor?.orgName || item.donor?.name || 'Unknown Donor'}
                    </Text>
                    <Text style={tw`text-neutral-400 text-caption mt-4`}>
                      {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                    </Text>
                  </View>

                  <View style={tw`flex-row justify-between items-center mt-8`}>
                    <Text style={tw`text-neutral-500 text-caption font-medium`}>
                      {item._count?.requests || 0} Requests
                    </Text>

                    {(item.status === 'AVAILABLE' || item.status === 'RESERVED') && (
                      <TouchableOpacity
                        style={tw`bg-danger/10 p-8 rounded-pill flex-row items-center`}
                        onPress={() => handleRemovePrompt(item.id)}
                      >
                        <Trash2 size={16} color="#D9432E" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            </Card>
          )}
        />
      )}

      {/* Remove Reason Modal */}
      <Modal
        visible={removeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRemoveModalVisible(false)}
      >
        <View style={tw`flex-1 bg-neutral-900/50 justify-center items-center px-16`}>
          <View style={tw`bg-surface w-full rounded-md p-24`}>
            <Text style={tw`text-h2 font-bold text-neutral-900 mb-8`}>Force Remove Listing</Text>
            <Text style={tw`text-body text-neutral-600 mb-16`}>
              Please provide a reason for removing this listing. The donor will be notified.
            </Text>

            <TextInput
              style={tw`border border-neutral-200 rounded-md p-16 bg-neutral-50 text-neutral-900 min-h-[100px] mb-24`}
              placeholder="e.g. Violates community guidelines, not food..."
              placeholderTextColor="#9CA3AF"
              value={removeReason}
              onChangeText={setRemoveReason}
              multiline
              textAlignVertical="top"
            />

            <View style={tw`flex-row space-x-12`}>
              <View style={tw`flex-1 mr-8`}>
                <Button variant="ghost" onPress={() => setRemoveModalVisible(false)}>
                  Cancel
                </Button>
              </View>
              <View style={tw`flex-1 ml-8`}>
                <Button variant="primary" onPress={submitRemove} loading={removeMutation.isPending}>
                  Remove
                </Button>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
