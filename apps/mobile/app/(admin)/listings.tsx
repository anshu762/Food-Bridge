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
    <View style={tw`flex-1 bg-slate-50`}>
      <View style={tw`bg-white px-4 py-3 border-b border-slate-200 z-10`}>
        <View style={tw`flex-row`}>
          <TouchableOpacity
            style={tw`px-4 py-2 rounded-full border ${filterStatus === 'AVAILABLE' ? 'bg-slate-800 border-slate-800' : 'bg-white border-slate-300'} mr-2`}
            onPress={() => setFilterStatus('AVAILABLE')}
          >
            <Text
              style={tw`text-sm font-semibold ${filterStatus === 'AVAILABLE' ? 'text-white' : 'text-slate-600'}`}
            >
              Available
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={tw`px-4 py-2 rounded-full border ${filterStatus === undefined ? 'bg-slate-800 border-slate-800' : 'bg-white border-slate-300'} mr-2`}
            onPress={() => setFilterStatus(undefined)}
          >
            <Text
              style={tw`text-sm font-semibold ${filterStatus === undefined ? 'text-white' : 'text-slate-600'}`}
            >
              All
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading && !isRefetching ? (
        <View style={tw`p-4`}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} style={tw`w-full h-40 rounded-xl mb-4`} />
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
          contentContainerStyle={tw`p-4 ${listings.length === 0 ? 'flex-1' : ''}`}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
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
              <View style={tw`py-4 items-center`}>
                <Text style={tw`text-slate-500`}>Loading more listings...</Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <View
              style={tw`bg-white rounded-xl border border-slate-200 overflow-hidden mb-4 shadow-sm`}
            >
              <View style={tw`flex-row`}>
                <Image source={{ uri: item.imageUrl }} style={tw`w-32 h-32 bg-slate-200`} />
                <View style={tw`p-3 flex-1 justify-between`}>
                  <View>
                    <View style={tw`flex-row justify-between items-start`}>
                      <Text
                        style={tw`text-base font-bold text-slate-900 mb-1 flex-1`}
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                      <View style={tw`bg-slate-100 px-2 py-0.5 rounded ml-2`}>
                        <Text style={tw`text-slate-600 text-xs font-semibold`}>{item.status}</Text>
                      </View>
                    </View>
                    <Text style={tw`text-slate-600 text-sm`} numberOfLines={1}>
                      {item.donor?.orgName || item.donor?.name || 'Unknown Donor'}
                    </Text>
                    <Text style={tw`text-slate-400 text-xs mt-1`}>
                      {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                    </Text>
                  </View>

                  <View style={tw`flex-row justify-between items-center mt-2`}>
                    <Text style={tw`text-slate-500 text-xs font-medium`}>
                      {item._count?.requests || 0} Requests
                    </Text>

                    {(item.status === 'AVAILABLE' || item.status === 'RESERVED') && (
                      <TouchableOpacity
                        style={tw`bg-red-50 p-2 rounded-full flex-row items-center`}
                        onPress={() => handleRemovePrompt(item.id)}
                      >
                        <Trash2 size={16} color="#ef4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            </View>
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
        <View style={tw`flex-1 bg-black/50 justify-center items-center px-4`}>
          <View style={tw`bg-white w-full rounded-2xl p-6`}>
            <Text style={tw`text-xl font-bold text-slate-900 mb-2`}>Force Remove Listing</Text>
            <Text style={tw`text-slate-600 mb-4`}>
              Please provide a reason for removing this listing. The donor will be notified.
            </Text>

            <TextInput
              style={tw`border border-slate-300 rounded-xl p-4 bg-slate-50 text-slate-900 min-h-[100px] mb-6`}
              placeholder="e.g. Violates community guidelines, not food..."
              placeholderTextColor="#94a3b8"
              value={removeReason}
              onChangeText={setRemoveReason}
              multiline
              textAlignVertical="top"
            />

            <View style={tw`flex-row space-x-3`}>
              <View style={tw`flex-1`}>
                <Button variant="ghost" onPress={() => setRemoveModalVisible(false)}>
                  Cancel
                </Button>
              </View>
              <View style={tw`flex-1`}>
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
