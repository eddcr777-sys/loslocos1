import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import HomePage from './pages/HomePage/HomePage';
import AboutPage from './pages/AboutPage/AboutPage';
import ProfilePage from './pages/ProfilePage/ProfilePage';
import SearchPage from './pages/SearchPage/SearchPage';
import NotificationsPage from './pages/NotificationsPage/NotificationsPage';
import LoginPage from './pages/ProfilePage/LoginPage';
import RegisterPage from './pages/ProfilePage/RegisterPage';
import WelcomePage from './pages/ProfilePage/WelcomePage';
import { FeedProvider } from './context/FeedContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import './styles/App.css';
import ProtectedRoute from './pages/ProfilePage/ProtectedRoute';
import RedirectIfAuthenticated from './components/auth/RedirectIfAuthenticated';

// Componente interno que usa el contexto de autenticación
const AppContent = () => {
  const { user } = useAuth();


  

  return (
    <MainLayout>
      <Routes>
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<RedirectIfAuthenticated><WelcomePage /></RedirectIfAuthenticated>} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
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
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/:userId"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </MainLayout>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <FeedProvider>
          <AppContent />
        </FeedProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
