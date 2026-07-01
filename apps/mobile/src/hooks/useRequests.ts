import { useMutation, useQueryClient } from '@tanstack/react-query';
import { requestsService } from '../services/requests';
import * as Sentry from '@sentry/react-native';

export const useApproveRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => requestsService.approveRequest(requestId),
    onSuccess: (_, _requestId) => {
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      queryClient.invalidateQueries({ queryKey: ['listing'] });
    },
    onError: (error, requestId) => {
      Sentry.captureException(error, { extra: { action: 'approveRequest', requestId } });
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
    onError: (error, requestId) => {
      Sentry.captureException(error, { extra: { action: 'rejectRequest', requestId } });
    },
  });
};
