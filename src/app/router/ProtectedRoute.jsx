import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";

export default function ProtectedRoute() {
    const { isAuthed, authLoading } = useAuth();

    if (authLoading) return null; // replace with loader component
    if (!isAuthed) return <Navigate to="/login" replace />;
    return <Outlet />;
}