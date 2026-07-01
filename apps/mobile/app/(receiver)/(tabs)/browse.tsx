import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  RefreshControl,
} from 'react-native';
import * as Location from 'expo-location';
import { router, useFocusEffect } from 'expo-router';
import {
  Search,
  MapPin,
  SlidersHorizontal,
  X,
  Clock,
  PackageOpen,
  Grid3X3,
  List as ListIcon,
} from 'lucide-react-native';
import { differenceInMilliseconds, formatDistanceToNow } from 'date-fns';
import tw from '../../../src/utils/tw';
import { Button } from '../../../src/components/ui/Button';
import { Skeleton, EmptyState, ErrorState } from '../../../src/components/ui/Feedback';
import { TouchableCard } from '../../../src/components/ui/Card';
import { useUI } from '../../../src/components/ui/Providers';
import { api } from '../../../src/services/api';

interface Listing {
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
  safeUntil: string;
  preparedAt: string;
  status: string;
  distance?: number;
  donor: { id: string; name?: string; orgName?: string };
}

type ViewMode = 'list' | 'grid';

const FOOD_TYPES = [
  'Vegetables',
  'Fruits',
  'Dairy',
  'Bakery',
  'Grains',
  'Proteins',
  'Prepared Meals',
  'Non-perishable',
  'Other',
];

const RADIUS_OPTIONS = [1, 5, 10, 25, 50];

function getTimeRemaining(safeUntil: string): { text: string; urgent: boolean } {
  const diff = differenceInMilliseconds(new Date(safeUntil), new Date());
  if (diff <= 0) return { text: 'Expired', urgent: true };
  if (diff < 3600000) {
    return { text: `${Math.floor(diff / 60000)} min left`, urgent: true };
  }
  if (diff < 86400000) {
    return { text: `${Math.floor(diff / 3600000)}h left`, urgent: false };
  }
  return { text: formatDistanceToNow(new Date(safeUntil), { addSuffix: true }), urgent: false };
}

function getDistanceText(distance?: number): string | null {
  if (distance === undefined || distance === null) return null;
  if (distance < 1) return `${Math.round(distance * 1000)}m`;
  return `${distance.toFixed(1)}km`;
}

export default function ReceiverBrowse() {
  const { showToast } = useUI();

  const [listings, setListings] = useState<Listing[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);

  const [selectedFoodTypes, setSelectedFoodTypes] = useState<string[]>([]);
  const [radiusKm, setRadiusKm] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 400);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [searchQuery]);

  useEffect(() => {
    requestLocation();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!loading) {
        fetchListings(1, true);
      }
    }, [userLocation, debouncedSearch, selectedFoodTypes, radiusKm]),
  );

  const requestLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationDenied(true);
        fetchListings(1);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      fetchListings(1);
    } catch {
      setLocationDenied(true);
      fetchListings(1);
    }
  };

  const buildQueryParams = useCallback(
    (pageNum: number) => {
      const params: Record<string, string> = {
        page: String(pageNum),
        limit: '20',
        status: 'AVAILABLE',
      };
      if (userLocation) {
        params.lat = String(userLocation.lat);
        params.lng = String(userLocation.lng);
      }
      if (radiusKm) params.radiusKm = String(radiusKm);
      if (debouncedSearch) params.foodType = debouncedSearch;
      if (selectedFoodTypes.length === 1) params.foodType = selectedFoodTypes[0];
      return params;
    },
    [userLocation, radiusKm, debouncedSearch, selectedFoodTypes],
  );

  const fetchListings = async (pageNum: number, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
    setError(null);

    try {
      const params = buildQueryParams(pageNum);
      const res = await api.get('/listings', { params });
      const { data, meta } = res.data;

      if (pageNum === 1) setListings(data);
      else setListings((prev) => [...prev, ...data]);
      setPage(pageNum);
      setTotalPages(meta.totalPages);
    } catch {
      setError('Failed to load listings');
      showToast({ message: 'Failed to load listings', type: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (loadingMore || page >= totalPages) return;
    fetchListings(page + 1);
  };

  const handleRefresh = () => fetchListings(1, true);

  const filteredListings = useMemo(() => {
    return listings.filter((l) => {
      const matchesSearch =
        !debouncedSearch ||
        l.foodType.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        l.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (l.description && l.description.toLowerCase().includes(debouncedSearch.toLowerCase()));
      const matchesType = selectedFoodTypes.length === 0 || selectedFoodTypes.includes(l.foodType);
      return matchesSearch && matchesType;
    });
  }, [listings, debouncedSearch, selectedFoodTypes]);

  const toggleFoodType = (type: string) => {
    setSelectedFoodTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const clearFilters = () => {
    setSelectedFoodTypes([]);
    setRadiusKm(null);
    setSearchQuery('');
    setDebouncedSearch('');
  };

  const renderListingCard = ({ item }: { item: Listing }) => {
    const timeRemaining = getTimeRemaining(item.safeUntil);
    const distanceText = userLocation ? getDistanceText(item.distance) : null;

    return (
      <TouchableCard
        style={tw`mb-12 overflow-hidden border-neutral-200 bg-surface`}
        onPress={() => (router as any).push(`/(receiver)/listing/${item.id}`)}
      >
        <View style={tw`flex-row`}>
          <View style={tw`w-24 h-24 bg-primary-50 items-center justify-center`}>
            <PackageOpen size={32} color="#1B7A4D" />
          </View>
          <View style={tw`flex-1 p-12 justify-center`}>
            <Text style={tw`text-body-emphasis text-neutral-900`} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={tw`text-caption text-neutral-500 mt-4`}>
              {item.donor.orgName || item.donor.name || 'Organization'}
            </Text>
            <View style={tw`flex-row items-center mt-8`}>
              <View style={tw`bg-primary-50 rounded-pill px-8 py-4 mr-8`}>
                <Text style={tw`text-primary-800 text-caption font-semibold`}>
                  {item.quantity} {item.unit}
                </Text>
              </View>
              {distanceText && (
                <View style={tw`flex-row items-center`}>
                  <MapPin size={12} color="#6B7280" />
                  <Text style={tw`text-caption text-neutral-500 ml-4`}>{distanceText}</Text>
                </View>
              )}
            </View>
            <View style={tw`flex-row items-center mt-4`}>
              <Clock size={12} color={timeRemaining.urgent ? '#D9432E' : '#6B7280'} />
              <Text
                style={[
                  tw`text-caption ml-4`,
                  timeRemaining.urgent ? tw`text-danger font-semibold` : tw`text-neutral-500`,
                ]}
              >
                {timeRemaining.text}
              </Text>
            </View>
          </View>
        </View>
      </TouchableCard>
    );
  };

  const renderGridCard = ({ item }: { item: Listing }) => {
    const timeRemaining = getTimeRemaining(item.safeUntil);
    const distanceText = userLocation ? getDistanceText(item.distance) : null;

    return (
      <TouchableCard
        style={tw`mb-12 overflow-hidden border-neutral-200 bg-surface w-[48%]`}
        onPress={() => (router as any).push(`/(receiver)/listing/${item.id}`)}
      >
        <View style={tw`h-24 bg-primary-50 items-center justify-center`}>
          <PackageOpen size={36} color="#1B7A4D" />
        </View>
        <View style={tw`p-12`}>
          <Text style={tw`text-body-emphasis text-neutral-900`} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={tw`text-caption text-neutral-500 mt-4`}>
            {item.quantity} {item.unit}
          </Text>
          <View style={tw`flex-row items-center justify-between mt-8`}>
            {distanceText ? (
              <Text style={tw`text-caption text-neutral-500`}>{distanceText}</Text>
            ) : (
              <View />
            )}
            <Text
              style={[
                tw`text-caption`,
                timeRemaining.urgent ? tw`text-danger font-semibold` : tw`text-neutral-500`,
              ]}
            >
              {timeRemaining.text}
            </Text>
          </View>
        </View>
      </TouchableCard>
    );
  };

  const renderFilterModal = () => (
    <Modal visible={showFilters} animationType="slide" transparent>
      <View style={tw`flex-1 bg-neutral-900/50`}>
        <View style={tw`mt-auto bg-surface rounded-t-3xl p-24 max-h-[80%]`}>
          <View style={tw`flex-row items-center justify-between mb-24`}>
            <Text style={tw`text-h2 font-bold text-neutral-900`}>Filters</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView>
            <Text style={tw`text-body-emphasis text-neutral-800 mb-12`}>Food Type</Text>
            <View style={tw`flex-row flex-wrap`}>
              {FOOD_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    tw`rounded-pill px-16 py-8 mr-8 mb-8 border`,
                    selectedFoodTypes.includes(type)
                      ? tw`bg-primary border-primary`
                      : tw`bg-surface border-neutral-200`,
                  ]}
                  onPress={() => toggleFoodType(type)}
                >
                  <Text
                    style={[
                      tw`text-body-emphasis`,
                      selectedFoodTypes.includes(type) ? tw`text-surface` : tw`text-neutral-700`,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={tw`text-body-emphasis text-neutral-800 mb-12 mt-24`}>
              Radius{radiusKm ? ` (${radiusKm} km)` : ''}
            </Text>
            <View style={tw`flex-row flex-wrap`}>
              {RADIUS_OPTIONS.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[
                    tw`rounded-pill px-16 py-8 mr-8 mb-8 border`,
                    radiusKm === r
                      ? tw`bg-primary border-primary`
                      : tw`bg-surface border-neutral-200`,
                  ]}
                  onPress={() => setRadiusKm(radiusKm === r ? null : r)}
                >
                  <Text
                    style={[
                      tw`text-body-emphasis`,
                      radiusKm === r ? tw`text-surface` : tw`text-neutral-700`,
                    ]}
                  >
                    {r} km
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={tw`flex-row pt-16 border-t border-neutral-100 mt-16`}>
            <Button variant="ghost" style={tw`flex-1 mr-8`} onPress={clearFilters}>
              Clear All
            </Button>
            <Button variant="primary" style={tw`flex-1 ml-8`} onPress={() => setShowFilters(false)}>
              Apply Filters
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={tw`flex-1 bg-gray-50`}>
        <View style={tw`bg-white pt-12 pb-4 px-4`}>
          <Skeleton style={tw`h-8 w-32 mb-2`} />
          <Skeleton style={tw`h-4 w-48`} />
        </View>
        <View style={tw`px-4 pt-4`}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} style={tw`h-24 w-full mb-3 rounded-2xl`} />
          ))}
        </View>
      </View>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => fetchListings(1)} />;
  }

  return (
    <View style={tw`flex-1 bg-neutral-50`}>
      <View style={tw`bg-surface pt-48 pb-12 px-16 border-b border-neutral-100`}>
        <Text style={tw`text-display font-bold text-primary mb-12`}>Browse</Text>
        <View style={tw`flex-row items-center`}>
          <View style={tw`flex-1 flex-row items-center bg-neutral-50 rounded-xl px-12 h-12`}>
            <Search size={18} color="#9CA3AF" />
            <TextInput
              style={tw`flex-1 ml-8 text-body text-neutral-900`}
              placeholder="Search listings..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={16} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={tw`ml-8 h-12 w-12 items-center justify-center rounded-xl bg-neutral-50`}
            onPress={() => setShowFilters(true)}
          >
            <SlidersHorizontal size={18} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity
            style={tw`ml-8 h-12 w-12 items-center justify-center rounded-xl ${
              viewMode === 'grid' ? 'bg-primary-100' : 'bg-neutral-50'
            }`}
            onPress={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
          >
            {viewMode === 'list' ? (
              <Grid3X3 size={18} color="#374151" />
            ) : (
              <ListIcon size={18} color="#374151" />
            )}
          </TouchableOpacity>
        </View>
        {locationDenied && !userLocation && (
          <TouchableOpacity
            style={tw`flex-row items-center mt-8 bg-warning/10 rounded-lg px-12 py-8`}
            onPress={requestLocation}
          >
            <MapPin size={14} color="#D97706" />
            <Text style={tw`text-warning text-caption ml-8 flex-1`}>
              Enable location for distance sorting
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {filteredListings.length === 0 ? (
        debouncedSearch || selectedFoodTypes.length > 0 || radiusKm ? (
          <EmptyState
            title="No results match your filters"
            subtitle="Try adjusting your search or filters"
            icon={Search}
            actionLabel="Clear Filters"
            onAction={clearFilters}
          />
        ) : (
          <EmptyState
            title="No food available right now"
            subtitle="Check back soon for new listings"
            icon={PackageOpen}
          />
        )
      ) : viewMode === 'grid' ? (
        <FlatList
          data={filteredListings}
          renderItem={renderGridCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={tw`justify-between px-16`}
          contentContainerStyle={tw`pt-12 pb-32`}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#1B7A4D" />
          }
        />
      ) : (
        <FlatList
          data={filteredListings}
          renderItem={renderListingCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={tw`px-16 pt-12 pb-32`}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#1B7A4D" />
          }
        />
      )}

      {renderFilterModal()}
    </View>
  );
}
