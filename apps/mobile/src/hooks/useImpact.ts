import { useQuery } from '@tanstack/react-query';
import { impactService } from '../services/impact';

export const useMyImpact = () => {
  return useQuery({
    queryKey: ['impact', 'me'],
    queryFn: () => impactService.getMyImpact(),
  });
};
