import api from "@/shared/api/httpClient";

export const authApi = {
    login: (payload) => api.post("/session/login", payload).then((r) => r.data),
    logout: () => api.post("/session/logout").then((r) => r.data),
    me: () => api.get("/auth/me").then((r) => r.data),
};