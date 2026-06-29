import { useMutation, useQueryClient } from '@tanstack/react-query';
import { requestsService } from '../services/requests';

export const useApproveRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => requestsService.approveRequest(requestId),
    onSuccess: (_, requestId) => {
      // Invalidate the listing this request belongs to
      // Since we don't know the listingId here directly, we'll invalidate all listings
      // which is fine for now. But better to invalidate specifically if possible.
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      queryClient.invalidateQueries({ queryKey: ['listing'] }); 
    },
  });
};

export const useRejectRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => requestsService.rejectRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      queryClient.invalidateQueries({ queryKey: ['listing'] });
    },
  });
};
