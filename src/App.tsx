import React, { ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store';
import { Layout } from './components/Layout';
import { Auth } from './pages/Auth';
import { Onboarding } from './pages/Onboarding';
import { Home } from './pages/Home';
import { Matching } from './pages/Matching';
import { Chat } from './pages/Chat';
import { Settings } from './pages/Settings';
import { Donation } from './pages/Donation';

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useStore();
  
  if (!isAuthenticated) return <Navigate to="/auth" />;
  
  // If user is authenticated but hasn't completed onboarding
  if (user && (!user.username || !user.country)) {
    return <Navigate to="/onboarding" />;
  }

  return children;
};

// Onboarding Route Wrapper
const OnboardingRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useStore();
  if (!isAuthenticated) return <Navigate to="/auth" />;
  return children;
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        
        <Route path="/" element={<Layout />}>
          <Route path="onboarding" element={
            <OnboardingRoute>
              <Onboarding />
            </OnboardingRoute>
          } />
          
          <Route index element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />
          
          <Route path="matching" element={
            <ProtectedRoute>
              <Matching />
            </ProtectedRoute>
          } />
          
          <Route path="chat" element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          } />
          
          <Route path="settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />

          <Route path="donation" element={
            <ProtectedRoute>
              <Donation />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
    </Router>
  );
}
