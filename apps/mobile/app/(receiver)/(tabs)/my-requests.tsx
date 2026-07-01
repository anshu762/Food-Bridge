import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import {
  Clock,
  CheckCircle,
  PackageOpen,
  MapPin,
  Phone,
  Navigation,
  User,
} from 'lucide-react-native';
import { notifySuccess, notifyWarning } from '../../../src/utils/haptics';
import { formatDistanceToNow } from 'date-fns';
import tw from '../../../src/utils/tw';
import { Button } from '../../../src/components/ui/Button';
import { Badge } from '../../../src/components/ui/Badge';
import { Skeleton, EmptyState, ErrorState } from '../../../src/components/ui/Feedback';
import { Tabs } from '../../../src/components/ui/Tabs';
import { TouchableCard } from '../../../src/components/ui/Card';
import { useUI } from '../../../src/components/ui/Providers';
import { api } from '../../../src/services/api';

type Tab = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COLLECTED';

const TABS: { key: Tab; title: string }[] = [
  { key: 'PENDING', title: 'Pending' },
  { key: 'ACCEPTED', title: 'Approved' },
  { key: 'REJECTED', title: 'Rejected' },
  { key: 'COLLECTED', title: 'History' },
];

interface FoodListing {
  id: string;
  title: string;
  foodType: string;
  quantity: number;
  unit: string;
  photos: string[];
  pickupLat: number;
  pickupLng: number;
  pickupAddress: string;
  donor: {
    id: string;
    name?: string;
    orgName?: string;
    email?: string;
    phone?: string;
  };
}

interface RequestItem {
  id: string;
  listingId: string;
  receiverId: string;
  status: string;
  message?: string;
  createdAt: string;
  updatedAt: string;
  listing: FoodListing;
}

export default function MyRequests() {
  const { showToast, showDialog } = useUI();
  const [activeTab, setActiveTab] = useState<Tab>('PENDING');
  const [allRequests, setAllRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [collectingId, setCollectingId] = useState<string | null>(null);

  const fetchRequests = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const res = await api.get('/requests/mine');
        setAllRequests(res.data.data || []);
      } catch {
        setError('Failed to load your requests.');
        showToast({ message: 'Failed to load requests', type: 'error' });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [showToast],
  );

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useFocusEffect(
    useCallback(() => {
      if (!loading) fetchRequests(true);
    }, []),
  );

  const filteredRequests = allRequests.filter((r) => {
    if (activeTab === 'PENDING') return r.status === 'PENDING';
    if (activeTab === 'ACCEPTED') return r.status === 'ACCEPTED';
    if (activeTab === 'REJECTED') return r.status === 'REJECTED';
    if (activeTab === 'COLLECTED') return r.status === 'COMPLETED' || r.status === 'CANCELLED';
    return false;
  });

  const handleCancel = (request: RequestItem) => {
    showDialog({
      title: 'Cancel Request?',
      message: `Are you sure you want to cancel your request for "${request.listing?.title}"?`,
      cancelText: 'Keep It',
      confirmText: 'Cancel Request',
      type: 'destructive',
      onConfirm: () => submitCancel(request.id),
    });
  };

  const submitCancel = async (requestId: string) => {
    setCancellingId(requestId);
    try {
      await api.patch(`/requests/${requestId}/cancel`);
      showToast({ message: 'Request cancelled.', type: 'info' });
      notifyWarning();
      fetchRequests();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? String((err as { response: { data?: { error?: string } } }).response?.data?.error || '')
          : '';
      showToast({ message: msg || 'Failed to cancel request', type: 'error' });
    } finally {
      setCancellingId(null);
    }
  };

  const handleCollect = (request: RequestItem) => {
    showDialog({
      title: 'Confirm collection?',
      message: `Have you collected "${request.listing?.title}"? This cannot be undone.`,
      cancelText: 'Not yet',
      confirmText: 'Yes, collected!',
      onConfirm: () => submitCollect(request),
    });
  };

  const submitCollect = async (request: RequestItem) => {
    setCollectingId(request.id);
    try {
      await api.patch(`/requests/${request.id}/collect`);
      showToast({
        message: `Nice! You helped save ${request.listing.quantity} ${request.listing.unit} of food!`,
        type: 'success',
      });
      notifySuccess();
      fetchRequests();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? String((err as { response: { data?: { error?: string } } }).response?.data?.error || '')
          : '';
      showToast({ message: msg || 'Failed to mark as collected', type: 'error' });
    } finally {
      setCollectingId(null);
    }
  };

  const getTimestamp = (request: RequestItem): string => {
    if (activeTab === 'COLLECTED') {
      return `Updated ${formatDistanceToNow(new Date(request.updatedAt), { addSuffix: true })}`;
    }
    return `Requested ${formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}`;
  };

  const renderRequestItem = ({ item }: { item: RequestItem }) => {
    const listing = item.listing;
    if (!listing) return null;

    return (
      <TouchableCard
        style={tw`mb-12 overflow-hidden border-neutral-200 bg-surface`}
        onPress={() => (router as any).push(`/(receiver)/listing/${listing.id}`)}
      >
        <View style={tw`flex-row p-16`}>
          <View style={tw`w-48 h-48 bg-primary-50 rounded-xl items-center justify-center`}>
            <PackageOpen size={28} color="#1B7A4D" />
          </View>
          <View style={tw`flex-1 ml-3 justify-center`}>
            <View style={tw`flex-row items-center justify-between`}>
              <Text style={tw`text-h3 text-neutral-900 flex-1 mr-8`} numberOfLines={1}>
                {listing.title}
              </Text>
              <Badge status={item.status} />
            </View>
            <Text style={tw`text-body text-neutral-600 mt-4`}>
              {listing.quantity} {listing.unit} &middot; {listing.foodType}
            </Text>
            <Text style={tw`text-caption text-neutral-400 mt-4`}>{getTimestamp(item)}</Text>
          </View>
        </View>

        {/* Action buttons for each tab */}
        {activeTab === 'PENDING' && (
          <View style={tw`px-16 pb-16`}>
            <Button
              variant="ghost"
              size="sm"
              loading={cancellingId === item.id}
              disabled={cancellingId === item.id}
              onPress={() => handleCancel(item)}
              style={tw`border-danger/20`}
            >
              <Text style={tw`text-danger`}>Cancel Request</Text>
            </Button>
          </View>
        )}

        {activeTab === 'ACCEPTED' && (
          <View style={tw`px-16 pb-16`}>
            {/* Pickup details inline */}
            {listing.donor && (
              <View style={tw`bg-primary-50 rounded-xl p-12 mb-12`}>
                <Text style={tw`text-caption font-semibold text-primary-800 mb-8`}>
                  Pickup Details
                </Text>
                <View style={tw`flex-row items-center mb-4`}>
                  <MapPin size={12} color="#1B7A4D" />
                  <Text style={tw`text-body text-primary-900 ml-8 flex-1`} numberOfLines={2}>
                    {listing.pickupAddress}
                  </Text>
                </View>
                {listing.donor.name && (
                  <View style={tw`flex-row items-center mb-4`}>
                    <User size={12} color="#1B7A4D" />
                    <Text style={tw`text-body text-primary-900 ml-8`}>{listing.donor.name}</Text>
                  </View>
                )}
                {listing.donor.phone && (
                  <TouchableOpacity style={tw`flex-row items-center mb-4`} onPress={() => {}}>
                    <Phone size={12} color="#1B7A4D" />
                    <Text style={tw`text-body text-primary ml-8 underline`}>
                      {listing.donor.phone}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <View style={tw`flex-row`}>
              <Button
                variant="ghost"
                size="sm"
                style={tw`flex-1 mr-8 border-primary/20`}
                onPress={() =>
                  router.push(
                    `https://www.google.com/maps/dir/?api=1&destination=${listing.pickupLat},${listing.pickupLng}` as any,
                  )
                }
              >
                <Navigation size={14} color="#1B7A4D" />
              </Button>
              <Button
                variant="primary"
                size="sm"
                style={tw`flex-1 ml-8`}
                loading={collectingId === item.id}
                disabled={collectingId === item.id}
                onPress={() => handleCollect(item)}
              >
                Mark Collected
              </Button>
            </View>
          </View>
        )}
      </TouchableCard>
    );
  };

  const emptyStateMessages: Record<Tab, { title: string; subtitle: string }> = {
    PENDING: {
      title: 'No pending requests',
      subtitle: 'Browse available listings and request food donations.',
    },
    ACCEPTED: {
      title: 'No approved requests yet',
      subtitle: 'When a donor approves your request, it will appear here.',
    },
    REJECTED: {
      title: 'No rejected requests',
      subtitle: 'Any declined requests will show up here.',
    },
    COLLECTED: {
      title: 'No history yet',
      subtitle: 'Your completed and cancelled requests will appear here.',
    },
  };

  if (loading) {
    return (
      <View style={tw`flex-1 bg-gray-50`}>
        <View style={tw`bg-white pt-12 pb-4 px-4 border-b border-gray-100`}>
          <Skeleton style={tw`h-8 w-40 mb-2`} />
        </View>
        {[1, 2, 3].map((i) => (
          <View key={i} style={tw`px-4 pt-4`}>
            <Skeleton style={tw`h-24 w-full rounded-2xl`} />
          </View>
        ))}
      </View>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => fetchRequests()} />;
  }

  return (
    <View style={tw`flex-1 bg-neutral-50`}>
      <View style={tw`bg-surface pt-48 pb-0 px-16 border-b border-neutral-100`}>
        <Text style={tw`text-display font-bold text-primary mb-12`}>My Requests</Text>

        {/* Tab bar */}
        <Tabs tabs={TABS} activeTab={activeTab} onChange={(k) => setActiveTab(k as Tab)} />
      </View>

      {filteredRequests.length === 0 ? (
        <EmptyState
          title={emptyStateMessages[activeTab].title}
          subtitle={emptyStateMessages[activeTab].subtitle}
          icon={activeTab === 'ACCEPTED' ? CheckCircle : Clock}
          actionLabel={activeTab === 'PENDING' ? 'Browse Listings' : undefined}
          onAction={
            activeTab === 'PENDING' ? () => (router as any).push('/(receiver)/(tabs)') : undefined
          }
        />
      ) : (
        <FlatList
          data={filteredRequests}
          renderItem={renderRequestItem}
          keyExtractor={(item) => item.id}
          initialNumToRender={10}
          windowSize={21}
          maxToRenderPerBatch={10}
          contentContainerStyle={tw`px-4 pt-4 pb-8`}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchRequests(true)}
              tintColor="#3B6D11"
            />
          }
        />
      )}
    </View>
  );
}
