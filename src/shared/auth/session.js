const TENANT_KEY = "tmt_tenant";

export const getStoredTenant = () => localStorage.getItem(TENANT_KEY);
export const setStoredTenant = (t) => {
    if (!t) localStorage.removeItem(TENANT_KEY);
    else localStorage.setItem(TENANT_KEY, t);
};