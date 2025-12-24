import React from 'react';
import { Bell } from 'lucide-react';
import { useFeed } from '../../context/FeedContext';
import './FeedFilters.css';

const FeedFilters: React.FC = () => {
  const { activeTab, setActiveTab } = useFeed();

  return (
    <div className="feed-filters-container">
      <div 
        className={`filter-item ${activeTab === 'para-ti' ? 'active' : ''}`}
        onClick={() => setActiveTab('para-ti')}
      >
        <span>Para ti</span>
        {activeTab === 'para-ti' && <div className="active-indicator" />}
      </div>
      <div 
        className={`filter-item ${activeTab === 'siguiendo' ? 'active' : ''}`}
        onClick={() => setActiveTab('siguiendo')}
      >
        <span>Siguiendo</span>
        {activeTab === 'siguiendo' && <div className="active-indicator" />}
      </div>
      <div 
        className={`filter-item avisos-tab ${activeTab === 'avisos' ? 'active' : ''}`}
        onClick={() => setActiveTab('avisos')}
      >
        <div className="avisos-content">
          <Bell size={16} />
          <span>Avisos</span>
        </div>
        {activeTab === 'avisos' && <div className="active-indicator" />}
      </div>
    </div>
  );
};

export default FeedFilters;
