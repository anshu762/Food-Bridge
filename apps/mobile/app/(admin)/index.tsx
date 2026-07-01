import React, { useState } from 'react';
import { View, Text, FlatList, Image, RefreshControl, Modal, TextInput } from 'react-native';
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
import { useUI } from '../../src/components/ui/Providers';
import { Card } from '../../src/components/ui/Card';

export default function PendingVerificationsScreen() {
  const { data, isLoading, isError, error, refetch, isRefetching } = usePendingVerifications();
  const approveMutation = useApproveVerification();
  const rejectMutation = useRejectVerification();
  const { showToast, showDialog } = useUI();

  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const documents: VerificationDocument[] = data?.data || [];

  const handleApprove = (id: string) => {
    showDialog({
      title: 'Approve Verification',
      message: 'Are you sure you want to approve this document? This will verify the user.',
      cancelText: 'Cancel',
      confirmText: 'Approve',
      onConfirm: async () => {
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
    });
  };

  const handleRejectPrompt = (id: string) => {
    setSelectedDocId(id);
    setRejectReason('');
    setRejectModalVisible(true);
  };

  const submitReject = async () => {
    if (!selectedDocId || !rejectReason.trim()) {
      showToast({ message: 'Please provide a reason for rejection.', type: 'error' });
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
      <View style={tw`flex-1 bg-neutral-50 p-16`}>
        {[1, 2, 3].map((i) => (
          <Card key={i} style={tw`mb-16 bg-surface border-neutral-200`}>
            <View style={tw`flex-row justify-between mb-16`}>
              <View>
                <Skeleton style={tw`h-20 w-112 mb-8`} />
                <Skeleton style={tw`h-16 w-192`} />
              </View>
              <Skeleton style={tw`h-24 w-80 rounded-pill`} />
            </View>
            <Skeleton style={tw`h-160 w-full rounded-md`} />
          </Card>
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
    <View style={tw`flex-1 bg-neutral-50`}>
      <FlatList
        data={documents}
        keyExtractor={(item) => item.id}
        contentContainerStyle={tw`p-16 ${documents.length === 0 ? 'flex-1' : ''}`}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#1B7A4D" />
        }
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
          <Card style={tw`mb-16 overflow-hidden bg-surface border-neutral-200 p-0`}>
            <View style={tw`p-16 border-b border-neutral-100`}>
              <View style={tw`flex-row justify-between items-start mb-8`}>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-h3 text-neutral-900`}>
                    {item.user?.name || 'Unknown User'}
                  </Text>
                  <Text style={tw`text-body text-neutral-500`}>{item.user?.email}</Text>
                </View>
                <View style={tw`bg-info/10 px-8 py-4 rounded text-caption font-semibold`}>
                  <Text style={tw`text-info text-caption`}>{item.documentType}</Text>
                </View>
              </View>
              {item.user?.orgName && (
                <Text style={tw`text-body-emphasis text-neutral-700 mt-4`}>
                  Org: {item.user.orgName}
                </Text>
              )}
              <Text style={tw`text-caption text-neutral-400 mt-8`}>
                Submitted {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
              </Text>
            </View>

            <View style={tw`bg-neutral-100 p-8 items-center`}>
              <Image
                source={{ uri: item.documentUrl }}
                style={tw`w-full h-192 rounded-md bg-neutral-200`}
                resizeMode="contain"
              />
            </View>

            <View style={tw`p-16 flex-row space-x-12`}>
              <View style={tw`flex-1 mr-8`}>
                <Button
                  variant="secondary"
                  onPress={() => handleRejectPrompt(item.id)}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                >
                  <View style={tw`flex-row items-center justify-center`}>
                    <XCircle size={18} color="#D9432E" style={tw`mr-4`} />
                    <Text style={tw`text-danger font-semibold`}>Reject</Text>
                  </View>
                </Button>
              </View>
              <View style={tw`flex-1 ml-8`}>
                <Button
                  variant="primary"
                  onPress={() => handleApprove(item.id)}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                >
                  <View style={tw`flex-row items-center justify-center`}>
                    <CheckCircle size={18} color="#ffffff" style={tw`mr-4`} />
                    <Text style={tw`text-white font-semibold`}>Approve</Text>
                  </View>
                </Button>
              </View>
            </View>
          </Card>
        )}
      />

      {/* Reject Reason Modal */}
      <Modal
        visible={rejectModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <View style={tw`flex-1 bg-neutral-900/50 justify-center items-center px-16`}>
          <View style={tw`bg-surface w-full rounded-xl p-24`}>
            <Text style={tw`text-h2 font-bold text-neutral-900 mb-8`}>Reject Verification</Text>
            <Text style={tw`text-body text-neutral-600 mb-16`}>
              Please provide a reason for rejection. This will be sent to the user.
            </Text>

            <TextInput
              style={tw`border border-neutral-200 rounded-md p-16 bg-neutral-50 text-neutral-900 min-h-[100px] mb-24`}
              placeholder="e.g. Image is blurry, ID expired..."
              placeholderTextColor="#9CA3AF"
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              textAlignVertical="top"
            />

            <View style={tw`flex-row space-x-12`}>
              <View style={tw`flex-1 mr-8`}>
                <Button variant="ghost" onPress={() => setRejectModalVisible(false)}>
                  Cancel
                </Button>
              </View>
              <View style={tw`flex-1 ml-8`}>
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
