import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Aside from './Aside';
import MobileHeader from './MobileHeader';
import useMediaQuery from './useMediaQuery';
import TrendsAside from './components/layout/TrendsAside';
import { usePWAStatus } from './hooks/usePWAStatus';
import './MainLayout.css';

const MainLayout = () => {
  const { isStandalone } = usePWAStatus();
  const isMobile = useMediaQuery('(max-width: 1024px)'); // Breakpoint for 3-column layout
  const location = useLocation();

  // Hide Asides on admin, institutional and settings pages to give more space
  const isSpecialPage = location.pathname.startsWith('/admin') || 
                        location.pathname.startsWith('/institutional') ||
                        location.pathname.startsWith('/settings');
  
  const showAside = !isMobile && !isSpecialPage;
  const showTrends = !isMobile && !isSpecialPage;

  return (
    <div className={`app-container ${isSpecialPage ? 'full-width-mode' : ''}`}>
      {showAside ? <Aside /> : <MobileHeader />}

      <main className={`main-content ${!showTrends ? 'no-right-sidebar' : ''} ${!showAside ? 'no-left-sidebar' : ''} ${isStandalone ? 'standalone-mode' : ''}`}>
        <Outlet />
      </main>

      {showTrends && <TrendsAside />}
    </div>
  );
};

export default MainLayout;