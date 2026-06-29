import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
  RefreshControl,
} from 'react-native';
import * as Location from 'expo-location';
import { router, useFocusEffect } from 'expo-router';
import {
  Search,
  MapPin,
  List,
  SlidersHorizontal,
  X,
  Clock,
  PackageOpen,
  Crosshair,
} from 'lucide-react-native';
import { formatDistanceToNow, differenceInMilliseconds } from 'date-fns';
import tw from '../../../src/utils/tw';
import { Button } from '../../../src/components/ui/Button';
import { Badge } from '../../../src/components/ui/Badge';
import { Skeleton, EmptyState, ErrorState } from '../../../src/components/ui/Feedback';
import { useToast } from '../../../src/components/ui/Toast';
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

type ViewMode = 'list' | 'map';

const FOOD_TYPES = [
  'Vegetables', 'Fruits', 'Dairy', 'Bakery', 'Grains',
  'Proteins', 'Prepared Meals', 'Non-perishable', 'Other',
];

const RADIUS_OPTIONS = [1, 5, 10, 25, 50];

function getTimeRemaining(safeUntil: string): { text: string; urgent: boolean } {
  const diff = differenceInMilliseconds(new Date(safeUntil), new Date());
  if (diff <= 0) return { text: 'Expired', urgent: true };
  if (diff < 3600000) {
    const mins = Math.floor(diff / 60000);
    return { text: `${mins} min left`, urgent: true };
  }
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return { text: `${hours}h left`, urgent: false };
  }
  return { text: formatDistanceToNow(new Date(safeUntil), { addSuffix: true }), urgent: false };
}

function getDistanceText(distance?: number): string | null {
  if (distance === undefined || distance === null) return null;
  if (distance < 1) return `${Math.round(distance * 1000)}m`;
  return `${distance.toFixed(1)}km`;
}

export default function ReceiverDiscover() {
  const { showToast } = useToast();

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
  const [locationName, setLocationName] = useState<string | null>(null);

  const [selectedFoodTypes, setSelectedFoodTypes] = useState<string[]>([]);
  const [radiusKm, setRadiusKm] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search
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

  // Request location on mount
  useEffect(() => {
    requestLocation();
  }, []);

  // Re-fetch on focus (pull-to-refresh equivalent on screen focus)
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
      try {
        const geocode = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        if (geocode.length > 0) {
          const { city, district, region, subregion, name } = geocode[0];
          setLocationName(city || district || subregion || region || name || null);
        }
      } catch {
        // geocode optional
      }
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
    if (isRefresh) {
      setRefreshing(true);
    } else if (pageNum === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);

    try {
      const params = buildQueryParams(pageNum);
      const res = await api.get('/listings', { params });
      const { data, meta } = res.data;

      if (pageNum === 1) {
        setListings(data);
      } else {
        setListings((prev) => [...prev, ...data]);
      }
      setPage(pageNum);
      setTotalPages(meta.totalPages);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? String((err as { response: { data: { error?: string } } }).response?.data?.error || '')
          : '';
      setError(msg || 'Failed to load listings');
      showToast({ message: msg || 'Failed to load listings', type: 'error' });
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

  const handleRefresh = () => {
    fetchListings(1, true);
  };

  const filteredListings = useMemo(() => {
    if (!debouncedSearch && selectedFoodTypes.length <= 1) return listings;
    return listings.filter((l) => {
      const matchesSearch =
        !debouncedSearch ||
        l.foodType.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        l.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (l.description && l.description.toLowerCase().includes(debouncedSearch.toLowerCase()));
      const matchesType =
        selectedFoodTypes.length === 0 || selectedFoodTypes.includes(l.foodType);
      return matchesSearch && matchesType;
    });
  }, [listings, debouncedSearch, selectedFoodTypes]);

  const toggleFoodType = (type: string) => {
    setSelectedFoodTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const applyFiltersAndClose = () => {
    setShowFilters(false);
    setPage(1);
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
      <TouchableOpacity
        style={tw`bg-white rounded-2xl border border-gray-100 mb-4 overflow-hidden`}
        activeOpacity={0.7}
        onPress={() => (router as any).push(`/(receiver)/listing/${item.id}`)}
      >
        {item.photos && item.photos.length > 0 ? (
          <View style={tw`h-44 bg-gray-100`}>
            <View
              style={tw`flex-1 items-center justify-center bg-gray-100`}
            >
              <Text style={tw`text-gray-400 text-base`}>{item.foodType}</Text>
            </View>
          </View>
        ) : (
          <View style={tw`h-44 bg-primary-50 items-center justify-center`}>
            <PackageOpen size={48} color="#97C459" />
          </View>
        )}
        <View style={tw`p-4`}>
          <View style={tw`flex-row items-start justify-between`}>
            <View style={tw`flex-1 mr-2`}>
              <Text style={tw`text-lg font-bold text-gray-900`} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={tw`text-sm text-gray-500 mt-1`} numberOfLines={1}>
                {item.donor.orgName || item.donor.name || 'Anonymous'}
              </Text>
            </View>
            <Badge status={timeRemaining.urgent ? 'PENDING' : 'AVAILABLE'} />
          </View>

          <View style={tw`flex-row items-center mt-3 flex-wrap`}>
            <View style={tw`bg-primary-50 rounded-lg px-3 py-1 mr-2 mb-1`}>
              <Text style={tw`text-primary-600 text-sm font-medium`}>
                {item.quantity} {item.unit}
              </Text>
            </View>
            <View style={tw`bg-gray-50 rounded-lg px-3 py-1 mr-2 mb-1`}>
              <Text style={tw`text-gray-600 text-sm`}>{item.foodType}</Text>
            </View>
          </View>

          <View style={tw`flex-row items-center justify-between mt-3`}>
            {distanceText ? (
              <View style={tw`flex-row items-center`}>
                <MapPin size={14} color="#6B7280" />
                <Text style={tw`text-gray-500 text-sm ml-1`}>{distanceText}</Text>
              </View>
            ) : (
              <View />
            )}
            <View style={tw`flex-row items-center`}>
              <Clock size={14} color={timeRemaining.urgent ? '#EF4444' : '#6B7280'} />
              <Text
                style={[
                  tw`text-sm ml-1`,
                  timeRemaining.urgent ? tw`text-red-500 font-semibold` : tw`text-gray-500`,
                ]}
              >
                {timeRemaining.text}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSkeletons = () => (
    <View style={tw`px-6 pt-4`}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={tw`bg-white rounded-2xl border border-gray-100 mb-4 overflow-hidden`}>
          <Skeleton style={tw`h-44 w-full`} />
          <View style={tw`p-4`}>
            <Skeleton style={tw`h-5 w-3/4 mb-2`} />
            <Skeleton style={tw`h-4 w-1/2 mb-3`} />
            <Skeleton style={tw`h-8 w-32 mb-2`} />
            <Skeleton style={tw`h-4 w-24`} />
          </View>
        </View>
      ))}
    </View>
  );

  const renderEmptyState = () => {
    if (loading) return null;

    if (!userLocation && locationDenied) {
      return (
        <EmptyState
          title="Enable location to see nearby donations"
          subtitle="Turn on location services or enter your area to find food listings near you."
          icon={Crosshair}
          actionLabel="Enable Location"
          onAction={requestLocation}
        />
      );
    }

    if (debouncedSearch || selectedFoodTypes.length > 0 || radiusKm) {
      return (
        <EmptyState
          title="No results match your filters"
          subtitle="Try adjusting your search, filters, or radius to find more listings."
          icon={Search}
          actionLabel="Clear Filters"
          onAction={clearFilters}
        />
      );
    }

    return (
      <EmptyState
        title="No food available nearby right now"
        subtitle="Check back soon — new listings are added regularly."
        icon={PackageOpen}
      />
    );
  };

  const renderMapView = () => {
    if (Platform.OS === 'web') {
      return (
        <View style={tw`flex-1 items-center justify-center p-6`}>
          <MapPin size={48} color="#9CA3AF" />
          <Text style={tw`text-lg font-semibold text-gray-700 mt-4 text-center`}>
            Map view is available on mobile devices
          </Text>
          <Text style={tw`text-gray-500 text-center mt-2`}>
            Switch to list view or open on your phone to see the map.
          </Text>
        </View>
      );
    }

    if (filteredListings.length === 0) {
      return renderEmptyState();
    }

    return (
      <View style={tw`flex-1`}>
        <View style={tw`flex-row items-center p-4 border-b border-gray-100`}>
          <MapPin size={16} color="#3B6D11" />
          <Text style={tw`text-sm text-gray-600 ml-2`}>
            {filteredListings.length} listing{filteredListings.length !== 1 ? 's' : ''} on map
          </Text>
        </View>
        <ScrollView style={tw`flex-1`}>
          {filteredListings.map((item) => {
            const timeRemaining = getTimeRemaining(item.safeUntil);
            const distanceText = userLocation ? getDistanceText(item.distance) : null;
            return (
              <TouchableOpacity
                key={item.id}
                style={tw`flex-row bg-white mx-4 mb-3 rounded-2xl border border-gray-100 overflow-hidden`}
                activeOpacity={0.7}
                onPress={() => (router as any).push(`/(receiver)/listing/${item.id}`)}
              >
                <View style={tw`w-24 h-24 bg-primary-50 items-center justify-center`}>
                  <PackageOpen size={32} color="#97C459" />
                </View>
                <View style={tw`flex-1 p-3 justify-center`}>
                  <Text style={tw`font-bold text-gray-900`} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={tw`text-sm text-gray-500 mt-1`}>
                    {item.quantity} {item.unit} &middot; {item.foodType}
                  </Text>
                  <View style={tw`flex-row items-center mt-1`}>
                    {distanceText && (
                      <View style={tw`flex-row items-center mr-3`}>
                        <MapPin size={12} color="#6B7280" />
                        <Text style={tw`text-xs text-gray-500 ml-1`}>{distanceText}</Text>
                      </View>
                    )}
                    <Clock
                      size={12}
                      color={timeRemaining.urgent ? '#EF4444' : '#6B7280'}
                    />
                    <Text
                      style={[
                        tw`text-xs ml-1`,
                        timeRemaining.urgent ? tw`text-red-500 font-semibold` : tw`text-gray-500`,
                      ]}
                    >
                      {timeRemaining.text}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderFilterModal = () => (
    <Modal visible={showFilters} animationType="slide" transparent>
      <View style={tw`flex-1 bg-black/50`}>
        <View style={tw`mt-auto bg-white rounded-t-3xl p-6 max-h-[70%]`}>
          <View style={tw`flex-row items-center justify-between mb-6`}>
            <Text style={tw`text-xl font-bold text-gray-900`}>Filters</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView>
            <Text style={tw`text-base font-semibold text-gray-800 mb-3`}>Food Type</Text>
            <View style={tw`flex-row flex-wrap`}>
              {FOOD_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    tw`rounded-full px-4 py-2 mr-2 mb-2 border`,
                    selectedFoodTypes.includes(type)
                      ? tw`bg-primary-600 border-primary-600`
                      : tw`bg-white border-gray-200`,
                  ]}
                  onPress={() => toggleFoodType(type)}
                >
                  <Text
                    style={[
                      tw`text-sm font-medium`,
                      selectedFoodTypes.includes(type) ? tw`text-white` : tw`text-gray-700`,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={tw`text-base font-semibold text-gray-800 mb-3 mt-6`}>
              Radius
              {radiusKm ? ` (${radiusKm} km)` : ''}
            </Text>
            <View style={tw`flex-row flex-wrap`}>
              {RADIUS_OPTIONS.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[
                    tw`rounded-full px-5 py-2 mr-2 mb-2 border`,
                    radiusKm === r
                      ? tw`bg-primary-600 border-primary-600`
                      : tw`bg-white border-gray-200`,
                  ]}
                  onPress={() => setRadiusKm(radiusKm === r ? null : r)}
                >
                  <Text
                    style={[
                      tw`text-sm font-medium`,
                      radiusKm === r ? tw`text-white` : tw`text-gray-700`,
                    ]}
                  >
                    {r} km
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {!userLocation && (
              <View style={tw`bg-amber-50 rounded-xl p-4 mt-4`}>
                <Text style={tw`text-amber-800 text-sm`}>
                  Enable location to use radius filtering. Listings will not be sorted by distance.
                </Text>
              </View>
            )}
          </ScrollView>

          <View style={tw`flex-row pt-4 border-t border-gray-100 mt-4`}>
            <Button variant="ghost" style={tw`flex-1 mr-2`} onPress={clearFilters}>
              Clear All
            </Button>
            <Button variant="primary" style={tw`flex-1 ml-2`} onPress={applyFiltersAndClose}>
              Apply Filters
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={tw`flex-1 bg-gray-50`}>
      {/* Header */}
      <View style={tw`bg-white pt-12 pb-4 px-4 border-b border-gray-100`}>
        <Text style={tw`text-2xl font-bold text-primary-600 mb-1`}>Discover</Text>
        <Text style={tw`text-gray-500 text-sm`}>
          Find surplus food near you
        </Text>
      </View>

      {/* Search + Filter bar */}
      <View style={tw`bg-white px-4 py-3 border-b border-gray-100`}>
        <View style={tw`flex-row items-center`}>
          <View style={tw`flex-1 flex-row items-center bg-gray-50 rounded-xl px-3 h-10`}>
            <Search size={18} color="#9CA3AF" />
            <TextInput
              style={tw`flex-1 ml-2 text-base text-gray-900`}
              placeholder="Search by food type or keyword..."
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
            style={tw`ml-2 h-10 w-10 items-center justify-center rounded-xl bg-gray-50`}
            onPress={() => setShowFilters(true)}
          >
            <SlidersHorizontal size={18} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity
            style={tw`ml-2 h-10 w-10 items-center justify-center rounded-xl ${
              viewMode === 'map' ? 'bg-primary-100' : 'bg-gray-50'
            }`}
            onPress={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
          >
            {viewMode === 'list' ? (
              <MapPin size={18} color="#374151" />
            ) : (
              <List size={18} color="#374151" />
            )}
          </TouchableOpacity>
        </View>

        {/* Location info */}
        {locationDenied && !userLocation && (
          <TouchableOpacity
            style={tw`flex-row items-center mt-2 bg-amber-50 rounded-lg px-3 py-2`}
            onPress={requestLocation}
          >
            <MapPin size={14} color="#D97706" />
            <Text style={tw`text-amber-700 text-xs ml-2 flex-1`}>
              Location off — distance sorting unavailable. Tap to enable.
            </Text>
          </TouchableOpacity>
        )}
        {(userLocation || locationDenied) && (
          <View style={tw`flex-row items-center mt-2`}>
            <MapPin size={14} color="#3B6D11" />
            <Text style={tw`text-gray-500 text-xs ml-1`}>
              {locationDenied ? 'Location off' : locationName ? `Near ${locationName}` : 'Fetching location...'}
              {radiusKm && !locationDenied ? ` · ${radiusKm} km radius` : ''}
            </Text>
          </View>
        )}
      </View>

      {/* Content */}
      {loading ? (
        renderSkeletons()
      ) : error && listings.length === 0 ? (
        <ErrorState message={error} onRetry={() => fetchListings(1)} />
      ) : viewMode === 'map' ? (
        renderMapView()
      ) : filteredListings.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={filteredListings}
          renderItem={renderListingCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={tw`px-6 pt-4 pb-8`}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#3B6D11" />
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={tw`py-4 items-center`}>
                <Text style={tw`text-gray-400 text-sm`}>Loading more...</Text>
              </View>
            ) : null
          }
        />
      )}

      {renderFilterModal()}
    </View>
  );
}
