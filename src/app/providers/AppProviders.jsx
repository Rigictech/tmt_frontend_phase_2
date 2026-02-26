import React, { useMemo } from "react";
import QueryProvider, { createQueryClient } from "./QueryProvider";
import TenantProvider from "./TenantProvider";
import AuthProvider from "./AuthProvider";
import I18nProvider from "./I18nProvider";

export default function AppProviders({ children }) {
    const queryClient = useMemo(() => createQueryClient(), []);

    return (
        <QueryProvider client={queryClient}>
            <TenantProvider queryClient={queryClient}>
                <AuthProvider queryClient={queryClient}>
                    <I18nProvider>{children}</I18nProvider>
                </AuthProvider>
            </TenantProvider>
        </QueryProvider>
    );
}