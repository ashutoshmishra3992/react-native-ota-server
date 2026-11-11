import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { DashboardOverview } from './pages/DashboardOverview';
import { AppsListPage } from './pages/AppsListPage';
import { AppDetailsPage } from './pages/AppDetailsPage';
import { ReleasesListPage } from './pages/ReleasesListPage';
import { RestApiDocsPage } from './pages/RestApiDocsPage';
import { SdkGuidePage } from './pages/SdkGuidePage';
import { SimulatorPage } from './pages/SimulatorPage';

import { PublicDocsPage } from './pages/PublicDocsPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<LoginPage />} />
          <Route path="/docs" element={<PublicDocsPage />} />
          <Route path="/api-docs" element={<PublicDocsPage defaultTab="api" />} />
          <Route path="/sdk-docs" element={<PublicDocsPage defaultTab="sdk" />} />

          {/* Protected Dashboard Routes (Requires Authentication) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardOverview />} />
            <Route path="apps" element={<AppsListPage />} />
            <Route path="apps/:appId" element={<AppDetailsPage />} />
            <Route path="releases" element={<ReleasesListPage />} />
            <Route path="api-keys" element={<RestApiDocsPage />} />
            <Route path="sdk-guide" element={<SdkGuidePage />} />
            <Route path="simulator" element={<SimulatorPage />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
