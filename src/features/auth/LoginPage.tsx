import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Palette, GraduationCap, ArrowLeft, LogIn, UserPlus, RefreshCw } from 'lucide-react';
import classes from './LoginPage.module.css';
import type { UserRole } from '../../types';

export function LoginPage() {
    const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
    const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login, register } = useAuth();
    const navigate = useNavigate();

    const handleResetData = () => {
        if (confirm('⚠️ ATTENZIONE: Questo cancellerà tutti i dati locali e resetterà l\'app allo stato iniziale. Sei sicuro?')) {
            localStorage.clear();
            window.location.reload();
        }
    };

    const roleOptions = [
        {
            role: 'MANAGER' as UserRole,
            icon: User,
            title: 'Manager Studio',
            description: 'Gestione completa studio, operatori e report finanziari.',
            color: '#FF6B35',
            demoEmail: 'manager@inkflow.com'
        },
        {
            role: 'ARTIST' as UserRole,
            icon: Palette,
            title: 'Tatuatore',
            description: 'Gestisci i tuoi appuntamenti, clienti e portfolio.',
            color: '#00CC66',
            demoEmail: 'artist@inkflow.com'
        },
        {
            role: 'STUDENT' as UserRole,
            icon: GraduationCap,
            title: 'Corsista Academy',
            description: 'Accedi ai corsi, materiali didattici e presenze.',
            color: '#4285F4',
            demoEmail: 'student@inkflow.com'
        }
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (authMode === 'LOGIN') {
                // Se password vuota, tenta login demo locale se l'email matcha una demo
                if (!password && ['manager@inkflow.com', 'artist@inkflow.com', 'student@inkflow.com'].includes(email)) {
                    await login(email); // Mock login
                } else {
                    await login(email, password); // Real login
                }
            } else {
                // Register
                if (!selectedRole) return;
                await register(email, password, name, selectedRole);
            }
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Errore di autenticazione');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRoleSelect = (role: UserRole, demoEmail: string) => {
        setSelectedRole(role);
        // Pre-fill email for convenience if in demo mode intent, but allow change
        if (authMode === 'LOGIN') {
            setEmail(demoEmail);
        } else {
            setEmail('');
        }
    };

    return (
        <div className={classes.container}>
            <div className={classes.card} style={{
                maxWidth: selectedRole ? '480px' : '900px',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
                <div className={classes.header}>
                    <img
                        src="/inkflow-logo.jpg"
                        alt="InkFlow Logo"
                        style={{
                            width: '140px',
                            height: '140px',
                            borderRadius: '50%',
                            // objectFit: 'cover', // Rimosso se il logo è già centrato, o adjusted
                            marginBottom: '1.5rem',
                            display: 'block',
                            marginLeft: 'auto',
                            marginRight: 'auto',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                            border: '4px solid #fff'
                        }}
                    />
                    <p className={classes.subtitle}>
                        {selectedRole
                            ? (authMode === 'LOGIN' ? 'Accedi al tuo spazio' : 'Crea il tuo profilo')
                            : 'Seleziona il tuo ruolo per iniziare'}
                    </p>
                </div>

                {!selectedRole ? (
                    // STEP 1: SCELTA RUOLO
                    <>
                        <div className={classes.roleGrid}>
                            {roleOptions.map(option => (
                                <button
                                    key={option.role}
                                    onClick={() => handleRoleSelect(option.role, option.demoEmail)}
                                    className={classes.roleCard}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = option.color;
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                        e.currentTarget.style.boxShadow = `0 10px 20px -10px ${option.color}40`;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--color-border)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    <option.icon
                                        size={48}
                                        style={{ color: option.color, marginBottom: '1rem' }}
                                    />
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                                        {option.title}
                                    </h3>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                                        {option.description}
                                    </p>
                                </button>
                            ))}
                        </div>

                        {/* Emergency Reset Button */}
                        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                            <button
                                onClick={handleResetData}
                                className={classes.secondaryButton}
                                style={{ margin: '0 auto', fontSize: '0.8rem', opacity: 0.6 }}
                            >
                                <RefreshCw size={14} /> Reset Dati (Se bloccato)
                            </button>
                        </div>
                    </>
                ) : (
                    // STEP 2: FORM AUTH (Login/Register)
                    <div className={classes.formContainer}>
                        {/* Indicatore Ruolo Scelto */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            background: `${roleOptions.find(r => r.role === selectedRole)?.color}15`,
                            padding: '12px', borderRadius: '8px', marginBottom: '20px'
                        }}>
                            {React.createElement(roleOptions.find(r => r.role === selectedRole)!.icon, {
                                size: 24,
                                color: roleOptions.find(r => r.role === selectedRole)?.color
                            })}
                            <span style={{ fontWeight: 600, color: roleOptions.find(r => r.role === selectedRole)?.color }}>
                                {roleOptions.find(r => r.role === selectedRole)?.title}
                            </span>
                            <button onClick={() => setSelectedRole(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5 }}>Cambia</button>
                        </div>

                        {/* Tabs Login/Register */}
                        <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', marginBottom: '20px' }}>
                            <button
                                onClick={() => setAuthMode('LOGIN')}
                                style={{
                                    flex: 1, padding: '10px', background: 'none', border: 'none',
                                    borderBottom: authMode === 'LOGIN' ? '2px solid var(--color-text-primary)' : 'none',
                                    fontWeight: authMode === 'LOGIN' ? 600 : 400, cursor: 'pointer',
                                    color: authMode === 'LOGIN' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)'
                                }}
                            >
                                Accedi
                            </button>
                            <button
                                onClick={() => setAuthMode('REGISTER')}
                                style={{
                                    flex: 1, padding: '10px', background: 'none', border: 'none',
                                    borderBottom: authMode === 'REGISTER' ? '2px solid var(--color-text-primary)' : 'none',
                                    fontWeight: authMode === 'REGISTER' ? 600 : 400, cursor: 'pointer',
                                    color: authMode === 'REGISTER' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)'
                                }}
                            >
                                Registrati
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className={classes.form}>
                            {authMode === 'REGISTER' && (
                                <div className={classes.group}>
                                    <label className={classes.label}>Nome Completo</label>
                                    <input
                                        type="text"
                                        className={classes.input}
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Es. Mario Rossi"
                                        required
                                    />
                                </div>
                            )}

                            <div className={classes.group}>
                                <label className={classes.label}>Email</label>
                                <input
                                    type="email"
                                    className={classes.input}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="email@esempio.com"
                                    required
                                />
                            </div>

                            <div className={classes.group}>
                                <label className={classes.label}>Password</label>
                                <input
                                    type="password"
                                    className={classes.input}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={authMode === 'LOGIN' ? 'Lascia vuoto per Demo Mode' : 'Minimo 6 caratteri'}
                                    minLength={authMode === 'REGISTER' ? 6 : undefined}
                                />
                                {authMode === 'LOGIN' && !password && (
                                    <span style={{ fontSize: '0.75rem', color: '#888', marginTop: '4px', display: 'block' }}>
                                        * Lascia vuoto per accedere in modalità Demo locale
                                    </span>
                                )}
                            </div>

                            {error && <div className={classes.error}>{error}</div>}

                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button
                                    type="button"
                                    onClick={() => setSelectedRole(null)}
                                    className={classes.secondaryButton}
                                >
                                    <ArrowLeft size={18} /> Indietro
                                </button>
                                <button type="submit" className={classes.primaryButton} disabled={isLoading}>
                                    {isLoading ? 'Attendere...' : (authMode === 'LOGIN' ?
                                        <><LogIn size={18} /> Accedi</> :
                                        <><UserPlus size={18} /> Crea Account</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
