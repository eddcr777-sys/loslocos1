import React from 'react';
import './AdminCommon.css';

interface AdminHeaderProps {
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    children?: React.ReactNode; // Para botones de acción a la derecha
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ title, subtitle, icon, children }) => {
    return (
        <header className="master-header">
            <div className="master-header-content">
                <div className="master-title">
                    {icon && (
                        <div className="master-logo-bg">
                            {icon}
                        </div>
                    )}
                    <div>
                        <h1>{title}</h1>
                        {subtitle && <p>{subtitle}</p>}
                    </div>
                </div>
                {children && <div className="header-actions">{children}</div>}
            </div>
        </header>
    );
};

export default AdminHeader;
