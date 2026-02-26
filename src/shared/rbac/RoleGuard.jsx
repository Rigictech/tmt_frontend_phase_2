import React from "react";

export default function RoleGuard({ allow = [], role, children, fallback = null }) {
    if (!allow.length) return children;
    if (!role) return fallback;
    return allow.includes(role) ? children : fallback;
}