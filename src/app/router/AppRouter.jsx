import React, { lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

// Lazy pages (replace with your actual pages)
const LoginPage = lazy(() => import("@/features/auth/pages/LoginPage.jsx"));
const DashboardPage = lazy(() => import("@/features/dashboard/pages/DashboardPage.jsx"));

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public */}
                <Route path="/login" element={<LoginPage />} />

                {/* Protected */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/" element={<DashboardPage />} />
                </Route>

                {/* Optional: fallback */}
                <Route path="*" element={<div>404</div>} />
            </Routes>
        </BrowserRouter>
    );
}