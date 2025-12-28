import React from 'react';

interface StatCardProps {
    title: string;
    value: string | number;
    subtext?: string;
    icon?: React.ReactNode;
    trend?: 'up' | 'down' | 'neutral';
    trendLabel?: string;
    className?: string; // Para clases adicionales de colores (users-g, posts-g, etc.)
}

const StatCard: React.FC<StatCardProps> = ({ 
    title, 
    value, 
    subtext, 
    icon, 
    trend, 
    trendLabel,
    className = ''
}) => {
    return (
        <div className={`m-stat-card ${className}`}>
            <div className="m-stat-header">
                {icon}
                <span>{title}</span>
            </div>

            <div className="m-stat-body">
                <h2>{value}</h2>
                {(trendLabel || subtext) && (
                    <div style={{ fontSize: '0.75rem', marginTop: '4px', opacity: 0.8 }}>
                        {trendLabel || subtext}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StatCard;
