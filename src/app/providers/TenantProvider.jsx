import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { resolveTenant } from "../../shared/tenancy/tenantResolver";
import { getStoredTenant, setStoredTenant } from "../../shared/auth/session";
import { setTenantGetter } from "../../shared/api/httpClient";

const TenantContext = createContext(null);

export function useTenant() {
    const ctx = useContext(TenantContext);
    if (!ctx) throw new Error("useTenant must be used inside TenantProvider");
    return ctx;
}

export default function TenantProvider({ queryClient, children }) {
    const [tenant, setTenant] = useState(() => {
        const resolved = resolveTenant({ hostname: window.location.hostname, pathname: window.location.pathname });
        return resolved || getStoredTenant() || null;
    });

    // Persist + isolate cache on tenant change
    useEffect(() => {
        setStoredTenant(tenant);

        // VERY IMPORTANT: isolate server cache between tenants
        // Clear queries & mutations so we never leak tenant data
        if (queryClient) {
            queryClient.clear();
        }
    }, [tenant, queryClient]);

    // Wire axios tenant getter (so httpClient can read current tenant)
    useEffect(() => {
        setTenantGetter(() => tenant);
    }, [tenant]);

    const value = useMemo(
        () => ({
            tenant,
            setTenant,
            hasTenant: !!tenant,
        }),
        [tenant]
    );

    return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}