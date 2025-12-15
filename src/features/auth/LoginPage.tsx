import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import QRCode from 'react-qr-code';
import { User, Palette, GraduationCap, ArrowLeft, LogIn, UserPlus, Eye, EyeOff, QrCode as QrIcon, X } from 'lucide-react';
import classes from './LoginPage.module.css';

type AuthMode = 'LOGIN' | 'REGISTER';

export function LoginPage() {
    const navigate = useNavigate();
    const { login, register } = useAuth();

    // State
    const [selectedRole, setSelectedRole] = useState<string | null>(null);
    const [authMode, setAuthMode] = useState<AuthMode>('LOGIN');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');

    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showQR, setShowQR] = useState(false);

    const roleOptions = [
        {
            role: 'MANAGER',
            title: 'Manager Studio',
            description: 'Gestisci il tuo studio, gli artisti e le finanze.',
            icon: User,
            color: '#FF6B35',
            enableRegister: true
        },
        {
            role: 'ARTIST',
            title: 'Tatuatore',
            description: 'Gestisci i tuoi appuntamenti e vedi le tue commissioni.',
            icon: Palette,
            color: '#00CC66',
            enableRegister: false
        },
        {
            role: 'STUDENT',
            title: 'Studente Academy',
            description: 'Accedi ai tuoi corsi e visualizza i progressi.',
            icon: GraduationCap,
            color: '#4285F4',
            enableRegister: false
        }
    ];

    const handleRoleSelect = (role: string) => {
        setSelectedRole(role);
        setAuthMode('LOGIN'); // Default to login
        setError(null);
        // Optional: Pre-fill demo credentials if wanted, but clean implies empty
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            if (authMode === 'LOGIN') {
                await login(email, password, selectedRole as any);
            } else {
                await register(email, password, name, selectedRole as any);
            }
            // Navigation handled by auth state change usually, but safe to push
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Errore durante l\'autenticazione');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={classes.container}>
            <div className={classes.card} style={{
                maxWidth: selectedRole ? '480px' : '900px',
                transition: 'all 0.4s ease',
                position: 'relative'
            }}>
                {/* QR Code Toggle Button */}
                <button
                    onClick={() => setShowQR(true)}
                    style={{
                        position: 'absolute',
                        top: '1.5rem',
                        right: '1.5rem',
                        background: 'transparent',
                        border: '1px solid var(--color-border)',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--color-text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                    title="Mostra QR Code App"
                >
                    <QrIcon size={20} />
                </button>

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
                            boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                            display: 'block',
                            margin: '0 auto 1rem auto'
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
                {error && (
                    <div className={classes.error} style={{ marginBottom: '1.5rem' }}>
                        {error}
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

                        {/* Tabs Login/Register */}
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
                                <div style={{ position: 'relative' }}>
                                    <input
                                        className={classes.input}
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        style={{ paddingRight: '40px' }}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{
                                            position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                                            background: 'none', border: 'none', cursor: 'pointer', color: '#666'
                                        }}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {authMode === 'LOGIN' && (
                                    <div style={{ textAlign: 'right', marginTop: '6px' }}>
                                        <small
                                            style={{ color: '#666', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
                                            onClick={async () => {
                                                const emailReq = prompt("Inserisci la tua email di registrazione:");
                                                if (emailReq) {
                                                    try {
                                                        const { storage } = await import('../../lib/storage');
                                                        const users = await storage.getUsers();
                                                        const found = users.find(u => u.email.toLowerCase() === emailReq.toLowerCase());

                                                        if (found && (found.profile as any).password) {
                                                            const pass = (found.profile as any).password;
                                                            alert(`Suggerimento Password: La tua password inizia con "${pass.substring(0, 3)}..."`);
                                                        } else {
                                                            alert("Utente non trovato.");
                                                        }
                                                    } catch (e) {
                                                        console.error(e);
                                                        alert("Errore ricerca.");
                                                    }
                                                }
                                            }}
                                        >
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
                {showQR && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: '#000000',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 9999
                    }} onClick={() => setShowQR(false)}>
                        <div style={{
                            background: '#ffffff',
                            padding: '2.5rem',
                            borderRadius: '24px',
                            textAlign: 'center',
                            maxWidth: '400px',
                            position: 'relative',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                        }} onClick={e => e.stopPropagation()}>
                            <button
                                onClick={() => setShowQR(false)}
                                style={{
                                    position: 'absolute', right: '1rem', top: '1rem',
                                    background: '#1f2937', border: 'none', borderRadius: '50%',
                                    width: '36px', height: '36px', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'white',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#ef4444'}
                                onMouseLeave={(e) => e.currentTarget.style.background = '#1f2937'}
                            >
                                <X size={20} />
                            </button>

                            <h3 style={{ margin: '0 0 1.5rem 0', color: '#111827', fontSize: '1.5rem', fontWeight: 'bold' }}>
                                📱 Apri su Mobile
                            </h3>

                            <div style={{
                                background: '#ffffff',
                                padding: '1.5rem',
                                borderRadius: '16px',
                                border: '3px solid #1f2937',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }}>
                                <QRCode
                                    value="https://inkflow-crm-4bau.vercel.app/login"
                                    size={256}
                                    level="H"
                                    style={{ height: "auto", maxWidth: "100%", width: "100%", display: 'block' }}
                                    viewBox={`0 0 256 256`}
                                    fgColor="#000000"
                                    bgColor="#ffffff"
                                />
                            </div>

                            <p style={{ marginTop: '1.5rem', color: '#374151', fontSize: '0.95rem', lineHeight: '1.6', fontWeight: '500' }}>
                                Inquadra questo codice con la fotocamera<br />
                                per aprire InkFlow sul tuo dispositivo.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
