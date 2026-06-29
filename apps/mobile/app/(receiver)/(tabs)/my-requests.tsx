import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
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
import { formatDistanceToNow } from 'date-fns';
import tw from '../../../src/utils/tw';
import { Button } from '../../../src/components/ui/Button';
import { Badge } from '../../../src/components/ui/Badge';
import { Skeleton, EmptyState, ErrorState } from '../../../src/components/ui/Feedback';
import { useToast } from '../../../src/components/ui/Toast';
import { api } from '../../../src/services/api';

type Tab = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COLLECTED';

const TABS: { key: Tab; label: string }[] = [
  { key: 'PENDING', label: 'Pending' },
  { key: 'ACCEPTED', label: 'Approved' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'COLLECTED', label: 'History' },
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
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('PENDING');
  const [allRequests, setAllRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [collectingId, setCollectingId] = useState<string | null>(null);

  const fetchRequests = useCallback(async (isRefresh = false) => {
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
  }, [showToast]);

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
    Alert.alert(
      'Cancel Request?',
      `Are you sure you want to cancel your request for "${request.listing?.title}"?`,
      [
        { text: 'Keep It', style: 'cancel' },
        {
          text: 'Cancel Request',
          style: 'destructive',
          onPress: () => submitCancel(request.id),
        },
      ],
    );
  };

  const submitCancel = async (requestId: string) => {
    setCancellingId(requestId);
    try {
      await api.patch(`/requests/${requestId}/cancel`);
      showToast({ message: 'Request cancelled.', type: 'info' });
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
    Alert.alert(
      'Confirm collection?',
      `Have you collected "${request.listing?.title}"? This cannot be undone.`,
      [
        { text: 'Not yet', style: 'cancel' },
        {
          text: 'Yes, collected!',
          style: 'default',
          onPress: () => submitCollect(request),
        },
      ],
    );
  };

  const submitCollect = async (request: RequestItem) => {
    setCollectingId(request.id);
    try {
      await api.patch(`/requests/${request.id}/collect`);
      showToast({
        message: `Nice! You helped save ${request.listing.quantity} ${request.listing.unit} of food!`,
        type: 'success',
      });
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
      <View style={tw`bg-white rounded-2xl border border-gray-100 mb-3 overflow-hidden`}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => (router as any).push(`/(receiver)/listing/${listing.id}`)}
        >
          <View style={tw`flex-row p-4`}>
            <View style={tw`w-16 h-16 bg-primary-50 rounded-xl items-center justify-center`}>
              <PackageOpen size={28} color="#97C459" />
            </View>
            <View style={tw`flex-1 ml-3 justify-center`}>
              <View style={tw`flex-row items-center justify-between`}>
                <Text style={tw`font-bold text-gray-900 flex-1 mr-2`} numberOfLines={1}>
                  {listing.title}
                </Text>
                <Badge status={item.status} />
              </View>
              <Text style={tw`text-sm text-gray-500 mt-1`}>
                {listing.quantity} {listing.unit} &middot; {listing.foodType}
              </Text>
              <Text style={tw`text-xs text-gray-400 mt-1`}>{getTimestamp(item)}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Action buttons for each tab */}
        {activeTab === 'PENDING' && (
          <View style={tw`px-4 pb-4`}>
            <Button
              variant="ghost"
              size="sm"
              loading={cancellingId === item.id}
              disabled={cancellingId === item.id}
              onPress={() => handleCancel(item)}
              style={tw`border-red-200`}
            >
              Cancel Request
            </Button>
          </View>
        )}

        {activeTab === 'ACCEPTED' && (
          <View style={tw`px-4 pb-4`}>
            {/* Pickup details inline */}
            {listing.donor && (
              <View style={tw`bg-primary-50 rounded-xl p-3 mb-3`}>
                <Text style={tw`text-xs font-semibold text-primary-700 mb-2`}>Pickup Details</Text>
                <View style={tw`flex-row items-center mb-1`}>
                  <MapPin size={12} color="#3B6D11" />
                  <Text style={tw`text-sm text-gray-700 ml-2 flex-1`} numberOfLines={2}>
                    {listing.pickupAddress}
                  </Text>
                </View>
                {listing.donor.name && (
                  <View style={tw`flex-row items-center mb-1`}>
                    <User size={12} color="#3B6D11" />
                    <Text style={tw`text-sm text-gray-700 ml-2`}>{listing.donor.name}</Text>
                  </View>
                )}
                {listing.donor.phone && (
                  <TouchableOpacity
                    style={tw`flex-row items-center mb-1`}
                    onPress={() => {}}
                  >
                    <Phone size={12} color="#3B6D11" />
                    <Text style={tw`text-sm text-primary-600 ml-2 underline`}>
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
                style={tw`flex-1 mr-2 border-primary-200`}
                onPress={() =>
                  router.push(
                    `https://www.google.com/maps/dir/?api=1&destination=${listing.pickupLat},${listing.pickupLng}`,
                  )
                }
              >
                <Navigation size={14} color="#3B6D11" />
              </Button>
              <Button
                variant="primary"
                size="sm"
                style={tw`flex-1 ml-2`}
                loading={collectingId === item.id}
                disabled={collectingId === item.id}
                onPress={() => handleCollect(item)}
              >
                Mark Collected
              </Button>
            </View>
          </View>
        )}
      </View>
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
    <View style={tw`flex-1 bg-gray-50`}>
      <View style={tw`bg-white pt-12 pb-2 px-4 border-b border-gray-100`}>
        <Text style={tw`text-2xl font-bold text-primary-600 mb-3`}>My Requests</Text>

        {/* Tab bar */}
        <View style={tw`flex-row`}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={tw`mr-6 pb-3 ${activeTab === tab.key ? 'border-b-2 border-primary-600' : ''}`}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text
                style={[
                  tw`text-base font-medium`,
                  activeTab === tab.key ? tw`text-primary-600` : tw`text-gray-500`,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {filteredRequests.length === 0 ? (
        <EmptyState
          title={emptyStateMessages[activeTab].title}
          subtitle={emptyStateMessages[activeTab].subtitle}
          icon={activeTab === 'ACCEPTED' ? CheckCircle : Clock}
          actionLabel={activeTab === 'PENDING' ? 'Browse Listings' : undefined}
          onAction={
            activeTab === 'PENDING'
              ? () => (router as any).push('/(receiver)/(tabs)')
              : undefined
          }
        />
      ) : (
        <FlatList
          data={filteredRequests}
          renderItem={renderRequestItem}
          keyExtractor={(item) => item.id}
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
