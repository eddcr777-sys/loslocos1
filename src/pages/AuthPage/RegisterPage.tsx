import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import logo from '../../assets/images/Untitled__1_-removebg-preview.png';
import { ArrowRight, ChevronLeft, ShieldCheck, User, Calendar, MapPin, Lock, AtSign, AlertCircle, Eye, EyeOff } from 'lucide-react';
import './LoginPage.css';

const RegisterPage = () => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        fullName: '',
        birthDate: '',
        username: '',
        university: '',
        faculty: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { register } = useAuth();
    const navigate = useNavigate();

    const universities = ["UCV", "UCAB", "USB", "USM", "UNIMET", "ULA", "LUZ", "UC", "Otra"];
    const faculties = ["Ingeniería", "Derecho", "Medicina", "Sociales", "Humanidades", "Arquitectura", "Ciencias", "Odontología", "Farmacia", "Otra"];

    // Age validation helper
    const validateAge = (birthDate: string) => {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age >= 16;
    };

    // Username check logic
    useEffect(() => {
        const checkUsername = async () => {
            if (formData.username.length < 3) {
                setUsernameStatus('idle');
                return;
            }
            setUsernameStatus('checking');
            const { isUnique } = await api.isUsernameUnique(formData.username);
            setUsernameStatus(isUnique ? 'available' : 'taken');
        };

        const timer = setTimeout(checkUsername, 500);
        return () => clearTimeout(timer);
    }, [formData.username]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const nextStep = () => {
        setErrorMsg('');
        if (step === 1) {
            if (!formData.fullName || !formData.birthDate) {
                setErrorMsg('Por favor completa tus datos básicos.');
                return;
            }
            if (!validateAge(formData.birthDate)) {
                setErrorMsg('Debes ser mayor de 16 años para unirte.');
                return;
            }
        }
        if (step === 2) {
            if (!formData.username || !formData.university || !formData.faculty) {
                setErrorMsg('Completa tu información académica.');
                return;
            }
            if (usernameStatus === 'taken') {
                setErrorMsg('Este nombre de usuario ya está en uso.');
                return;
            }
            if (usernameStatus === 'checking') return; 
        }
        setStep(step + 1);
    };

    const prevStep = () => {
        setErrorMsg('');
        setStep(step - 1);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');

        if (formData.password !== formData.confirmPassword) {
            setErrorMsg('Las contraseñas no coinciden.');
            return;
        }
        if (formData.password.length < 6) {
            setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
            return;
        }
        if (!acceptTerms) {
            setErrorMsg('Debes aceptar las condiciones.');
            return;
        }

        setLoading(true);
        const { error } = await register({
            email: formData.email,
            password: formData.password,
            fullName: formData.fullName,
            username: formData.username.toLowerCase().trim(),
            faculty: formData.faculty,
            university: formData.university,
            birthDate: formData.birthDate
        });

        setLoading(false);
        if (error) setErrorMsg(typeof error === 'string' ? error : error.message);
        else navigate('/home');
    };

    return (
        <div className="login-page">
            <main className="auth-main">
                <section className="brand-sidebar">
                    <Link to="/" className="brand-id">
                        <span>UniFeed</span>
                    </Link>
                    <div className="brand-tagline">
                        <h1>Únete a <br/>a la comunidad.</h1>
                        <p>Plataforma profesional para la nueva generación de académicos.</p>
                    </div>
                </section>

                <section className="form-section">
                    <div className="auth-card">
                        <div className="progress-container">
                            <div className={`progress-dot ${step >= 1 ? 'active' : ''}`}></div>
                            <div className={`progress-line ${step >= 2 ? 'filled' : ''}`}></div>
                            <div className={`progress-dot ${step >= 2 ? 'active' : ''}`}></div>
                            <div className={`progress-line ${step >= 3 ? 'filled' : ''}`}></div>
                            <div className={`progress-dot ${step >= 3 ? 'active' : ''}`}></div>
                        </div>

                        <header className="auth-header">
                            {step === 1 && <h2>Sobre ti</h2>}
                            {step === 2 && <h2>Academia</h2>}
                            {step === 3 && <h2>Seguridad</h2>}
                            <p>
                                {step === 1 && "Ingresa tu identidad real para empezar."}
                                {step === 2 && "Dinos dónde estudias y elige tu @usuario."}
                                {step === 3 && "Crea tus credenciales de acceso."}
                            </p>
                        </header>

                        <form onSubmit={step === 3 ? handleSubmit : (e) => e.preventDefault()} className="auth-form">
                            {errorMsg && <div className="form-error"><AlertCircle size={16}/> {errorMsg}</div>}
                            
                            {step === 1 && (
                                <>
                                    <div className="form-field">
                                        <label>Nombre Completo</label>
                                        <div style={{ position: 'relative' }}>
                                            <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                            <input type="text" name="fullName" className="input-pro" style={{ paddingLeft: '44px' }} placeholder="Nombre y Apellido" value={formData.fullName} onChange={handleChange} required />
                                        </div>
                                    </div>
                                    <div className="form-field">
                                        <label>Fecha de Nacimiento</label>
                                        <div style={{ position: 'relative' }}>
                                            <Calendar size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                            <input type="date" name="birthDate" className="input-pro" style={{ paddingLeft: '44px' }} value={formData.birthDate} onChange={handleChange} required />
                                        </div>
                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Debes ser mayor de 16 años.</p>
                                    </div>
                                </>
                            )}

                            {step === 2 && (
                                <>
                                    <div className="form-field">
                                        <label>Nombre de Usuario</label>
                                        <div style={{ position: 'relative' }}>
                                            <AtSign size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                            <input type="text" name="username" className="input-pro" style={{ paddingLeft: '44px' }} placeholder="@usuario" value={formData.username} onChange={handleChange} required />
                                            <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', fontWeight: 700 }}>
                                                {usernameStatus === 'checking' && <span style={{ color: 'var(--text-muted)' }}>...</span>}
                                                {usernameStatus === 'available' && <span style={{ color: '#10b981' }}>Libre</span>}
                                                {usernameStatus === 'taken' && <span style={{ color: '#ef4444' }}>Ocupado</span>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-field">
                                        <label>Universidad</label>
                                        <select name="university" className="input-pro" value={formData.university} onChange={handleChange} required>
                                            <option value="">Selecciona...</option>
                                            {universities.map(u => <option key={u} value={u}>{u}</option>)}
                                        </select>
                                    </div>

                                    <div className="form-field">
                                        <label>Facultad</label>
                                        <select name="faculty" className="input-pro" value={formData.faculty} onChange={handleChange} required>
                                            <option value="">Selecciona...</option>
                                            {faculties.map(f => <option key={f} value={f}>{f}</option>)}
                                        </select>
                                    </div>
                                </>
                            )}

                            {step === 3 && (
                                <>
                                    <div className="form-field">
                                        <label>Email Académico</label>
                                        <input type="email" name="email" className="input-pro" placeholder="usuario@universidad.edu" value={formData.email} onChange={handleChange} required />
                                    </div>

                                    <div className="form-field">
                                        <label>Contraseña</label>
                                        <div className="password-input-wrapper">
                                            <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 1 }} />
                                            <input 
                                                type={showPassword ? "text" : "password"} 
                                                name="password" 
                                                className="input-pro" 
                                                style={{ paddingLeft: '44px', paddingRight: '44px' }} 
                                                placeholder="••••••" 
                                                value={formData.password} 
                                                onChange={handleChange} 
                                                required 
                                            />
                                            <div className="password-toggle-icon" onClick={() => setShowPassword(!showPassword)}>
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-field">
                                        <label>Confirmar Contraseña</label>
                                        <div className="password-input-wrapper">
                                            <ShieldCheck size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 1 }} />
                                            <input 
                                                type={showConfirmPassword ? "text" : "password"} 
                                                name="confirmPassword" 
                                                className="input-pro" 
                                                style={{ paddingLeft: '44px', paddingRight: '44px' }} 
                                                placeholder="••••••" 
                                                value={formData.confirmPassword} 
                                                onChange={handleChange} 
                                                required 
                                            />
                                            <div className="password-toggle-icon" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                                        <input type="checkbox" id="terms" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: 'var(--accent-color)', cursor: 'pointer' }} required />
                                        <label htmlFor="terms" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                                            Soy mayor de 16 años y acepto los <Link to="/legal/terms" style={{ color: 'var(--accent-color)', fontWeight: 700 }}>Términos</Link> y <Link to="/legal/privacy" style={{ color: 'var(--accent-color)', fontWeight: 700 }}>Privacidad</Link>.
                                        </label>
                                    </div>
                                </>
                            )}

                            <div className="nav-actions">
                                {step > 1 && (
                                    <button type="button" onClick={prevStep} className="btn-reverse">
                                        <ChevronLeft size={24} />
                                    </button>
                                )}
                                
                                {step < 3 ? (
                                    <button type="button" onClick={nextStep} className="btn-continue">
                                        Continuar <ArrowRight size={22} />
                                    </button>
                                ) : (
                                    <button type="submit" className="btn-continue" disabled={loading || !acceptTerms}>
                                        {loading ? 'Preparando...' : <>Crear Perfil <ShieldCheck size={22} /></>}
                                    </button>
                                )}
                            </div>
                        </form>

                        <footer className="auth-footer" style={{ marginTop: '2.5rem' }}>
                            ¿Ya tienes cuenta? <Link to="/login" style={{ fontWeight: 800 }}>Inicia sesión</Link>
                        </footer>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default RegisterPage;
