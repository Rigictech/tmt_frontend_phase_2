export function buildTenantHeaders(tenant) {
    return tenant ? { "X-Tenant": tenant } : {};
}