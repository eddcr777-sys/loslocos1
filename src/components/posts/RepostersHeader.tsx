import React from 'react';
import { Repeat, TrendingUp } from 'lucide-react';
import Avatar from '../ui/Avatar';
import './RepostersHeader.css';

interface RepostersHeaderProps {
    repostersData: any[];
    currentUserFaculty?: string;
    currentUserId?: string;
    isTrending?: boolean;
    trendingPeriod?: 'day' | 'week' | 'month' | 'year';
    onClick?: () => void;
}

const RepostersHeader: React.FC<RepostersHeaderProps> = ({ 
    repostersData, 
    currentUserFaculty,
    currentUserId,
    isTrending,
    trendingPeriod,
    onClick 
}) => {
    if (!repostersData || repostersData.length === 0) return null;

    // Use raw data as it comes sorted (Newest first)
    const displayReposters = repostersData;

    const trendingLabels = {
        day: 'del día',
        week: 'de la semana',
        month: 'del mes',
        year: 'del año'
    };

    return (
        <div className="reposters-header-container" onClick={onClick}>
            <div className="reposters-content">
                <div className="repost-icon-wrapper">
                    <Repeat size={12} color="var(--success)" strokeWidth={3} />
                </div>

                <div className="avatars-stack">
                    {displayReposters.slice(0, 3).map((reposter, index) => (
                        <div
                            key={reposter.user_id || index}
                            className="avatar-stack-item"
                        >
                            <Avatar 
                                src={reposter.avatar_url}
                                size="small"
                                style={{
                                    width: '24px',
                                    height: '24px',
                                    border: '2px solid var(--surface-color)'
                                }}
                            />
                        </div>
                    ))}
                </div>

                <span className="repost-label">
                    {displayReposters.length === 1 
                        ? `${displayReposters[0].full_name?.split(' ')[0] || displayReposters[0].user_id?.split(' ')[0]} compartió esto!` 
                        : 'compartieron esto!'}
                </span>
            </div>

            {isTrending && trendingPeriod && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.375rem 0.75rem',
                    borderRadius: 'var(--radius-full)',
                    background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    boxShadow: '0 2px 8px rgba(255, 107, 107, 0.3)',
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                    marginLeft: 'auto'
                }}>
                    <TrendingUp size={12} />
                    <span>Trending {trendingLabels[trendingPeriod]}</span>
                </div>
            )}
        </div>
    );
};

export default RepostersHeader;
