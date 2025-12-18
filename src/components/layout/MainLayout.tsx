import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import TrendsWidget from '../widgets/TrendsWidget';
import '../../styles/Layout.css';
import { useAuth } from '../../context/AuthContext';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="main-layout">
      {/* Desktop Sidebar (hidden on mobile via CSS) */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="main-content">
        {children}
      </main>

      {/* Right Sidebar (Optional/Placeholder) */}
      <aside className="right-sidebar">
        <TrendsWidget />
      </aside>

      {/* Mobile Bottom Nav (hidden on desktop via CSS) */}
      <BottomNav />
    </div>
  );
};

export default MainLayout;
