import axios from "axios";
import { getAccessToken, setAccessToken, clearAccessToken } from "../auth/tokenStore";
import { buildTenantHeaders } from "../tenancy/tenantHeaders";

// We inject tenant dynamically (from TenantProvider) using setTenantGetter
let tenantGetter = () => null;
export const setTenantGetter = (fn) => {
    tenantGetter = typeof fn === "function" ? fn : () => null;
};

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    withCredentials: true, // IMPORTANT: sends refresh cookie
    timeout: 30_000,
});

// Prevent multiple refresh calls at the same time
let isRefreshing = false;
let queue = [];

function processQueue(error, token = null) {
    queue.forEach(({ resolve, reject }) => {
        if (error) reject(error);
        else resolve(token);
    });
    queue = [];
}

api.interceptors.request.use((config) => {
    const token = getAccessToken();
    const tenant = tenantGetter?.();

    config.headers = {
        ...config.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...buildTenantHeaders(tenant),
    };

    return config;
});

api.interceptors.response.use(
    (res) => res,
    async (error) => {
        const original = error?.config;

        // If no config or not 401, throw
        if (!original || error?.response?.status !== 401) {
            return Promise.reject(error);
        }

        // Avoid infinite loop
        if (original._retry) return Promise.reject(error);
        original._retry = true;

        // If already refreshing, queue this request
        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                queue.push({
                    resolve: (token) => {
                        original.headers.Authorization = `Bearer ${token}`;
                        resolve(api(original));
                    },
                    reject,
                });
            });
        }

        isRefreshing = true;

        try {
            // Call refresh endpoint (cookie will be sent)
            const refreshRes = await api.post("/auth/refresh");
            const newToken = refreshRes?.data?.accessToken;

            if (!newToken) {
                clearAccessToken();
                throw new Error("Refresh did not return accessToken");
            }

            setAccessToken(newToken);
            processQueue(null, newToken);

            original.headers.Authorization = `Bearer ${newToken}`;
            return api(original);
        } catch (e) {
            processQueue(e, null);
            clearAccessToken();
            return Promise.reject(e);
        } finally {
            isRefreshing = false;
        }
    }
);

export default api;