import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { listingsService, CreateListingData } from '../services/listings';

export const useMyListings = (params?: any) => {
  return useQuery({
    queryKey: ['my-listings', params],
    queryFn: () => listingsService.getMyListings(params),
  });
};

export const useInfiniteMyListings = (params?: any) => {
  return useInfiniteQuery({
    queryKey: ['my-listings-infinite', params],
    initialPageParam: 1,
    queryFn: ({ pageParam = 1 }) => listingsService.getMyListings({ ...params, page: pageParam, limit: 10 }),
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 10 ? allPages.length + 1 : undefined;
    },
  });
};

export const useListing = (id: string) => {
  return useQuery({
    queryKey: ['listing', id],
    queryFn: () => listingsService.getListing(id),
    enabled: !!id,
  });
};

export const useCreateListing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateListingData) => listingsService.createListing(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      queryClient.invalidateQueries({ queryKey: ['impact'] });
    },
  });
};

export const useCancelListing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => listingsService.cancelListing(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      queryClient.invalidateQueries({ queryKey: ['listing', id] });
    },
  });
};

export const useUploadSignature = () => {
  return useMutation({
    mutationFn: () => listingsService.getUploadSignature(),
  });
};
