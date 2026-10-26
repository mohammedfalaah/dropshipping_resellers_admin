import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Layout & Route Protection
import AdminRouteGuard from "./AdminRouteGuard";
import AdminLayout from "./AdminLayout";

// Admin Pages
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import Resellers from "./pages/Resellers";
import ResellerApplications from "./pages/ResellerApplications";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import Orders from "./pages/Orders";
import CodPending from "./pages/CodPending";
import Payments from "./pages/Payments";
import ResellerBalances from "./pages/ResellerBalances";
import BalanceSheet from "./pages/BalanceSheet";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <div className="admin-root-container">
      <Routes>
        {/* Login Routes */}
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Protected Admin Console Routes (Supports root and /admin paths) */}
        <Route
          path="/"
          element={
            <AdminRouteGuard>
              <AdminLayout />
            </AdminRouteGuard>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="resellers" element={<Resellers />} />
          <Route path="applications" element={<ResellerApplications />} />
          <Route path="products" element={<Products />} />
          <Route path="categories" element={<Categories />} />
          <Route path="orders" element={<Orders />} />
          <Route path="cod-pending" element={<CodPending />} />
          <Route path="payments" element={<Payments />} />
          <Route path="balances" element={<ResellerBalances />} />
          <Route path="balance-sheet" element={<BalanceSheet />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Backwards compatibility for /admin/* paths */}
        <Route
          path="/admin"
          element={
            <AdminRouteGuard>
              <AdminLayout />
            </AdminRouteGuard>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="resellers" element={<Resellers />} />
          <Route path="applications" element={<ResellerApplications />} />
          <Route path="products" element={<Products />} />
          <Route path="categories" element={<Categories />} />
          <Route path="orders" element={<Orders />} />
          <Route path="cod-pending" element={<CodPending />} />
          <Route path="payments" element={<Payments />} />
          <Route path="balances" element={<ResellerBalances />} />
          <Route path="balance-sheet" element={<BalanceSheet />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Fallback to Dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
}
