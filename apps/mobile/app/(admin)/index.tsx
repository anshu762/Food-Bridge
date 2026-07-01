import React, { useState } from 'react';
import { View, Text, FlatList, Image, Alert, RefreshControl, Modal, TextInput } from 'react-native';
import {
  usePendingVerifications,
  useApproveVerification,
  useRejectVerification,
} from '../../src/hooks/useAdmin';
import { Skeleton, ErrorState, EmptyState } from '../../src/components/ui/Feedback';
import { Button } from '../../src/components/ui/Button';
import { XCircle, CheckCircle, ShieldAlert } from 'lucide-react-native';
import tw from '../../src/utils/tw';
import { formatDistanceToNow } from 'date-fns';
import { VerificationDocument } from '../../src/services/admin';
import { useToast } from '../../src/components/ui/Toast';

export default function PendingVerificationsScreen() {
  const { data, isLoading, isError, error, refetch, isRefetching } = usePendingVerifications();
  const approveMutation = useApproveVerification();
  const rejectMutation = useRejectVerification();
  const { showToast } = useToast();

  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const documents: VerificationDocument[] = data?.data || [];

  const handleApprove = (id: string) => {
    Alert.alert(
      'Approve Verification',
      'Are you sure you want to approve this document? This will verify the user.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {
            try {
              await approveMutation.mutateAsync(id);
              showToast({ message: 'User verified successfully', type: 'success' });
            } catch (err: unknown) {
              const errorMessage =
                err && typeof err === 'object' && 'response' in err
                  ? String(
                      (err as { response?: { data?: { error?: string } } }).response?.data?.error ||
                        'Failed to approve',
                    )
                  : 'Failed to approve';
              showToast({ message: errorMessage, type: 'error' });
            }
          },
        },
      ],
    );
  };

  const handleRejectPrompt = (id: string) => {
    setSelectedDocId(id);
    setRejectReason('');
    setRejectModalVisible(true);
  };

  const submitReject = async () => {
    if (!selectedDocId || !rejectReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for rejection.');
      return;
    }

    try {
      await rejectMutation.mutateAsync({ id: selectedDocId, reason: rejectReason.trim() });
      setRejectModalVisible(false);
      showToast({ message: 'Verification rejected', type: 'info' });
    } catch (err: unknown) {
      const errorMessage =
        err && typeof err === 'object' && 'response' in err
          ? String(
              (err as { response?: { data?: { error?: string } } }).response?.data?.error ||
                'Failed to reject',
            )
          : 'Failed to reject';
      showToast({ message: errorMessage, type: 'error' });
    }
  };

  if (isLoading) {
    return (
      <View style={tw`flex-1 bg-slate-50 p-4`}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={tw`bg-white rounded-xl p-4 mb-4`}>
            <View style={tw`flex-row justify-between mb-4`}>
              <View>
                <Skeleton style={tw`h-5 w-32 mb-2`} />
                <Skeleton style={tw`h-4 w-48`} />
              </View>
              <Skeleton style={tw`h-6 w-20 rounded-full`} />
            </View>
            <Skeleton style={tw`h-40 w-full rounded-lg`} />
          </View>
        ))}
      </View>
    );
  }

  if (isError) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : 'Failed to load pending verifications'}
        onRetry={refetch}
      />
    );
  }

  return (
    <View style={tw`flex-1 bg-slate-50`}>
      <FlatList
        data={documents}
        keyExtractor={(item) => item.id}
        contentContainerStyle={tw`p-4 ${documents.length === 0 ? 'flex-1' : ''}`}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListEmptyComponent={
          <EmptyState
            title="All caught up!"
            subtitle="There are no pending verifications requiring review at this time."
            icon={ShieldAlert}
          />
        }
        initialNumToRender={5}
        windowSize={11}
        maxToRenderPerBatch={5}
        renderItem={({ item }) => (
          <View
            style={tw`bg-white rounded-xl border border-slate-200 overflow-hidden mb-4 shadow-sm`}
          >
            <View style={tw`p-4 border-b border-slate-100`}>
              <View style={tw`flex-row justify-between items-start mb-2`}>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-lg font-bold text-slate-900`}>
                    {item.user?.name || 'Unknown User'}
                  </Text>
                  <Text style={tw`text-slate-500 text-sm`}>{item.user?.email}</Text>
                </View>
                <View style={tw`bg-blue-100 px-2 py-1 rounded text-xs font-semibold`}>
                  <Text style={tw`text-blue-800 text-xs`}>{item.documentType}</Text>
                </View>
              </View>
              {item.user?.orgName && (
                <Text style={tw`text-slate-700 font-medium mt-1`}>Org: {item.user.orgName}</Text>
              )}
              <Text style={tw`text-slate-400 text-xs mt-2`}>
                Submitted {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
              </Text>
            </View>

            <View style={tw`bg-slate-100 p-2 items-center`}>
              <Image
                source={{ uri: item.documentUrl }}
                style={tw`w-full h-48 rounded bg-slate-200`}
                resizeMode="contain"
              />
            </View>

            <View style={tw`p-4 flex-row space-x-3`}>
              <View style={tw`flex-1`}>
                <Button
                  variant="secondary"
                  onPress={() => handleRejectPrompt(item.id)}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                >
                  <View style={tw`flex-row items-center justify-center`}>
                    <XCircle size={18} color="#ef4444" style={tw`mr-1`} />
                    <Text style={tw`text-red-500 font-semibold`}>Reject</Text>
                  </View>
                </Button>
              </View>
              <View style={tw`flex-1`}>
                <Button
                  variant="primary"
                  onPress={() => handleApprove(item.id)}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                >
                  <View style={tw`flex-row items-center justify-center`}>
                    <CheckCircle size={18} color="#ffffff" style={tw`mr-1`} />
                    <Text style={tw`text-white font-semibold`}>Approve</Text>
                  </View>
                </Button>
              </View>
            </View>
          </View>
        )}
      />

      {/* Reject Reason Modal */}
      <Modal
        visible={rejectModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <View style={tw`flex-1 bg-black/50 justify-center items-center px-4`}>
          <View style={tw`bg-white w-full rounded-2xl p-6`}>
            <Text style={tw`text-xl font-bold text-slate-900 mb-2`}>Reject Verification</Text>
            <Text style={tw`text-slate-600 mb-4`}>
              Please provide a reason for rejection. This will be sent to the user.
            </Text>

            <TextInput
              style={tw`border border-slate-300 rounded-xl p-4 bg-slate-50 text-slate-900 min-h-[100px] mb-6`}
              placeholder="e.g. Image is blurry, ID expired..."
              placeholderTextColor="#94a3b8"
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              textAlignVertical="top"
            />

            <View style={tw`flex-row space-x-3`}>
              <View style={tw`flex-1`}>
                <Button variant="ghost" onPress={() => setRejectModalVisible(false)}>
                  Cancel
                </Button>
              </View>
              <View style={tw`flex-1`}>
                <Button variant="primary" onPress={submitReject} loading={rejectMutation.isPending}>
                  Submit Reject
                </Button>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
