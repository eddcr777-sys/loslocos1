import React from 'react';
import './AdminCommon.css';

interface Tab {
    id: string;
    label: string;
    icon?: React.ComponentType<{ size?: number | string }>;
}

interface DashboardTabsProps {
    tabs: Tab[];
    activeTab: string;
    onTabChange: (id: string) => void;
}

const DashboardTabs: React.FC<DashboardTabsProps> = ({ tabs, activeTab, onTabChange }) => {
    return (
        <nav className="master-nav">
            {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                    <button 
                        key={tab.id}
                        className={activeTab === tab.id ? 'm-nav-item active' : 'm-nav-item'} 
                        onClick={() => onTabChange(tab.id)}
                    >
                        {Icon && <Icon size={20} />} 
                        <span>{tab.label}</span>
                    </button>
                );
            })}
        </nav>
    );
};

export default DashboardTabs;
