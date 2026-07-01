import React, { useCallback, useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useListing, useCancelListing } from '../../../src/hooks/useListings';
import { useApproveRequest, useRejectRequest } from '../../../src/hooks/useRequests';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { Badge } from '../../../src/components/ui/Badge';
import { ErrorState } from '../../../src/components/ui/Feedback';
import { useUI } from '../../../src/components/ui/Providers';
import { format } from 'date-fns';
import { ChevronLeft, Info } from 'lucide-react-native';
import tw from '../../../src/utils/tw';

export default function ListingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { showToast, showDialog } = useUI();

  const { data: listing, isLoading, isError, error, refetch } = useListing(id);
  const cancelListingMutation = useCancelListing();
  const approveRequestMutation = useApproveRequest();
  const rejectRequestMutation = useRejectRequest();

  const [raceConditionError, setRaceConditionError] = useState<string | null>(null);

  // Live status refresh on focus
  useFocusEffect(
    useCallback(() => {
      refetch();
      setRaceConditionError(null);
    }, [refetch]),
  );

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleCancelListing = () => {
    showDialog({
      title: 'Cancel Listing',
      message: 'Are you sure you want to cancel this listing? This action cannot be undone.',
      cancelText: 'No',
      confirmText: 'Yes, Cancel',
      type: 'destructive',
      onConfirm: async () => {
        try {
          await cancelListingMutation.mutateAsync(id);
          showDialog({
            title: 'Success',
            message: 'Listing cancelled successfully.',
            confirmText: 'OK',
            onConfirm: () => router.back(),
          });
        } catch (err: any) {
          showToast({
            message: err.response?.data?.error?.message || 'Failed to cancel listing.',
            type: 'error',
          });
        }
      },
    });
  };

  const handleApprove = (requestId: string, receiverName: string) => {
    showDialog({
      title: 'Approve Request',
      message: `Are you sure you want to approve ${receiverName}'s request? Approving this will automatically reject all other pending requests on this listing.`,
      cancelText: 'Cancel',
      confirmText: 'Approve',
      onConfirm: async () => {
        try {
          setRaceConditionError(null);
          await approveRequestMutation.mutateAsync(requestId);
          refetch(); // Refresh to see updated status
        } catch (err: any) {
          if (err.response?.status === 409) {
            setRaceConditionError(
              "This listing's state has already changed (e.g., someone else approved it or it was cancelled).",
            );
            refetch(); // Refresh to get the latest state
          } else {
            showToast({
              message: err.response?.data?.error?.message || 'Failed to approve request.',
              type: 'error',
            });
          }
        }
      },
    });
  };

  const handleReject = (requestId: string) => {
    showDialog({
      title: 'Reject Request',
      message: 'Are you sure you want to reject this request?',
      cancelText: 'Cancel',
      confirmText: 'Reject',
      type: 'destructive',
      onConfirm: async () => {
        try {
          setRaceConditionError(null);
          await rejectRequestMutation.mutateAsync(requestId);
          refetch();
        } catch (err: any) {
          if (err.response?.status === 409) {
            setRaceConditionError("This listing's state has already changed.");
            refetch();
          } else {
            showToast({
              message: err.response?.data?.error?.message || 'Failed to reject request.',
              type: 'error',
            });
          }
        }
      },
    });
  };

  if (isLoading) {
    return (
      <View style={tw`flex-1 bg-white justify-center items-center`}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  if (isError || !listing) {
    return (
      <View style={tw`flex-1 bg-white pt-4`}>
        <TouchableOpacity onPress={() => router.back()} style={tw`px-4 mb-4`}>
          <ChevronLeft color="#374151" size={24} />
        </TouchableOpacity>
        <ErrorState
          message={`Listing Not Found. ${error?.message || "We couldn't load this listing."}`}
          onRetry={refetch as any}
        />
      </View>
    );
  }

  const isAvailable = listing.status === 'AVAILABLE';
  const requests = listing.requests || [];
  const hasApprovedRequest = requests.some(
    (req: any) => req.status === 'ACCEPTED' || req.status === 'COLLECTED',
  );

  const safeUntilDate = new Date(listing.safeUntil);
  const isExpiredLocally = isAvailable && safeUntilDate <= now;
  const displayStatus = isExpiredLocally ? 'EXPIRED' : listing.status;

  return (
    <View style={tw`flex-1 bg-gray-50`}>
      <View style={tw`bg-white border-b border-gray-100 flex-row items-center px-4 py-3`}>
        <TouchableOpacity onPress={() => router.back()} style={tw`mr-4 -ml-2 p-2`}>
          <ChevronLeft color="#374151" size={24} />
        </TouchableOpacity>
        <Text style={tw`text-lg font-bold text-gray-900 flex-1`} numberOfLines={1}>
          {listing.title}
        </Text>
        <Badge status={displayStatus} />
      </View>

      <ScrollView style={tw`flex-1`}>
        {raceConditionError ? (
          <View
            style={tw`m-4 p-3 bg-red-50 border border-red-200 rounded-lg flex-row items-center`}
          >
            <Info color="#dc2626" size={20} style={tw`mr-2`} />
            <Text style={tw`text-red-700 flex-1`}>{raceConditionError}</Text>
          </View>
        ) : null}

        <ScrollView horizontal style={tw`flex-row p-4 space-x-2`}>
          {listing.photos.map((photo: string, idx: number) => (
            <Image key={idx} source={{ uri: photo }} style={tw`w-48 h-48 rounded-xl bg-gray-200`} />
          ))}
        </ScrollView>

        <View style={tw`bg-white px-4 py-4 mb-4 border-y border-gray-100 space-y-4`}>
          <View>
            <Text style={tw`text-gray-500 text-xs uppercase tracking-wider`}>Food</Text>
            <Text style={tw`text-gray-900 font-medium text-base mt-1`}>{listing.foodType}</Text>
            <Text style={tw`text-gray-600 text-sm mt-1`}>
              {listing.quantity} {listing.unit}
            </Text>
          </View>

          {listing.description ? (
            <View>
              <Text style={tw`text-gray-500 text-xs uppercase tracking-wider`}>Description</Text>
              <Text style={tw`text-gray-800 mt-1`}>{listing.description}</Text>
            </View>
          ) : null}

          <View>
            <Text style={tw`text-gray-500 text-xs uppercase tracking-wider`}>Timings</Text>
            <Text style={tw`text-gray-800 mt-1`}>
              <Text style={tw`font-medium`}>Prepared:</Text>{' '}
              {format(new Date(listing.preparedAt), 'PPp')}
            </Text>
            <Text style={tw`text-gray-800 mt-1`}>
              <Text style={tw`font-medium`}>Safe Until:</Text>{' '}
              {format(new Date(listing.safeUntil), 'PPp')}
            </Text>
          </View>

          <View>
            <Text style={tw`text-gray-500 text-xs uppercase tracking-wider`}>Pickup</Text>
            <Text style={tw`text-gray-800 mt-1`}>{listing.pickupAddress}</Text>
          </View>

          {isAvailable && (
            <View style={tw`pt-2`}>
              <Button
                variant="ghost"
                onPress={handleCancelListing}
                loading={cancelListingMutation.isPending}
              >
                Cancel Listing
              </Button>
            </View>
          )}
        </View>

        <View style={tw`bg-white px-4 py-4 mb-8 border-y border-gray-100`}>
          <Text style={tw`text-lg font-bold text-gray-900 mb-4`}>Requests ({requests.length})</Text>

          {requests.length === 0 ? (
            <Text style={tw`text-gray-500 italic text-center py-4`}>No requests yet.</Text>
          ) : (
            <View style={tw`space-y-4`}>
              {requests.map((req: any) => {
                const isPending = req.status === 'PENDING';
                const isResolvedWinner = req.status === 'ACCEPTED' || req.status === 'COLLECTED';
                const showDisabled = isPending && hasApprovedRequest;

                return (
                  <Card
                    key={req.id}
                    style={[
                      tw`p-16 mb-16`,
                      showDisabled ? tw`opacity-50` : tw``,
                      isResolvedWinner
                        ? tw`border-primary-500 bg-primary-50`
                        : tw`border-neutral-200 bg-surface`,
                    ]}
                  >
                    <View style={tw`flex-row justify-between items-center mb-8`}>
                      <Text style={tw`text-body-emphasis text-neutral-900`}>
                        {req.receiver?.email || 'Receiver'}
                      </Text>
                      {showDisabled ? (
                        <Badge status="NO LONGER AVAILABLE" />
                      ) : (
                        <Badge status={req.status} />
                      )}
                    </View>
                    <Text style={tw`text-caption text-neutral-500 mb-12`}>
                      Requested {format(new Date(req.createdAt), 'PPp')}
                    </Text>
                    {req.message ? (
                      <Text style={tw`text-body text-neutral-700 mb-12 italic`}>
                        "{req.message}"
                      </Text>
                    ) : null}

                    {isResolvedWinner && (
                      <View style={tw`mt-8 p-12 bg-primary-100 rounded-md flex-row items-center`}>
                        <Info color="#1B7A4D" size={16} style={tw`mr-8`} />
                        <Text style={tw`text-caption text-primary-800`}>
                          This request was chosen. Coordinate pickup with the receiver.
                        </Text>
                      </View>
                    )}

                    {isPending && !hasApprovedRequest && (
                      <View style={tw`flex-row space-x-2 mt-2`}>
                        <View style={tw`flex-1`}>
                          <Button
                            variant="ghost"
                            onPress={() => handleReject(req.id)}
                            disabled={
                              approveRequestMutation.isPending || rejectRequestMutation.isPending
                            }
                          >
                            Reject
                          </Button>
                        </View>
                        <View style={tw`flex-1`}>
                          <Button
                            onPress={() => handleApprove(req.id, req.receiver?.email || 'Receiver')}
                            disabled={
                              approveRequestMutation.isPending || rejectRequestMutation.isPending
                            }
                          >
                            Approve
                          </Button>
                        </View>
                      </View>
                    )}
                  </Card>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
