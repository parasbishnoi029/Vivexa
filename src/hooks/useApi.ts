import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import api from '../lib/api';

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface SearchParams extends PaginationParams {
  q?: string;
  filters?: Record<string, any>;
}

// Generic Fetch hook
export function useFetchData<TData = any, TError = Error>(
  queryKey: unknown[],
  url: string,
  params?: SearchParams,
  options?: UseQueryOptions<TData, TError>
) {
  return useQuery<TData, TError>({
    queryKey: [...queryKey, params],
    queryFn: async () => {
      const response = await api.get(url, { params });
      return response.data;
    },
    ...options,
  });
}

// Generic Mutation hook
export function useMutateData<TData = any, TVariables = any, TError = Error>(
  url: string,
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'POST',
  options?: UseMutationOptions<TData, TError, TVariables>
) {
  const queryClient = useQueryClient();
  
  return useMutation<TData, TError, TVariables>({
    mutationFn: async (variables) => {
      const response = await api.request({
        url,
        method,
        data: variables,
      });
      return response.data;
    },
    ...options,
  });
}
