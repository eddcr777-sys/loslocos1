import React, { useState } from 'react';
import { Shield, University, Rocket, ChevronRight, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import './VerificationHub.tsx.css';

const VerificationHub = () => {
    const { profile, refreshProfile } = useAuth();
    const [step, setStep] = useState<'choice' | 'verify'>('choice');
    const [roleType, setRoleType] = useState<'admin' | 'institutional' | null>(null);
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleChoice = (type: 'admin' | 'institutional') => {
        setRoleType(type);
        setStep('verify');
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!profile) return;

        try {
            // Llamamos a la base de datos de forma segura
            const result = await api.verifyAndUpgradeRole(code, profile.id);

            if (result.success) {
                setRoleType(result.role as 'admin'|'institutional');
                setSuccess(true);
                await refreshProfile();
            } else {
                alert(result.message || 'Código incorrecto');
            }
        } catch (error: any) {
            alert('Error en la verificación: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="verification-hub-container success">
                <div className="success-content">
                    <CheckCircle size={64} color="#10b981" />
                    <h1>¡Identidad Verificada!</h1>
                    <p>Ahora tienes acceso a las funciones de {roleType === 'admin' ? 'Administrador' : 'Personal Universitario'}.</p>
                    <button className="premium-btn" onClick={() => window.location.href = '/home'}>Ir al Inicio</button>
                </div>
            </div>
        );
    }

    return (
        <div className="verification-hub-container">
            {step === 'choice' ? (
                <div className="verification-choices">
                    <div className="hub-header">
                        <Shield size={48} className="hub-icon" />
                        <h1>Centro de Verificación</h1>
                        <p>Selecciona tu nivel de autoridad para acceder a funciones exclusivas.</p>
                    </div>

                    <div className="choice-cards">
                        <div className="choice-card institutional" onClick={() => handleChoice('institutional')}>
                            <div className="card-icon">
                                <University size={32} />
                            </div>
                            <div className="card-text">
                                <h3>Soy Personal Universitario</h3>
                                <p>Publica avisos oficiales y gestiona eventos institucionales.</p>
                            </div>
                            <ChevronRight size={20} className="arrow" />
                        </div>

                        <div className="choice-card admin" onClick={() => handleChoice('admin')}>
                            <div className="card-icon">
                                <Shield size={32} />
                            </div>
                            <div className="card-text">
                                <h3>Soy Administrador</h3>
                                <p>Control total de la plataforma y métricas del sistema.</p>
                            </div>
                            <ChevronRight size={20} className="arrow" />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="verification-form-view">
                    <button className="back-link" onClick={() => setStep('choice')}>← Volver</button>
                    <div className="form-header">
                        {roleType === 'admin' ? <Shield size={40} /> : <University size={40} />}
                        <h2>Verificar como {roleType === 'admin' ? 'Administrador' : 'Personal Institucional'}</h2>
                        <p>Ingresa el código que se te ha proporcionado para validar tu rango.</p>
                    </div>

                    <form onSubmit={handleVerify} className="verification-form">
                        <input 
                            type="text" 
                            placeholder="Código de Verificación" 
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            required
                        />
                        <button type="submit" className="premium-btn" disabled={loading}>
                            {loading ? 'Validando...' : 'Verificar Ahora'}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default VerificationHub;
