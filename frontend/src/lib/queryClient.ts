import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 10, // 10 minutes cache for static metadata
    },
    mutations: {
      retry: false,
    },
  },
});
