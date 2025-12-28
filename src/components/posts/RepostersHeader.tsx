import React from 'react';
import { Repeat, TrendingUp } from 'lucide-react';
import Avatar from '../ui/Avatar';

interface RepostersHeaderProps {
    repostersData: any[];
    currentUserFaculty?: string;
    currentUserId?: string;
    isTrending?: boolean;
    trendingPeriod?: 'day' | 'week' | 'month' | 'year';
}

const RepostersHeader: React.FC<RepostersHeaderProps> = ({ 
    repostersData, 
    currentUserFaculty,
    currentUserId,
    isTrending,
    trendingPeriod 
}) => {
    if (!repostersData || repostersData.length === 0) return null;

    // Verificar si el usuario actual está en la lista de reposters
    const isMe = currentUserId ? repostersData.some(r => r.user_id === currentUserId) : false;

    // Filtrar reposters de la misma facultad
    const fromMyFaculty = currentUserFaculty 
        ? repostersData.filter(r => r.faculty === currentUserFaculty)
        : [];

    // Determinar el mensaje
    let message = '';
    let displayReposters = repostersData;

    if (isMe && repostersData.length === 1) {
        message = 'Lo compartiste';
    } else if (fromMyFaculty.length > 0) {
        displayReposters = fromMyFaculty;
        if (fromMyFaculty.length === 1) {
            message = isMe && fromMyFaculty[0].user_id === currentUserId 
                ? 'Lo compartiste' 
                : `${fromMyFaculty[0].full_name} de tu facultad compartió esto`;
        } else if (fromMyFaculty.length === 2) {
            const other = fromMyFaculty.find(r => r.user_id !== currentUserId);
            message = isMe 
                ? `Tú y ${other?.full_name} de tu facultad compartieron esto`
                : `${fromMyFaculty[0].full_name} y ${fromMyFaculty[1].full_name} de tu facultad compartieron esto`;
        } else {
            message = isMe
                ? `Tú y ${fromMyFaculty.length - 1} personas más de tu facultad compartieron esto`
                : `${fromMyFaculty[0].full_name} y ${fromMyFaculty.length - 1} personas más de tu facultad compartieron esto`;
        }
    } else {
        if (repostersData.length === 1) {
            message = isMe ? 'Lo compartiste' : `${repostersData[0].full_name} compartió esto`;
        } else if (repostersData.length === 2) {
            const other = repostersData.find(r => r.user_id !== currentUserId);
            message = isMe 
                ? `Tú y ${other?.full_name} compartieron esto`
                : `${repostersData[0].full_name} y ${repostersData[1].full_name} compartieron esto`;
        } else {
            message = isMe
                ? `Tú y ${repostersData.length - 1} personas más compartieron esto`
                : `${repostersData[0].full_name} y ${repostersData.length - 1} personas más compartieron esto`;
        }
    }

    const trendingLabels = {
        day: 'del día',
        week: 'de la semana',
        month: 'del mes',
        year: 'del año'
    };

    return (
        <div style={{
            padding: '0.4rem 0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.625rem',
            borderBottom: '1px solid var(--border-color)',
            backgroundColor: 'var(--surface-color)'
        }}>
            {/* Left side: Reposters info */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                flex: 1,
                minWidth: 0
            }}>
                {/* Icon */}
                <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--success-soft)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                }}>
                    <Repeat size={12} color="var(--success)" strokeWidth={3} />
                </div>

                {/* Avatars stack (max 3) */}
                <div style={{
                    display: 'flex',
                    marginLeft: '-0.375rem',
                    flexShrink: 0
                }}>
                    {displayReposters.slice(0, 3).map((reposter, index) => (
                        <div
                            key={reposter.user_id}
                            style={{
                                marginLeft: index > 0 ? '-0.375rem' : '0',
                                position: 'relative',
                                zIndex: 3 - index
                            }}
                        >
                            <Avatar 
                                src={reposter.avatar_url}
                                size="small"
                                style={{
                                    width: '20px',
                                    height: '20px',
                                    border: '1.5px solid var(--surface-color)'
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* Message */}
                <span style={{
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    color: 'var(--text-secondary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }}>
                    {message}
                </span>
            </div>

            {/* Right side: Trending badge */}
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
                    whiteSpace: 'nowrap'
                }}>
                    <TrendingUp size={12} />
                    <span>Trending {trendingLabels[trendingPeriod]}</span>
                </div>
            )}
        </div>
    );
};

export default RepostersHeader;
