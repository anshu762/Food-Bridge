import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, RefreshControl } from 'react-native';
import { useAdminUsers } from '../../src/hooks/useAdmin';
import { Skeleton, ErrorState, EmptyState } from '../../src/components/ui/Feedback';
import { Users, Search, CheckCircle, XCircle, Clock } from 'lucide-react-native';
import tw from '../../src/utils/tw';
import { formatDistanceToNow } from 'date-fns';
import { TouchableCard, Card } from '../../src/components/ui/Card';

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
          <View style={tw`flex-row items-center bg-primary-50 px-8 py-4 rounded-pill`}>
            <CheckCircle size={12} color="#1B7A4D" />
            <Text style={tw`text-primary-800 text-caption font-semibold ml-4`}>Verified</Text>
          </View>
        );
      case 'PENDING':
        return (
          <View style={tw`flex-row items-center bg-warning/10 px-8 py-4 rounded-pill`}>
            <Clock size={12} color="#D97706" />
            <Text style={tw`text-warning text-caption font-semibold ml-4`}>Pending</Text>
          </View>
        );
      case 'REJECTED':
        return (
          <View style={tw`flex-row items-center bg-danger/10 px-8 py-4 rounded-pill`}>
            <XCircle size={12} color="#D9432E" />
            <Text style={tw`text-danger text-caption font-semibold ml-4`}>Rejected</Text>
          </View>
        );
      default:
        return (
          <View style={tw`flex-row items-center bg-neutral-100 px-8 py-4 rounded-pill`}>
            <Text style={tw`text-neutral-600 text-caption font-semibold`}>Unverified</Text>
          </View>
        );
    }
  };

  return (
    <View style={tw`flex-1 bg-neutral-50`}>
      <View style={tw`bg-surface px-16 py-12 border-b border-neutral-200 z-10`}>
        <View style={tw`flex-row items-center bg-neutral-100 rounded-md px-12 h-40 mb-12`}>
          <Search size={18} color="#9CA3AF" />
          <TextInput
            style={tw`flex-1 ml-8 text-neutral-900 text-body`}
            placeholder="Search users by name, email, or org..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <XCircle size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        <View style={tw`flex-row`}>
          <TouchableOpacity
            style={tw`px-12 py-6 rounded-pill border ${filterRole === 'DONOR' ? 'bg-primary border-primary' : 'bg-surface border-neutral-200'} mr-8`}
            onPress={() => setFilterRole(filterRole === 'DONOR' ? undefined : 'DONOR')}
          >
            <Text
              style={tw`text-caption font-semibold ${filterRole === 'DONOR' ? 'text-white' : 'text-neutral-600'}`}
            >
              Donors
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={tw`px-12 py-6 rounded-pill border ${filterRole === 'RECEIVER' ? 'bg-primary border-primary' : 'bg-surface border-neutral-200'} mr-8`}
            onPress={() => setFilterRole(filterRole === 'RECEIVER' ? undefined : 'RECEIVER')}
          >
            <Text
              style={tw`text-caption font-semibold ${filterRole === 'RECEIVER' ? 'text-white' : 'text-neutral-600'}`}
            >
              Receivers
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading && !isRefetching ? (
        <View style={tw`p-16`}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Card
              key={i}
              style={tw`mb-12 border border-neutral-100 flex-row items-center bg-surface p-16`}
            >
              <Skeleton style={tw`w-48 h-48 rounded-full mr-16`} />
              <View style={tw`flex-1`}>
                <Skeleton style={tw`h-20 w-3/4 mb-8`} />
                <Skeleton style={tw`h-16 w-1/2`} />
              </View>
            </Card>
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
          contentContainerStyle={tw`p-16 ${users.length === 0 ? 'flex-1' : ''}`}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#1B7A4D" />
          }
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
              <View style={tw`py-16 items-center`}>
                <Text style={tw`text-neutral-500`}>Loading more users...</Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <TouchableCard
              style={tw`mb-12 border border-neutral-200 bg-surface`}
              onPress={() => {}}
            >
              <View style={tw`flex-row items-center p-16`}>
                <View
                  style={tw`w-48 h-48 rounded-full bg-neutral-100 items-center justify-center mr-16`}
                >
                  <Text style={tw`text-h3 font-bold text-neutral-500`}>
                    {item.name?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                </View>
                <View style={tw`flex-1`}>
                  <View style={tw`flex-row justify-between items-start`}>
                    <Text
                      style={tw`text-body-emphasis text-neutral-900 flex-1 mr-8`}
                      numberOfLines={1}
                    >
                      {item.name || 'Anonymous User'}
                    </Text>
                    {renderStatusBadge(item.verificationStatus)}
                  </View>
                  <Text style={tw`text-neutral-500 text-body mt-4`} numberOfLines={1}>
                    {item.email}
                  </Text>
                  <View style={tw`flex-row mt-4 justify-between items-center`}>
                    <Text style={tw`text-neutral-400 text-caption`}>{item.role}</Text>
                    <Text style={tw`text-neutral-400 text-caption`}>
                      Joined {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableCard>
          )}
        />
      )}
    </View>
  );
}
