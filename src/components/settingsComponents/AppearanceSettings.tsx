import React from 'react';
import Card from '../ui/Card';
import { Moon, Sun, CheckCircle2 } from 'lucide-react';

const AppearanceSettings = () => {
    const isDark = document.body.classList.contains('dark');

    const toggleTheme = (dark: boolean) => {
        if (dark) {
            document.body.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

    return (
        <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: 700 }}>Apariencia</h2>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Personaliza cómo se ve ConociendoGente para ti.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                <Card 
                    onClick={() => toggleTheme(false)}
                    style={{ 
                        padding: '1.5rem', 
                        cursor: 'pointer',
                        border: !isDark ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                        background: 'white',
                        transition: 'all 0.2s ease',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem'
                    }}
                >
                    {!isDark && <CheckCircle2 size={20} color="var(--accent-color)" style={{ position: 'absolute', top: '12px', right: '12px' }} />}
                    <div style={{ 
                        height: '100px', 
                        background: '#f8fafc', 
                        borderRadius: 'var(--radius-md)',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                    }}>
                        <div style={{ width: '40%', height: '8px', background: '#e2e8f0', borderRadius: '4px' }}></div>
                        <div style={{ width: '80%', height: '8px', background: '#e2e8f0', borderRadius: '4px' }}></div>
                        <div style={{ width: '60%', height: '8px', background: '#e2e8f0', borderRadius: '4px' }}></div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Sun size={20} color={!isDark ? 'var(--accent-color)' : 'var(--text-secondary)'} />
                        <span style={{ fontWeight: 600, color: !isDark ? 'var(--text-primary)' : 'var(--text-secondary)' }}>Modo Claro</span>
                    </div>
                </Card>

                <Card 
                    onClick={() => toggleTheme(true)}
                    style={{ 
                        padding: '1.5rem', 
                        cursor: 'pointer',
                        border: isDark ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                        background: '#161e2e',
                        transition: 'all 0.2s ease',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem'
                    }}
                >
                    {isDark && <CheckCircle2 size={20} color="var(--accent-color)" style={{ position: 'absolute', top: '12px', right: '12px' }} />}
                    <div style={{ 
                        height: '100px', 
                        background: '#0b0f1a', 
                        borderRadius: 'var(--radius-md)',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                    }}>
                        <div style={{ width: '40%', height: '8px', background: '#2d3748', borderRadius: '4px' }}></div>
                        <div style={{ width: '80%', height: '8px', background: '#2d3748', borderRadius: '4px' }}></div>
                        <div style={{ width: '60%', height: '8px', background: '#2d3748', borderRadius: '4px' }}></div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Moon size={20} color={isDark ? 'var(--accent-color)' : '#94a3b8'} />
                        <span style={{ fontWeight: 600, color: isDark ? '#f8fafc' : '#94a3b8' }}>Modo Oscuro</span>
                    </div>
                </Card>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default AppearanceSettings;
