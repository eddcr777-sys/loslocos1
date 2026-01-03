import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './MainLayout';
import { FeedProvider } from './context/FeedContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminRoute from './components/auth/AdminRoute';
import ThemeColorSync from './components/layout/ThemeColorSync';
import './styles/App.css';

// Lazy loading pages for performance
const HomePage = lazy(() => import('./pages/HomePage/HomePage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage/ProfilePage'));
const SearchPage = lazy(() => import('./pages/SearchPage/SearchPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage/NotificationsPage'));
const TrendsPage = lazy(() => import('./components/TrendsPage/TrendsPage'));
const EventsPage = lazy(() => import('./pages/EventsPage/EventsPage'));
const PostDetailPage = lazy(() => import('./pages/NotificationsPage/PostDetailPage'));
const LoginPage = lazy(() => import('./pages/AuthPage/LoginPage'));
const RegisterPage = lazy(() => import('./pages/AuthPage/RegisterPage'));
const SettingsPage = lazy(() => import('./components/settingsComponents/SettingsPage'));
const WelcomePage = lazy(() => import('./pages/AuthPage/WelcomePage'));
// VerificationHub removed
const CEODashboard = lazy(() => import('./pages/Admin/CEODashboard'));
const InstitutionalDashboard = lazy(() => import('./pages/Admin/InstitutionalDashboard'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage/NotFoundPage'));
const PrivacyPolicy = lazy(() => import('./pages/legal/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/legal/TermsOfService'));
const CommunityGuidelines = lazy(() => import('./pages/legal/CommunityGuidelines'));
const FollowersPage = lazy(() => import('./pages/ProfileLists/FollowersPage'));
const FollowingPage = lazy(() => import('./pages/ProfileLists/FollowingPage'));


// Loading component
const PageLoader = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh',
    background: 'var(--bg-color)',
    flexDirection: 'column',
    gap: '1rem'
  }}>
    {/* Skeleton Loader Effect */}
    <div style={{ width: '100%', maxWidth: '500px', padding: '20px' }}>
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
        <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--border-color)', animation: 'pulse 1.5s infinite' }}></div>
        <div style={{ flex: 1 }}>
          <div style={{ width: '60%', height: '15px', background: 'var(--border-color)', borderRadius: '4px', marginBottom: '10px', animation: 'pulse 1.5s infinite' }}></div>
          <div style={{ width: '40%', height: '15px', background: 'var(--border-color)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }}></div>
        </div>
      </div>
      <div style={{ width: '100%', height: '200px', background: 'var(--surface-hover)', borderRadius: 'var(--radius-lg)', animation: 'pulse 1.5s infinite' }}></div>
    </div>
    <style>{`
      @keyframes pulse {
        0% { opacity: 0.4; }
        50% { opacity: 0.8; }
        100% { opacity: 0.4; }
      }
    `}</style>
  </div>
);


// Theme initializer to handle persistence
const ThemeInitializer = () => {
  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, []);
  return null;
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const RedirectIfAuthenticated = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (user) {
    return <Navigate to="/home" replace />;
  }
  return <>{children}</>;
};

const AppRoutes = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      {/* Rutas públicas */}
      <Route path="/" element={<RedirectIfAuthenticated><WelcomePage /></RedirectIfAuthenticated>} />
      <Route path="/login" element={<RedirectIfAuthenticated><LoginPage /></RedirectIfAuthenticated>} />
      <Route path="/register" element={<RedirectIfAuthenticated><RegisterPage /></RedirectIfAuthenticated>} />

      {/* Rutas Legales */}
      <Route path="/legal/privacy" element={<PrivacyPolicy />} />
      <Route path="/legal/terms" element={<TermsOfService />} />
      <Route path="/legal/guidelines" element={<CommunityGuidelines />} />

      {/* Rutas protegidas */}
      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route path="/home" element={<HomePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/:userId" element={<ProfilePage />} />
        <Route path="/profile/:userId/followers" element={<FollowersPage />} />
        <Route path="/profile/:userId/following" element={<FollowingPage />} />

        {/* Settings tiene sub-rutas, así que usamos asterisco */}
        <Route path="/settings/*" element={<SettingsPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/post/:postId" element={<PostDetailPage />} />
        <Route path="/trends" element={<TrendsPage />} />
        <Route path="/events" element={<EventsPage />} />
        {/* Verification route removed */}
      </Route>

      {/* Panel de Administración */}
      <Route path="/admin" element={<AdminRoute type="admin"><MainLayout /></AdminRoute>}>
        <Route index element={<CEODashboard />} />
      </Route>

      {/* Rutas Institucionales */}
      <Route path="/institutional" element={<AdminRoute type="inst"><MainLayout /></AdminRoute>}>
        <Route index element={<InstitutionalDashboard />} />
      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </Suspense>
);

function App() {
  return (
    <Router>
      <ThemeInitializer />
      <ThemeColorSync />
      <AuthProvider>
        <FeedProvider>
          <AppRoutes />
        </FeedProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
