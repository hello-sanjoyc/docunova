"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { API_QUERY_DEFAULTS } from "@/lib/query/apiQuery";

export default function QueryProvider({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: API_QUERY_DEFAULTS.staleTime,
                        gcTime: API_QUERY_DEFAULTS.gcTime,
                        retry: API_QUERY_DEFAULTS.retry,
                        refetchOnWindowFocus: true,
                        refetchOnReconnect: true,
                    },
                },
            }),
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
