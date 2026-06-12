import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import ChatLayout from './components/ChatLayout';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './index.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Redirect to chat if already logged in
const PublicRoute = ({ children }) => {
  const { currentUser } = useAuth();
  if (currentUser) {
    return <Navigate to="/chat" replace />;
  }
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          
          <Route path="/chat" element={
            <ProtectedRoute>
              <ChatLayout />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
