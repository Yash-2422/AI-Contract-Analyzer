import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "@/features/auth/login-page";
import { RegisterPage } from "@/features/auth/register-page";
import { DashboardPage } from "@/pages/dashboard-page";
import { ContractsPage } from "@/pages/contracts-page";
import { ContractDetailPage } from "@/pages/contract-detail-page";
import { ComparePage } from "@/pages/compare-page";
import { SearchPage } from "@/pages/search-page";
import { ProtectedRoute } from "@/components/layout/protected-route";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/contracts"
          element={
            <ProtectedRoute>
              <ContractsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/contracts/:contractId"
          element={
            <ProtectedRoute>
              <ContractDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/compare"
          element={
            <ProtectedRoute>
              <ComparePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/search"
          element={
            <ProtectedRoute>
              <SearchPage />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}