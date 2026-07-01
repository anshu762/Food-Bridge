import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import {
  MapPin,
  Clock,
  PackageOpen,
  User,
  Phone,
  Mail,
  Navigation,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  Calendar,
} from 'lucide-react-native';
import { differenceInMilliseconds, format, formatDistanceToNow } from 'date-fns';
import tw from '../../../src/utils/tw';
import { Button } from '../../../src/components/ui/Button';
import { Badge } from '../../../src/components/ui/Badge';
import { Card } from '../../../src/components/ui/Card';
import { Skeleton, ErrorState } from '../../../src/components/ui/Feedback';
import { useUI } from '../../../src/components/ui/Providers';
import { useAuthStore } from '../../../src/store/authStore';
import { api } from '../../../src/services/api';
import { notifySuccess } from '../../../src/utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ListingDetail {
  id: string;
  title: string;
  description?: string;
  foodType: string;
  quantity: number;
  unit: string;
  photos: string[];
  pickupLat: number;
  pickupLng: number;
  pickupAddress: string;
  preparedAt: string;
  safeUntil: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  donor: {
    id: string;
    name?: string;
    orgName?: string;
    email?: string;
    phone?: string;
  };
  requests: {
    id: string;
    receiverId: string;
    status: string;
    message?: string;
    createdAt: string;
    receiver?: {
      id: string;
      name?: string;
      email?: string;
      phone?: string;
    };
  }[];
}

function getTimeRemaining(safeUntil: string): { text: string; urgent: boolean } {
  const diff = differenceInMilliseconds(new Date(safeUntil), new Date());
  if (diff <= 0) return { text: 'Expired', urgent: true };
  if (diff < 3600000) {
    return { text: `${Math.floor(diff / 60000)} min`, urgent: true };
  }
  if (diff < 86400000) {
    return { text: `${Math.floor(diff / 3600000)}h`, urgent: false };
  }
  return { text: formatDistanceToNow(new Date(safeUntil), { addSuffix: true }), urgent: false };
}

export default function ListingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { showToast, showDialog } = useUI();
  const user = useAuthStore((s) => s.user);
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [collecting, setCollecting] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [collectedQuantity, setCollectedQuantity] = useState(0);

  const fetchListing = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const res = await api.get(`/listings/${id}`);
        setListing(res.data.data);
      } catch (err: unknown) {
        const status =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response: { status: number } }).response?.status
            : null;
        if (status === 404) {
          setError('This listing could not be found.');
        } else {
          setError('Failed to load listing details.');
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id],
  );

  useEffect(() => {
    fetchListing();
  }, [fetchListing]);

  const myRequest = listing?.requests?.find((r) => r.receiverId === user?.id) || null;

  const timeRemaining = listing ? getTimeRemaining(listing.safeUntil) : { text: '', urgent: false };

  const getRequestBadgeStatus = () => {
    if (!myRequest) return null;
    const map: Record<string, string> = {
      PENDING: 'PENDING',
      ACCEPTED: 'ACCEPTED',
      REJECTED: 'REJECTED',
      CANCELLED: 'CANCELLED',
    };
    return map[myRequest.status] || null;
  };

  const handleRequestFood = () => {
    if (!listing) return;

    showDialog({
      title: 'Request this food?',
      message: `You are requesting: ${listing.title}\n\n${listing.quantity} ${listing.unit} of ${listing.foodType}\n\nPickup location: ${listing.pickupAddress}\n\nThe donor will be notified and can approve your request.`,
      cancelText: 'Cancel',
      confirmText: 'Request',
      onConfirm: submitRequest,
    });
  };

  const submitRequest = async () => {
    if (!listing) return;
    setRequesting(true);

    try {
      await api.post('/requests', { listingId: listing.id });
      showToast({ message: 'Request submitted! Waiting for donor approval.', type: 'success' });
      notifySuccess();
      fetchListing();
    } catch (err: unknown) {
      const errData =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response: { data?: { error?: string }; status?: number } }).response
          : null;

      if (errData?.data?.error === 'LISTING_NOT_AVAILABLE') {
        showDialog({
          title: 'Just claimed!',
          message:
            'This listing was just reserved by someone else. Please check available listings.',
          confirmText: 'OK',
          onConfirm: () => fetchListing(),
        });
      } else if (errData?.data?.error?.includes('already have an active request')) {
        showToast({
          message: 'You already have an active request for this listing.',
          type: 'info',
        });
        fetchListing();
      } else {
        showToast({
          message: errData?.data?.error || 'Failed to submit request',
          type: 'error',
        });
      }
    } finally {
      setRequesting(false);
    }
  };

  const handleCollect = () => {
    if (!myRequest) return;

    showDialog({
      title: 'Confirm collection?',
      message: 'Have you collected this food? This cannot be undone.',
      cancelText: 'Not yet',
      confirmText: 'Yes, collected!',
      onConfirm: () => submitCollect(),
    });
  };

  const submitCollect = async () => {
    if (!myRequest || !listing) return;
    setCollecting(true);

    try {
      await api.patch(`/requests/${myRequest.id}/collect`);
      setCollectedQuantity(listing.quantity);
      setShowCelebration(true);
      notifySuccess();
      fetchListing();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? String((err as { response: { data?: { error?: string } } }).response?.data?.error || '')
          : '';
      showToast({ message: msg || 'Failed to mark as collected', type: 'error' });
    } finally {
      setCollecting(false);
    }
  };

  const openDirections = () => {
    if (!listing) return;
    const { pickupLat, pickupLng } = listing;
    const url = Platform.select({
      ios: `maps://app?daddr=${pickupLat},${pickupLng}`,
      android: `geo:${pickupLat},${pickupLng}?q=${pickupLat},${pickupLng}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${pickupLat},${pickupLng}`,
    });
    if (url) Linking.openURL(url);
  };

  const callDonor = () => {
    if (listing?.donor?.phone) {
      Linking.openURL(`tel:${listing.donor.phone}`);
    }
  };

  const emailDonor = () => {
    if (listing?.donor?.email) {
      Linking.openURL(`mailto:${listing.donor.email}`);
    }
  };

  if (loading) {
    return (
      <View style={tw`flex-1 bg-gray-50`}>
        <View style={tw`px-4 pt-4`}>
          <Skeleton style={tw`h-64 w-full rounded-2xl mb-4`} />
          <Skeleton style={tw`h-8 w-3/4 mb-2`} />
          <Skeleton style={tw`h-5 w-1/2 mb-4`} />
          <Skeleton style={tw`h-24 w-full mb-3 rounded-xl`} />
          <Skeleton style={tw`h-24 w-full mb-3 rounded-xl`} />
          <Skeleton style={tw`h-12 w-full rounded-xl`} />
        </View>
      </View>
    );
  }

  if (error || !listing) {
    return <ErrorState message={error || 'Listing not found'} onRetry={() => fetchListing()} />;
  }

  const requestBadge = getRequestBadgeStatus();

  return (
    <View style={tw`flex-1 bg-gray-50`}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchListing(true)} />
        }
      >
        {/* Photo Gallery */}
        {listing.photos && listing.photos.length > 0 ? (
          <View style={tw`h-72 bg-gray-100`}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                setCurrentPhotoIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH));
              }}
            >
              {listing.photos.map((photo, idx) => (
                <View
                  key={idx}
                  style={[
                    { width: SCREEN_WIDTH },
                    tw`h-72 bg-gray-100 items-center justify-center`,
                  ]}
                >
                  <Text style={tw`text-gray-400`}>Photo {idx + 1}</Text>
                </View>
              ))}
            </ScrollView>
            {listing.photos.length > 1 && (
              <View style={tw`absolute bottom-3 left-0 right-0 flex-row justify-center`}>
                {listing.photos.map((_, idx) => (
                  <View
                    key={idx}
                    style={[
                      tw`w-2 h-2 rounded-full mx-1`,
                      idx === currentPhotoIndex ? tw`bg-white` : tw`bg-white/50`,
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={tw`h-64 bg-primary-50 items-center justify-center`}>
            <PackageOpen size={64} color="#97C459" />
          </View>
        )}

        <View style={tw`px-4 pt-4 pb-8`}>
          {/* Header */}
          <View style={tw`flex-row items-start justify-between mb-2`}>
            <View style={tw`flex-1 mr-3`}>
              <Text style={tw`text-2xl font-bold text-gray-900`}>{listing.title}</Text>
              <Text style={tw`text-base text-gray-500 mt-1`}>
                {listing.donor.orgName || listing.donor.name || 'Food Provider'}
              </Text>
            </View>
            <Badge status={listing.status} />
          </View>

          {/* Time remaining alert */}
          {timeRemaining.urgent && listing.status === 'AVAILABLE' && (
            <View
              style={tw`bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 flex-row items-center`}
            >
              <Clock size={20} color="#EF4444" />
              <Text style={tw`text-red-700 text-sm font-medium ml-2 flex-1`}>
                Only {timeRemaining.text} left to request this food!
              </Text>
            </View>
          )}

          {/* Key Info Cards */}
          <View style={tw`flex-row flex-wrap mb-4`}>
            <View style={tw`bg-white rounded-xl p-3 mr-2 mb-2 min-w-[30%]`}>
              <Text style={tw`text-xs text-gray-500 mb-1`}>Quantity</Text>
              <Text style={tw`text-lg font-bold text-gray-900`}>
                {listing.quantity} {listing.unit}
              </Text>
            </View>
            <View style={tw`bg-white rounded-xl p-3 mr-2 mb-2 min-w-[30%]`}>
              <Text style={tw`text-xs text-gray-500 mb-1`}>Food Type</Text>
              <Text style={tw`text-lg font-bold text-gray-900 capitalize`}>{listing.foodType}</Text>
            </View>
            <View style={tw`bg-white rounded-xl p-3 mb-2 min-w-[30%]`}>
              <Text style={tw`text-xs text-gray-500 mb-1`}>Time Left</Text>
              <Text
                style={[
                  tw`text-lg font-bold`,
                  timeRemaining.urgent ? tw`text-red-500` : tw`text-gray-900`,
                ]}
              >
                {timeRemaining.text}
              </Text>
            </View>
          </View>

          {/* Description */}
          {listing.description && (
            <Card style={tw`mb-4`}>
              <Text style={tw`text-sm font-semibold text-gray-700 mb-1`}>Description</Text>
              <Text style={tw`text-base text-gray-600 leading-5`}>{listing.description}</Text>
            </Card>
          )}

          {/* Timing Info */}
          <Card style={tw`mb-4`}>
            <Text style={tw`text-sm font-semibold text-gray-700 mb-2`}>Timing</Text>
            <View style={tw`flex-row items-center mb-1`}>
              <Calendar size={14} color="#6B7280" />
              <Text style={tw`text-sm text-gray-600 ml-2`}>
                Prepared {format(new Date(listing.preparedAt), 'MMM d, h:mm a')}
              </Text>
            </View>
            <View style={tw`flex-row items-center`}>
              <Clock size={14} color="#6B7280" />
              <Text style={tw`text-sm text-gray-600 ml-2`}>
                Safe until {format(new Date(listing.safeUntil), 'MMM d, h:mm a')}
              </Text>
            </View>
          </Card>

          {/* Pickup Area (address always shown, contact hidden until approved) */}
          <Card style={tw`mb-4`}>
            <View style={tw`flex-row items-center mb-1`}>
              <MapPin size={16} color="#3B6D11" />
              <Text style={tw`text-sm font-semibold text-gray-700 ml-2`}>Pickup Location</Text>
            </View>
            <Text style={tw`text-base text-gray-600 mt-1`}>{listing.pickupAddress}</Text>

            {/* Full details only if APPROVED */}
            {myRequest?.status === 'ACCEPTED' && listing.donor.email && (
              <>
                <View style={tw`border-t border-gray-100 mt-3 pt-3`}>
                  <Text style={tw`text-sm font-semibold text-gray-700 mb-2`}>Donor Contact</Text>
                  {listing.donor.name && (
                    <View style={tw`flex-row items-center mb-2`}>
                      <User size={14} color="#6B7280" />
                      <Text style={tw`text-sm text-gray-600 ml-2`}>{listing.donor.name}</Text>
                    </View>
                  )}
                  {listing.donor.phone && (
                    <TouchableOpacity style={tw`flex-row items-center mb-2`} onPress={callDonor}>
                      <Phone size={14} color="#3B6D11" />
                      <Text style={tw`text-sm text-primary-600 ml-2 underline`}>
                        {listing.donor.phone}
                      </Text>
                    </TouchableOpacity>
                  )}
                  {listing.donor.email && (
                    <TouchableOpacity style={tw`flex-row items-center`} onPress={emailDonor}>
                      <Mail size={14} color="#3B6D11" />
                      <Text style={tw`text-sm text-primary-600 ml-2 underline`}>
                        {listing.donor.email}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={tw`mt-4`}>
                  <TouchableOpacity
                    style={tw`flex-row items-center justify-center bg-accent-500 rounded-xl py-3 px-6`}
                    onPress={openDirections}
                  >
                    <Navigation size={18} color="#ffffff" />
                    <Text style={tw`text-white font-semibold ml-2`}>Get Directions</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Card>

          {/* Request Status / Call to Action */}
          {!requestBadge && listing.status === 'AVAILABLE' && (
            <Button
              variant="primary"
              fullWidth
              size="lg"
              loading={requesting}
              disabled={requesting}
              onPress={handleRequestFood}
            >
              Request this Food
            </Button>
          )}

          {requestBadge === 'PENDING' && (
            <View style={tw`bg-yellow-50 border border-yellow-200 rounded-xl p-4 items-center`}>
              <Clock size={28} color="#D97706" />
              <Text style={tw`text-lg font-semibold text-yellow-800 mt-2`}>Request Pending</Text>
              <Text style={tw`text-sm text-yellow-700 text-center mt-1`}>
                Waiting for the donor to review your request.
              </Text>
            </View>
          )}

          {requestBadge === 'ACCEPTED' && (
            <View style={tw`bg-green-50 border border-green-200 rounded-xl p-4 mb-4`}>
              <View style={tw`items-center`}>
                <CheckCircle size={32} color="#3B6D11" />
                <Text style={tw`text-lg font-semibold text-primary-700 mt-2`}>
                  Request Approved!
                </Text>
                <Text style={tw`text-sm text-primary-600 text-center mt-1`}>
                  Pickup details are now available above. Please collect the food before it expires.
                </Text>
              </View>
              <View style={tw`mt-4`}>
                <Button
                  variant="primary"
                  fullWidth
                  size="lg"
                  loading={collecting}
                  disabled={collecting}
                  onPress={handleCollect}
                >
                  Mark as Collected
                </Button>
              </View>
            </View>
          )}

          {requestBadge === 'REJECTED' && (
            <View style={tw`bg-red-50 border border-red-200 rounded-xl p-4 items-center`}>
              <XCircle size={28} color="#EF4444" />
              <Text style={tw`text-lg font-semibold text-red-800 mt-2`}>Request Declined</Text>
              <Text style={tw`text-sm text-red-700 text-center mt-1`}>
                The donor was unable to fulfill your request.
              </Text>
            </View>
          )}

          {requestBadge === 'CANCELLED' && (
            <View style={tw`bg-gray-50 border border-gray-200 rounded-xl p-4 items-center`}>
              <XCircle size={28} color="#6B7280" />
              <Text style={tw`text-lg font-semibold text-gray-700 mt-2`}>Request Cancelled</Text>
            </View>
          )}

          {listing.status !== 'AVAILABLE' && !requestBadge && (
            <View style={tw`bg-gray-50 border border-gray-200 rounded-xl p-4 items-center`}>
              <AlertTriangle size={28} color="#6B7280" />
              <Text style={tw`text-lg font-semibold text-gray-700 mt-2`}>No Longer Available</Text>
              <Text style={tw`text-sm text-gray-600 text-center mt-1`}>
                This listing has been {listing.status.toLowerCase()}.
              </Text>
            </View>
          )}

          {/* Verification info */}
          <View style={tw`flex-row items-center justify-center mt-6`}>
            <ShieldCheck size={14} color="#9CA3AF" />
            <Text style={tw`text-xs text-gray-400 ml-1`}>
              Verified organization {listing.donor.name ? `· ${listing.donor.name}` : ''}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Celebration Modal */}
      {showCelebration && (
        <View style={tw`absolute inset-0 bg-black/40 items-center justify-center z-50`}>
          <View style={tw`bg-white rounded-3xl mx-8 p-8 items-center`}>
            <View
              style={tw`h-20 w-20 rounded-full bg-primary-100 items-center justify-center mb-4`}
            >
              <CheckCircle size={48} color="#3B6D11" />
            </View>
            <Text style={tw`text-2xl font-bold text-primary-600 text-center mb-2`}>
              Food Collected!
            </Text>
            <Text style={tw`text-base text-gray-600 text-center mb-6`}>
              Nice! You just helped save {collectedQuantity} {listing.unit} of {listing.foodType}{' '}
              from going to waste.
            </Text>
            <Button
              variant="primary"
              fullWidth
              onPress={() => {
                setShowCelebration(false);
                (router as any).push('/(receiver)/(tabs)/my-requests');
              }}
            >
              View My Requests
            </Button>
          </View>
        </View>
      )}
    </View>
  );
}
