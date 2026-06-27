import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

export const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? false);
      setIsInternetReachable(state.isInternetReachable ?? null);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Consider online if we are connected and (internet is reachable OR we don't know yet)
  const isOnline = isConnected && isInternetReachable !== false;

  return { isOnline, isConnected, isInternetReachable };
};
