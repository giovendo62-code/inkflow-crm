import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Palette, GraduationCap, ArrowLeft, LogIn, UserPlus } from 'lucide-react';
import classes from './LoginPage.module.css';
import type { UserRole } from '../../types';

export function LoginPage() {
    // STATE GESTIONE UI
    const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
    const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

    // FORM INPUTS
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');

    // AUTH HOOKS
    const { login, register, error } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [formError, setFormError] = useState('');

    // DEFINIZIONE CARD RUOLI
    const roleOptions = [
        {
            role: 'MANAGER' as UserRole,
            icon: User,
            title: 'Manager Studio',
            description: 'Registra il tuo Studio e gestisci il team.',
            color: '#FF6B35',
            enableRegister: true
        },
        {
            role: 'ARTIST' as UserRole,
            icon: Palette,
            title: 'Tatuatore / Staff',
            description: 'Accedi al CRM del tuo studio.',
            color: '#00CC66',
            enableRegister: false // Solo Login
        },
        {
            role: 'STUDENT' as UserRole,
            icon: GraduationCap,
            title: 'Corsista Academy',
            description: 'Accedi ai corsi e materiali.',
            color: '#4285F4',
            enableRegister: false // Solo Login
        }
    ];

    // HANDLERS
    const handleRoleSelect = (role: UserRole) => {
        setSelectedRole(role);
        setAuthMode('LOGIN'); // Default to login
        setFormError('');
        setEmail('');
        setPassword('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        setIsLoading(true);

        try {
            if (authMode === 'LOGIN') {
                // LOGIN (Generico per tutti i ruoli)
                await login(email, password);
                // NOTA: Il controllo del ruolo avviene dopo il login se necessario, 
                // ma per ora lasciamo che AuthContext rediriga o accetti chiunque sia valido.
            } else {
                // REGISTRAZIONE (Solo Manager)
                if (selectedRole === 'MANAGER') {
                    await register(email, password, name, 'MANAGER');
                } else {
                    throw new Error("La registrazione pubblica è disponibile solo per i Manager.");
                }
            }
            navigate('/');
        } catch (err: any) {
            setFormError(err.message || 'Errore durante l\'operazione.');
        } finally {
            setIsLoading(false);
        }
    };

    // RENDER
    return (
        <div className={classes.container}>
            <div className={classes.card} style={{
                maxWidth: selectedRole ? '480px' : '900px',
                transition: 'all 0.4s ease'
            }}>

                {/* HEADER LOGO */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <img
                        src="/inkflow-logo.jpg"
                        alt="InkFlow Logo"
                        style={{
                            width: '120px',
                            height: '120px',
                            borderRadius: '50%',
                            marginBottom: '1rem',
                            border: '4px solid white',
                            boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                        }}
                    />
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#1a1a1a' }}>
                        {selectedRole
                            ? (authMode === 'LOGIN' ? 'Bentornato' : 'Crea il tuo Studio')
                            : 'Benvenuto in InkFlow'
                        }
                    </h2>
                    <p style={{ color: '#666', fontSize: '1rem', marginTop: '0.5rem' }}>
                        {selectedRole
                            ? (authMode === 'LOGIN' ? 'Inserisci le tue credenziali' : 'Inizia la tua prova gratuita')
                            : 'Seleziona il tuo ruolo per continuare'}
                    </p>
                </div>

                {/* ALERT ERRORI */}
                {(formError || error) && (
                    <div className={classes.error} style={{ marginBottom: '1.5rem' }}>
                        {formError || error}
                    </div>
                )}

                {!selectedRole ? (
                    // --- STEP 1: SCELTA RUOLO (CARDS) ---
                    <div className={classes.roleGrid}>
                        {roleOptions.map(option => (
                            <button
                                key={option.role}
                                onClick={() => handleRoleSelect(option.role)}
                                className={classes.roleCard}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = option.color;
                                    e.currentTarget.style.transform = 'translateY(-5px)';
                                    e.currentTarget.style.boxShadow = `0 12px 20px -8px ${option.color}40`;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--color-border)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <div style={{
                                    background: `${option.color}15`,
                                    padding: '16px',
                                    borderRadius: '50%',
                                    display: 'inline-flex',
                                    marginBottom: '1rem'
                                }}>
                                    <option.icon size={32} color={option.color} />
                                </div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                                    {option.title}
                                </h3>
                                <p style={{ fontSize: '0.9rem', color: '#666', lineHeight: 1.4 }}>
                                    {option.description}
                                </p>
                            </button>
                        ))}
                    </div>
                ) : (
                    // --- STEP 2: FORM AUTH ---
                    <div className={classes.formContainer}>

                        {/* Indicatore Ruolo Scelto */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '12px',
                            padding: '12px 16px', borderRadius: '12px', marginBottom: '1.5rem',
                            background: '#f8f9fa', border: '1px solid #eee'
                        }}>
                            {(() => {
                                const opt = roleOptions.find(r => r.role === selectedRole);
                                if (!opt) return null;
                                return (
                                    <>
                                        <opt.icon size={20} color={opt.color} />
                                        <span style={{ fontWeight: 600, color: '#333' }}>{opt.title}</span>
                                        <button
                                            onClick={() => setSelectedRole(null)}
                                            style={{
                                                marginLeft: 'auto', background: 'none', border: 'none',
                                                color: '#666', cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline'
                                            }}
                                        >
                                            Cambia
                                        </button>
                                    </>
                                );
                            })()}
                        </div>

                        {/* Tabs Login/Register (Solo per chi ha register abilitato, es. Manager) */}
                        {roleOptions.find(r => r.role === selectedRole)?.enableRegister && (
                            <div style={{ display: 'flex', borderBottom: '2px solid #eee', marginBottom: '2rem' }}>
                                <button
                                    onClick={() => setAuthMode('LOGIN')}
                                    style={{
                                        flex: 1, padding: '12px', background: 'none', border: 'none', cursor: 'pointer',
                                        fontWeight: authMode === 'LOGIN' ? 'bold' : 'normal',
                                        borderBottom: authMode === 'LOGIN' ? '2px solid #333' : '2px solid transparent',
                                        marginBottom: '-2px', transition: 'all 0.2s'
                                    }}
                                >
                                    Accedi
                                </button>
                                <button
                                    onClick={() => setAuthMode('REGISTER')}
                                    style={{
                                        flex: 1, padding: '12px', background: 'none', border: 'none', cursor: 'pointer',
                                        fontWeight: authMode === 'REGISTER' ? 'bold' : 'normal',
                                        borderBottom: authMode === 'REGISTER' ? '2px solid #333' : '2px solid transparent',
                                        marginBottom: '-2px', transition: 'all 0.2s'
                                    }}
                                >
                                    Registrati
                                </button>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className={classes.form}>

                            {authMode === 'REGISTER' && (
                                <div className={classes.group}>
                                    <label className={classes.label}>Nome Completo / Studio</label>
                                    <input
                                        className={classes.input}
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        placeholder="Es. InkFlow Studio"
                                        required
                                    />
                                </div>
                            )}

                            <div className={classes.group}>
                                <label className={classes.label}>Email</label>
                                <input
                                    className={classes.input}
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="name@example.com"
                                    required
                                />
                            </div>

                            <div className={classes.group}>
                                <label className={classes.label}>Password</label>
                                <input
                                    className={classes.input}
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required={authMode === 'REGISTER' || !['manager@inkflow.com'].includes(email)}
                                />
                                {authMode === 'LOGIN' && (
                                    <div style={{ textAlign: 'right', marginTop: '6px' }}>
                                        <small style={{ color: '#666', fontSize: '0.8rem', cursor: 'pointer' }} onClick={() => alert("Funzione recupero password non ancora attiva.")}>
                                            Password dimenticata?
                                        </small>
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                className={classes.primaryButton}
                                disabled={isLoading}
                                style={{ marginTop: '1.5rem', width: '100%', padding: '14px' }}
                            >
                                {isLoading ? (
                                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        Loading...
                                    </span>
                                ) : (
                                    authMode === 'LOGIN' ? (
                                        <><LogIn size={20} /> Accedi</>
                                    ) : (
                                        <><UserPlus size={20} /> Crea Account</>
                                    )
                                )}
                            </button>

                            {/* Pulsante Indietro extra */}
                            <button
                                type="button"
                                onClick={() => setSelectedRole(null)}
                                style={{
                                    width: '100%', marginTop: '10px', padding: '12px',
                                    background: 'none', border: 'none', color: '#666', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                }}
                            >
                                <ArrowLeft size={16} /> Torna alla selezione
                            </button>

                        </form>
                    </div>
                )}
            </div>

            <div style={{
                position: 'fixed', bottom: 10, left: 0, right: 0,
                textAlign: 'center', color: '#888', fontSize: '0.8rem', opacity: 0.6
            }}>
                InkFlow CRM v2.0 &bull; Secure Cloud
            </div>
        </div>
    );
}
