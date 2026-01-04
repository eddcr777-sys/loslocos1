/* c:\Users\Usuario\conociendogente\src\components\modals\QuoteModal.tsx */
import React from 'react';
import CreatePost from '../../pages/CrearPost/CreatePost';
import { X } from 'lucide-react';
import './QuoteModal.css'; // We will create this CSS

interface QuoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    quotedPost: any;
    onPostCreated: () => void;
}

const QuoteModal: React.FC<QuoteModalProps> = ({ isOpen, onClose, quotedPost, onPostCreated }) => {
    if (!isOpen) return null;

    return (
        <div className="quote-modal-overlay" onClick={onClose}>
            <div className="quote-modal-content" onClick={e => e.stopPropagation()}>
                {/* Header is handled by CreatePost internally when expanded, 
                    but since we are wrapping it, we might want a clean close button strictly for the modal 
                    if CreatePost doesn't fit perfectly. 
                    However, CreatePost has its own header when expanded. 
                    Let's see if we can reuse it directly. 
                */}
                <div style={{ position: 'relative' }}>
                    <CreatePost 
                        onPostCreated={() => {
                            onPostCreated();
                            onClose();
                        }} 
                        quotedPost={quotedPost} 
                        onCancelQuote={onClose}
                    />
                </div>
            </div>
        </div>
    );
};

export default QuoteModal;
