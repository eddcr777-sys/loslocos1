import React from 'react';
import { Outlet } from 'react-router-dom';
import Aside from './Aside';
import MobileHeader from './MobileHeader';
import useMediaQuery from './useMediaQuery';
import TrendsAside from './components/layout/TrendsAside';
import './MainLayout.css';

const MainLayout = () => {
  const isMobile = useMediaQuery('(max-width: 1024px)'); // Breakpoint for 3-column layout

  return (
    <div className="app-container">
      {isMobile ? <MobileHeader /> : <Aside />}

      <main className="main-content">
        <Outlet />
      </main>

      {!isMobile && <TrendsAside />}
    </div>
  );
};

export default MainLayout;