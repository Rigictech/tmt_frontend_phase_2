import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function createQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                retry: 1,
                refetchOnWindowFocus: false,
                staleTime: 30_000,
            },
            mutations: { retry: 0 },
        },
    });
}

export default function QueryProvider({ client, children }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}