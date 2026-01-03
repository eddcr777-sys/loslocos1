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
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isDesktop = useMediaQuery('(min-width: 1100px)');
  const location = useLocation();

  const isSpecialPage = location.pathname.startsWith('/admin') || 
                        location.pathname.startsWith('/institutional') ||
                        location.pathname.startsWith('/settings');
  
  const showAside = !isMobile && !isSpecialPage;
  const showTrends = isDesktop && !isSpecialPage;

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