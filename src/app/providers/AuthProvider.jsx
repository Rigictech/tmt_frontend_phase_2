import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../../shared/api/httpClient";
import { setAccessToken, clearAccessToken } from "../../shared/auth/tokenStore";

const AuthContext = createContext(null);

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}

export default function AuthProvider({ queryClient, children }) {
    const [me, setMe] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);

    // Boot: try load current user (works if access token exists OR refresh auto-works)
    useEffect(() => {
        let mounted = true;

        async function boot() {
            setAuthLoading(true);
            try {
                const res = await api.get("/auth/me");
                if (!mounted) return;
                setMe(res?.data?.user ?? res?.data ?? null);
            } catch {
                if (!mounted) return;
                setMe(null);
            } finally {
                if (mounted) setAuthLoading(false);
            }
        }

        boot();
        return () => {
            mounted = false;
        };
    }, []);

    const login = async ({ email, password }) => {
        debugger
        const res = await api.post("/auth/login", { email, password });
        const token = res?.data?.accessToken;
        const user = res?.data?.user ?? null;

        if (token) setAccessToken(token);
        setMe(user);
        // Optional: reset cache after login
        queryClient?.invalidateQueries();
        return res.data;
    };

    const logout = async () => {
        try {
            await api.post("/auth/logout");
        } catch {
            // even if server fails, we still clear locally
        } finally {
            clearAccessToken();
            setMe(null);
            queryClient?.clear();
        }
    };

    const value = useMemo(
        () => ({
            me,
            isAuthed: !!me,
            authLoading,
            login,
            logout,
            setMe,
        }),
        [me, authLoading]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}