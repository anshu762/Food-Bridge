import { api } from './api';

export const impactService = {
  getMyImpact: async () => {
    const { data } = await api.get('/impact/me');
    return data.data; // { mealsSaved, donationsCompleted, ... }
  },
  
  getPlatformImpact: async () => {
    const { data } = await api.get('/impact/platform');
    return data.data;
  }
};
