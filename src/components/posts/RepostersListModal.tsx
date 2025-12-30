import React from 'react';
import Avatar from '../ui/Avatar';
import { X, Repeat } from 'lucide-react';
import './RepostersListModal.css';

interface RepostersListModalProps {
    isOpen: boolean;
    onClose: () => void;
    reposters: any[];
}

const RepostersListModal: React.FC<RepostersListModalProps> = ({ isOpen, onClose, reposters }) => {
    if (!isOpen) return null;

    return (
        <div className="reposters-modal-overlay" onClick={onClose}>
            <div className="reposters-modal-content" onClick={e => e.stopPropagation()}>
                <div className="reposters-modal-header">
                    <h3>Compartido por</h3>
                    <button className="close-button" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                <div className="reposters-list">
                    {reposters.map((user) => (
                        <div key={user.user_id || user.id} className="reposter-item">
                            <div className="reposter-info">
                                <Avatar src={user.avatar_url} size="medium" />
                                <div className="reposter-details">
                                    <span className="reposter-name">{user.full_name}</span>
                                    {user.faculty && <span className="reposter-faculty">{user.faculty}</span>}
                                </div>
                            </div>
                            <Repeat size={16} className="repost-icon-small" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default RepostersListModal;
