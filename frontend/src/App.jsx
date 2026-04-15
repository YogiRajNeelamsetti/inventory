import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Purchases from './pages/Purchases';
import Billing from './pages/Billing';
import Inventory from './pages/Inventory';
import Transactions from './pages/Transactions';
import AuthPage from './pages/AuthPage';
import './index.css';
import Analytics from "./pages/Analytics";
import { LoadingState } from './components/FeedbackState';
import { ThemeProvider } from './context/ThemeContext';
import { Analytics as VercelAnalytics } from '@vercel/analytics/react';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useApp();

  if (loading) {
    return <LoadingState message="Checking session..." fullHeight />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<AuthPage initialView="login" />} />
            <Route path="/register" element={<AuthPage initialView="register" />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="purchases" element={<Purchases />} />
              <Route path="billing" element={<Billing />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="transactions" element={<Transactions />} />
              <Route path="analytics" element={<Analytics />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <VercelAnalytics />
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;
