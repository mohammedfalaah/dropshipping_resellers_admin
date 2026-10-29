import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

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
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        containerStyle={{ zIndex: 99999 }}
        toastOptions={{
          duration: 5000,
          style: {
            fontSize: "14px",
            fontWeight: "500",
            borderRadius: "10px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
          },
          error: {
            duration: 6000,
            style: {
              background: "#FEF2F2",
              color: "#991B1B",
              border: "1px solid #F87171",
            },
            iconTheme: {
              primary: "#EF4444",
              secondary: "#FFFFFF",
            },
          },
          success: {
            duration: 4000,
            style: {
              background: "#F0FDF4",
              color: "#166534",
              border: "1px solid #86EFAC",
            },
            iconTheme: {
              primary: "#10B981",
              secondary: "#FFFFFF",
            },
          },
        }}
      />
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
