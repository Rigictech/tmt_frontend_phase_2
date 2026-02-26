export function resolveTenant({ hostname, pathname }) {
    // Option A (preferred): subdomain => tenant1.app.com
    const parts = hostname.split(".");
    if (parts.length >= 3) {
        const sub = parts[0];
        if (sub && sub !== "www") return sub;
    }

    // Option B: path-based => /t/tenant1/...
    const match = pathname.match(/^\/t\/([^/]+)/i);
    if (match?.[1]) return match[1];

    return null;
}