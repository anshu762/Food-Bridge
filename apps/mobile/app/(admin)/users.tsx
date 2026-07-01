import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, RefreshControl } from 'react-native';
import { useAdminUsers } from '../../src/hooks/useAdmin';
import { Skeleton, ErrorState, EmptyState } from '../../src/components/ui/Feedback';
import { Users, Search, CheckCircle, XCircle, Clock } from 'lucide-react-native';
import tw from '../../src/utils/tw';
import { formatDistanceToNow } from 'date-fns';

export default function UsersScreen() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string | undefined>();
  const [filterStatus] = useState<string | undefined>();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

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
  } = useAdminUsers(debouncedSearch, filterRole, filterStatus);

  const users = data?.pages.flatMap((page) => page.data) || [];

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <View style={tw`flex-row items-center bg-green-100 px-2 py-1 rounded-full`}>
            <CheckCircle size={12} color="#15803d" />
            <Text style={tw`text-green-800 text-xs font-semibold ml-1`}>Verified</Text>
          </View>
        );
      case 'PENDING':
        return (
          <View style={tw`flex-row items-center bg-yellow-100 px-2 py-1 rounded-full`}>
            <Clock size={12} color="#a16207" />
            <Text style={tw`text-yellow-800 text-xs font-semibold ml-1`}>Pending</Text>
          </View>
        );
      case 'REJECTED':
        return (
          <View style={tw`flex-row items-center bg-red-100 px-2 py-1 rounded-full`}>
            <XCircle size={12} color="#b91c1c" />
            <Text style={tw`text-red-800 text-xs font-semibold ml-1`}>Rejected</Text>
          </View>
        );
      default:
        return (
          <View style={tw`flex-row items-center bg-slate-100 px-2 py-1 rounded-full`}>
            <Text style={tw`text-slate-600 text-xs font-semibold`}>Unverified</Text>
          </View>
        );
    }
  };

  return (
    <View style={tw`flex-1 bg-slate-50`}>
      <View style={tw`bg-white px-4 py-3 border-b border-slate-200 z-10`}>
        <View style={tw`flex-row items-center bg-slate-100 rounded-xl px-3 h-10 mb-3`}>
          <Search size={18} color="#64748b" />
          <TextInput
            style={tw`flex-1 ml-2 text-slate-900 text-sm`}
            placeholder="Search users by name, email, or org..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <XCircle size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        <View style={tw`flex-row`}>
          <TouchableOpacity
            style={tw`px-3 py-1.5 rounded-full border ${filterRole === 'DONOR' ? 'bg-slate-800 border-slate-800' : 'bg-white border-slate-300'} mr-2`}
            onPress={() => setFilterRole(filterRole === 'DONOR' ? undefined : 'DONOR')}
          >
            <Text
              style={tw`text-xs font-semibold ${filterRole === 'DONOR' ? 'text-white' : 'text-slate-600'}`}
            >
              Donors
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={tw`px-3 py-1.5 rounded-full border ${filterRole === 'RECEIVER' ? 'bg-slate-800 border-slate-800' : 'bg-white border-slate-300'} mr-2`}
            onPress={() => setFilterRole(filterRole === 'RECEIVER' ? undefined : 'RECEIVER')}
          >
            <Text
              style={tw`text-xs font-semibold ${filterRole === 'RECEIVER' ? 'text-white' : 'text-slate-600'}`}
            >
              Receivers
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading && !isRefetching ? (
        <View style={tw`p-4`}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View
              key={i}
              style={tw`bg-white rounded-xl p-4 mb-3 border border-slate-100 flex-row items-center`}
            >
              <Skeleton style={tw`w-12 h-12 rounded-full mr-4`} />
              <View style={tw`flex-1`}>
                <Skeleton style={tw`h-5 w-3/4 mb-2`} />
                <Skeleton style={tw`h-4 w-1/2`} />
              </View>
            </View>
          ))}
        </View>
      ) : isError ? (
        <ErrorState
          message={error instanceof Error ? error.message : 'Failed to load users'}
          onRetry={refetch}
        />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          contentContainerStyle={tw`p-4 ${users.length === 0 ? 'flex-1' : ''}`}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={
            <EmptyState
              title="No users found"
              subtitle="Try adjusting your search or filters to find what you're looking for."
              icon={Users}
            />
          }
          initialNumToRender={10}
          windowSize={21}
          maxToRenderPerBatch={10}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={tw`py-4 items-center`}>
                <Text style={tw`text-slate-500`}>Loading more users...</Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={tw`bg-white rounded-xl p-4 mb-3 border border-slate-200 flex-row items-center shadow-sm`}
            >
              <View
                style={tw`w-12 h-12 rounded-full bg-slate-100 items-center justify-center mr-4`}
              >
                <Text style={tw`text-lg font-bold text-slate-500`}>
                  {item.name?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
              <View style={tw`flex-1`}>
                <View style={tw`flex-row justify-between items-start`}>
                  <Text style={tw`text-base font-bold text-slate-900`} numberOfLines={1}>
                    {item.name || 'Anonymous User'}
                  </Text>
                  {renderStatusBadge(item.verificationStatus)}
                </View>
                <Text style={tw`text-slate-500 text-sm`} numberOfLines={1}>
                  {item.email}
                </Text>
                <View style={tw`flex-row mt-1 justify-between items-center`}>
                  <Text style={tw`text-slate-400 text-xs`}>{item.role}</Text>
                  <Text style={tw`text-slate-400 text-xs`}>
                    Joined {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}
