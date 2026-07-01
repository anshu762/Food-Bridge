import React, { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider, useToast } from '../components/ui/Toast';

// Setup React Query client with sane defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: unknown) => {
        const err = error as { response?: { status?: number } };
        // No retry for 4xx errors
        if (err?.response?.status && err.response.status >= 400 && err.response.status < 500) {
          return false;
        }
        // Retry network errors up to 2 times
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
  },
});

// A wrapper to inject toast into the global query cache error handler
const QueryWrapper = ({ children }: { children: ReactNode }) => {
  const { showToast } = useToast();

  // Set global query error handler
  queryClient.getQueryCache().config.onError = (error: unknown) => {
    const err = error as { response?: { data?: { error?: string } }; message?: string };
    console.error('Global Query Error:', err);
    showToast({
      message: err?.response?.data?.error || err.message || 'An unexpected error occurred.',
      type: 'error',
    });
  };

  return <>{children}</>;
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  return (
    <ToastProvider>
      <QueryClientProvider client={queryClient}>
        <QueryWrapper>{children}</QueryWrapper>
      </QueryClientProvider>
    </ToastProvider>
  );
};
