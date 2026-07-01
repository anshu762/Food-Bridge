import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { useUI } from './ui/Providers';
import {
  User,
  Shield,
  Lock,
  Trash2,
  LogOut,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react-native';
import tw from '../utils/tw';
import { useAuthStore } from '../store/authStore';
import {
  useProfile,
  useUpdateProfile,
  useChangePassword,
  useDeleteAccount,
  useVerificationDocuments,
  useUploadVerificationDocument,
} from '../hooks/useUsers';
import { useUpload } from '../hooks/useUpload';
import { notifySuccess } from '../utils/haptics';
import { Skeleton, ErrorState } from './ui/Feedback';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

function EditField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'phone-pad';
}) {
  return (
    <View style={tw`mb-4`}>
      <Text style={tw`text-sm font-medium text-gray-700 mb-1`}>{label}</Text>
      <TextInput
        style={tw`border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900`}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
      />
    </View>
  );
}

function VerificationBadge({ status }: { status: 'PENDING' | 'APPROVED' | 'REJECTED' }) {
  const config = {
    APPROVED: { bg: 'bg-green-50', text: 'text-green-700', icon: CheckCircle, label: 'Verified' },
    PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', icon: Clock, label: 'Pending Review' },
    REJECTED: { bg: 'bg-red-50', text: 'text-red-700', icon: XCircle, label: 'Rejected' },
  };
  const c = config[status];
  const Icon = c.icon;
  return (
    <View style={tw`flex-row items-center ${c.bg} px-3 py-1.5 rounded-full`}>
      <Icon
        size={14}
        color={status === 'APPROVED' ? '#059669' : status === 'PENDING' ? '#D97706' : '#EF4444'}
      />
      <Text style={tw`text-xs font-semibold ${c.text} ml-1.5`}>{c.label}</Text>
    </View>
  );
}

function ProfileSkeleton() {
  return (
    <View style={tw`p-24`}>
      <View style={tw`items-center mb-32`}>
        <Skeleton style={tw`h-80 w-80 rounded-full mb-12`} />
        <Skeleton style={tw`h-20 w-160 mb-4`} />
        <Skeleton style={tw`h-16 w-112`} />
      </View>
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} style={tw`h-56 w-full mb-12 rounded-xl`} />
      ))}
    </View>
  );
}

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const { showToast, showDialog } = useUI();
  const { data: profile, isLoading, isError, refetch } = useProfile();
  const { mutateAsync: updateProfile, isPending: updating } = useUpdateProfile();
  const { mutateAsync: changePassword, isPending: changingPwd } = useChangePassword();
  const { mutateAsync: deleteAccount, isPending: deleting } = useDeleteAccount();
  const { data: verifDocs } = useVerificationDocuments();
  const { mutateAsync: uploadDoc, isPending: uploadingDoc } = useUploadVerificationDocument();
  const { pickAndUpload, uploading: uploadPhoto } = useUpload();

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editOrg, setEditOrg] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');

  const role = user?.role || 'RECEIVER';

  const handleStartEdit = useCallback(() => {
    setEditName(profile?.name || '');
    setEditPhone(profile?.phone || '');
    setEditOrg(profile?.orgName || '');
    setEditing(true);
  }, [profile]);

  const handleSaveProfile = useCallback(async () => {
    try {
      await updateProfile({ name: editName, phone: editPhone, orgName: editOrg || undefined });
      setEditing(false);
      notifySuccess();
    } catch {}
  }, [updateProfile, editName, editPhone, editOrg]);

  const handleChangePassword = useCallback(async () => {
    if (!currentPwd || !newPwd) {
      showToast({ message: 'Please fill in both fields', type: 'error' });
      return;
    }
    if (newPwd.length < 8) {
      showToast({ message: 'New password must be at least 8 characters', type: 'error' });
      return;
    }
    try {
      await changePassword({ currentPassword: currentPwd, newPassword: newPwd });
      showToast({ message: 'Password changed successfully', type: 'success' });
      notifySuccess();
      setShowPasswordForm(false);
      setCurrentPwd('');
      setNewPwd('');
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Failed to change password';
      showToast({ message: msg, type: 'error' });
    }
  }, [changePassword, currentPwd, newPwd]);

  const handleDeleteAccount = useCallback(() => {
    showDialog({
      title: 'Delete Account',
      message:
        'This action is irreversible. Your account will be permanently deleted and all your personal information will be removed. Your past listings and requests will be anonymized to preserve community data.',
      cancelText: 'Cancel',
      confirmText: 'Delete My Account',
      type: 'destructive',
      onConfirm: async () => {
        try {
          await deleteAccount();
          await logout();
        } catch {}
      },
    });
  }, [deleteAccount, logout]);

  const handleLogout = useCallback(() => {
    showDialog({
      title: 'Logout',
      message: 'Are you sure you want to log out?',
      cancelText: 'Cancel',
      confirmText: 'Logout',
      onConfirm: () => logout(),
    });
  }, [logout]);

  const handleUploadVerificationDoc = useCallback(async () => {
    const url = await pickAndUpload();
    if (url) {
      try {
        await uploadDoc(url);
        showDialog({
          title: 'Submitted',
          message: 'Your verification document has been uploaded for review.',
          confirmText: 'OK',
        });
      } catch {}
    }
  }, [pickAndUpload, uploadDoc]);

  const handleReUpload = useCallback(async () => {
    const url = await pickAndUpload();
    if (url) {
      try {
        await uploadDoc(url);
        showDialog({
          title: 'Re-submitted',
          message: 'Your new verification document has been uploaded for review.',
          confirmText: 'OK',
        });
      } catch {}
    }
  }, [pickAndUpload, uploadDoc]);

  if (isLoading) return <ProfileSkeleton />;
  if (isError) return <ErrorState message="Failed to load profile" onRetry={() => refetch()} />;

  const verifStatus = profile?.verificationStatus || 'PENDING';
  const latestDoc = verifDocs && verifDocs.length > 0 ? verifDocs[0] : null;

  return (
    <ScrollView
      style={tw`flex-1 bg-neutral-50`}
      contentContainerStyle={tw`p-16 pb-80`}
      refreshControl={<RefreshControl refreshing={false} onRefresh={() => refetch()} />}
    >
      {/* Profile Header */}
      <View style={tw`items-center mb-32`}>
        <View style={tw`h-80 w-80 rounded-full bg-primary-100 items-center justify-center mb-12`}>
          <User size={36} color="#1B7A4D" />
        </View>
        <Text style={tw`text-h2 text-neutral-900`}>{profile?.name || 'User'}</Text>
        <Text style={tw`text-body text-neutral-500 mb-8`}>{profile?.email}</Text>
        <VerificationBadge status={verifStatus} />
      </View>

      {/* Edit Profile */}
      <Card style={tw`p-16 mb-16 border-neutral-200 bg-surface`}>
        {editing ? (
          <>
            <Text style={tw`text-h3 text-neutral-900 mb-16`}>Edit Profile</Text>
            <EditField
              label="Name"
              value={editName}
              onChangeText={setEditName}
              placeholder="Your name"
            />
            <EditField
              label="Phone"
              value={editPhone}
              onChangeText={setEditPhone}
              placeholder="Phone number"
              keyboardType="phone-pad"
            />
            {role === 'DONOR' && (
              <EditField
                label="Organization"
                value={editOrg}
                onChangeText={setEditOrg}
                placeholder="Organization name"
              />
            )}
            <View style={tw`flex-row space-x-12`}>
              <Button variant="ghost" onPress={() => setEditing(false)} style={tw`flex-1 mr-8`}>
                Cancel
              </Button>
              <Button loading={updating} onPress={handleSaveProfile} style={tw`flex-1 ml-8`}>
                Save
              </Button>
            </View>
          </>
        ) : (
          <TouchableOpacity
            style={tw`flex-row items-center`}
            onPress={handleStartEdit}
            activeOpacity={0.7}
          >
            <View style={tw`flex-1`}>
              <Text style={tw`text-body-emphasis text-neutral-900`}>
                {profile?.name || 'Add Name'}
              </Text>
              <Text style={tw`text-body text-neutral-500`}>
                {profile?.phone || 'Add phone number'}
              </Text>
              {profile?.orgName && (
                <Text style={tw`text-caption text-neutral-400 mt-2`}>{profile.orgName}</Text>
              )}
            </View>
            <ChevronRight size={18} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </Card>

      {/* Verification Section */}
      {role === 'DONOR' && (
        <Card style={tw`p-16 mb-16 border-neutral-200 bg-surface`}>
          <View style={tw`flex-row items-center mb-12`}>
            <Shield size={18} color="#1B7A4D" />
            <Text style={tw`text-body-emphasis text-neutral-900 ml-8`}>Verification</Text>
          </View>

          {verifStatus === 'APPROVED' ? (
            <View style={tw`bg-green-50 rounded-xl p-4`}>
              <Text style={tw`text-sm text-green-700 font-medium`}>
                Your identity has been verified.
              </Text>
            </View>
          ) : verifStatus === 'REJECTED' ? (
            <View style={tw`bg-red-50 rounded-xl p-4`}>
              <Text style={tw`text-sm text-red-700 font-medium mb-2`}>
                Your verification was rejected.
              </Text>
              {latestDoc && (
                <Text style={tw`text-xs text-red-600 mb-3`}>Previous document: rejected</Text>
              )}
              <Button size="sm" loading={uploadPhoto || uploadingDoc} onPress={handleReUpload}>
                Re-upload Document
              </Button>
            </View>
          ) : (
            <View style={tw`bg-amber-50 rounded-xl p-4`}>
              <Text style={tw`text-sm text-amber-700 font-medium mb-2`}>Verification pending</Text>
              {latestDoc ? (
                <Text style={tw`text-xs text-amber-600 mb-2`}>
                  Document uploaded, awaiting review
                </Text>
              ) : (
                <Text style={tw`text-xs text-amber-600 mb-2`}>
                  Upload a document to verify your organization
                </Text>
              )}
              {!latestDoc && (
                <Button
                  size="sm"
                  loading={uploadPhoto || uploadingDoc}
                  onPress={handleUploadVerificationDoc}
                >
                  Upload Document
                </Button>
              )}
            </View>
          )}
        </Card>
      )}

      {/* Change Password */}
      <Card style={tw`p-16 mb-16 border-neutral-200 bg-surface`}>
        {showPasswordForm ? (
          <>
            <View style={tw`flex-row items-center mb-16`}>
              <Lock size={18} color="#1B7A4D" />
              <Text style={tw`text-body-emphasis text-neutral-900 ml-8`}>Change Password</Text>
            </View>
            <EditField
              label="Current Password"
              value={currentPwd}
              onChangeText={setCurrentPwd}
              placeholder="Enter current password"
            />
            <EditField
              label="New Password"
              value={newPwd}
              onChangeText={setNewPwd}
              placeholder="Min 8 characters"
            />
            <View style={tw`flex-row space-x-12`}>
              <Button
                variant="ghost"
                onPress={() => setShowPasswordForm(false)}
                style={tw`flex-1 mr-8`}
              >
                Cancel
              </Button>
              <Button loading={changingPwd} onPress={handleChangePassword} style={tw`flex-1 ml-8`}>
                Update
              </Button>
            </View>
          </>
        ) : (
          <TouchableOpacity
            style={tw`flex-row items-center`}
            onPress={() => setShowPasswordForm(true)}
            activeOpacity={0.7}
          >
            <Lock size={18} color="#1B7A4D" />
            <Text style={tw`text-body-emphasis text-neutral-900 ml-8 flex-1`}>Change Password</Text>
            <ChevronRight size={18} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </Card>

      {/* Logout */}
      <Button variant="danger" onPress={handleLogout} fullWidth style={tw`mb-12`}>
        <View style={tw`flex-row items-center`}>
          <LogOut size={18} color="#ffffff" />
          <Text style={tw`text-white font-semibold ml-8`}>Log Out</Text>
        </View>
      </Button>

      {/* Delete Account */}
      <Button
        variant="ghost"
        fullWidth
        loading={deleting}
        onPress={handleDeleteAccount}
        style={tw`border-danger/20`}
      >
        <View style={tw`flex-row items-center`}>
          <Trash2 size={18} color="#D9432E" />
          <Text style={tw`text-danger font-semibold ml-8`}>Delete Account</Text>
        </View>
      </Button>
    </ScrollView>
  );
}
