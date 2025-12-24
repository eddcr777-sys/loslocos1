import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './MainLayout'; // Usando el layout responsivo con Outlet
import HomePage from './pages/HomePage/HomePage';
import AboutPage from './pages/AboutPage/AboutPage';
import ProfilePage from './pages/ProfilePage/ProfilePage';
import SearchPage from './pages/SearchPage/SearchPage';
import NotificationsPage from './pages/NotificationsPage/NotificationsPage';
import TrendsPage from './components/TrendsPage/TrendsPage';
import PostDetailPage from './pages/NotificationsPage/PostDetailPage';
import LoginPage from './pages/AuthPage/LoginPage';
import RegisterPage from './pages/AuthPage/RegisterPage';
import SettingsPage from './components/settingsComponents/SettingsPage';
import WelcomePage from './pages/AuthPage/WelcomePage';
import { FeedProvider } from './context/FeedContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import './styles/App.css';
import AdminPage from './components/auth/AdminPage';
import AdminRoute from './components/auth/AdminRoute';
import VerificationHub from './pages/Admin/VerificationHub';
import CEODashboard from './pages/Admin/CEODashboard';
import InstitutionalDashboard from './pages/Admin/InstitutionalDashboard';


const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

/**
 * Si el usuario ya está autenticado, lo redirige a /home
 * para evitar que vea las páginas de bienvenida, login o registro.
 */
const RedirectIfAuthenticated = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (user) {
    return <Navigate to="/home" replace />;
  }
  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    {/* Rutas públicas (se redirigen si el usuario está logueado) */}
    <Route path="/" element={<RedirectIfAuthenticated><WelcomePage /></RedirectIfAuthenticated>} />
    <Route path="/login" element={<RedirectIfAuthenticated><LoginPage /></RedirectIfAuthenticated>} />
    <Route path="/register" element={<RedirectIfAuthenticated><RegisterPage /></RedirectIfAuthenticated>} />
    <Route path="/about" element={<AboutPage />} />

    {/* Rutas protegidas que usan el MainLayout responsivo */}
    <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
      <Route path="/home" element={<HomePage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/profile/:userId" element={<ProfilePage />} />
      <Route path="/settings/*" element={<SettingsPage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/notifications" element={<NotificationsPage />} />
      <Route path="/post/:postId" element={<PostDetailPage />} />
      <Route path="/trends" element={<TrendsPage />} />
      
      {/* Centro de Verificación */}
      <Route path="/verify-admin" element={<VerificationHub />} />
    </Route>

    {/* Panel de Administración */}
    <Route path="/admin" element={<AdminRoute type="admin"><MainLayout /></AdminRoute>}>
      <Route index element={<CEODashboard />} />
    </Route>

    {/* Rutas Institucionales */}
    <Route path="/institutional" element={<AdminRoute type="inst"><MainLayout /></AdminRoute>}>
      <Route index element={<InstitutionalDashboard />} />
    </Route>
  </Routes>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <FeedProvider>
          <AppRoutes />
        </FeedProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
