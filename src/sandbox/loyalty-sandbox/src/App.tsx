import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { I18nProvider } from './i18n/I18nContext';
import { LandingPage } from './pages/landing/LandingPage';
import { LoginPage } from './pages/login/LoginPage';
import { SandboxLayout } from './layouts/SandboxLayout';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { DocViewerPage } from './pages/docs/DocViewerPage';
import { SimulatorPage } from './pages/simulator/SimulatorPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = localStorage.getItem('smart_otp_sandbox_user');
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export function App() {
  return (
    <I18nProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Solution Landing Page */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Developer Login */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Developer Sandbox Portal & Simulator */}
          <Route
            element={
              <ProtectedRoute>
                <SandboxLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/docs/:id" element={<DocViewerPage />} />
            <Route path="/simulator" element={<SimulatorPage />} />
            <Route path="/portal" element={<Navigate to="/dashboard" replace />} />
          </Route>

          {/* Fallback to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </I18nProvider>
  );
}

export default App;
