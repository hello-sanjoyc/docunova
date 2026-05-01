import {
    useMutation,
    useQuery,
    type MutationFunction,
    type MutationKey,
    type QueryFunction,
    type QueryKey,
    type UseMutationOptions,
    type UseMutationResult,
    type UseQueryOptions,
    type UseQueryResult,
} from "@tanstack/react-query";

export const API_QUERY_DEFAULTS = {
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: 1,
} as const;

type BuildApiQueryOptionsParams<
    TQueryFnData,
    TError = Error,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
> = {
    queryKey: TQueryKey;
    queryFn: QueryFunction<TQueryFnData, TQueryKey>;
} & Omit<
    UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    "queryKey" | "queryFn"
>;

export function buildApiQueryOptions<
    TQueryFnData,
    TError = Error,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
>({
    queryKey,
    queryFn,
    staleTime = API_QUERY_DEFAULTS.staleTime,
    gcTime = API_QUERY_DEFAULTS.gcTime,
    retry = API_QUERY_DEFAULTS.retry,
    refetchOnWindowFocus = true,
    refetchOnReconnect = true,
    ...options
}: BuildApiQueryOptionsParams<TQueryFnData, TError, TData, TQueryKey>): UseQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey
> {
    return {
        queryKey,
        queryFn,
        staleTime,
        gcTime,
        retry,
        refetchOnWindowFocus,
        refetchOnReconnect,
        ...options,
    };
}

export function useApiQuery<
    TQueryFnData,
    TError = Error,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
>(
    params: BuildApiQueryOptionsParams<TQueryFnData, TError, TData, TQueryKey>,
): UseQueryResult<TData, TError> {
    return useQuery(buildApiQueryOptions(params));
}

type UseApiMutationParams<
    TData = unknown,
    TError = Error,
    TVariables = void,
    TContext = unknown,
> = {
    mutationKey?: MutationKey;
    mutationFn: MutationFunction<TData, TVariables>;
} & Omit<
    UseMutationOptions<TData, TError, TVariables, TContext>,
    "mutationFn" | "mutationKey"
>;

export function useApiMutation<
    TData = unknown,
    TError = Error,
    TVariables = void,
    TContext = unknown,
>({
    mutationKey,
    mutationFn,
    ...options
}: UseApiMutationParams<TData, TError, TVariables, TContext>): UseMutationResult<
    TData,
    TError,
    TVariables,
    TContext
> {
    return useMutation({
        mutationKey,
        mutationFn,
        ...options,
    });
}
