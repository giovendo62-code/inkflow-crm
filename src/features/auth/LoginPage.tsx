import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, ArrowLeft, LogIn, UserPlus } from 'lucide-react';
import classes from './LoginPage.module.css';
import type { UserRole } from '../../types';

export function LoginPage() {
    const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

    // Form Inputs
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');

    const { login, register, error } = useAuth(); // AuthContext ora espone 'error'
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [formError, setFormError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        setIsLoading(true);

        try {
            if (authMode === 'LOGIN') {
                // Login Flow
                await login(email, password);
            } else {
                // Register Flow (Assume Manager for public registration)
                await register(email, password, name, 'MANAGER');
            }

            // Se non lancia errori, naviga
            navigate('/');

        } catch (err: any) {
            setFormError(err.message || "Si è verificato un errore.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={classes.container}>
            <div className={classes.card} style={{ maxWidth: '480px' }}>

                {/* HEADLINE */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <img src="/inkflow-logo.jpg" alt="Logo" style={{ width: 100, borderRadius: '50%', marginBottom: '1rem', border: '3px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                        {authMode === 'LOGIN' ? 'Bentornato' : 'Crea il tuo Studio'}
                    </h2>
                    <p style={{ color: '#666', fontSize: '0.9rem' }}>
                        {authMode === 'LOGIN' ? 'Gestisci il tuo business con InkFlow' : 'Inizia la prova gratuita oggi stesso'}
                    </p>
                </div>

                {/* TABS */}
                <div style={{ display: 'flex', borderBottom: '1px solid #eee', marginBottom: '2rem' }}>
                    <button
                        onClick={() => setAuthMode('LOGIN')}
                        style={{
                            flex: 1, padding: '12px', background: 'none', border: 'none', cursor: 'pointer',
                            fontWeight: authMode === 'LOGIN' ? 'bold' : 'normal',
                            borderBottom: authMode === 'LOGIN' ? '2px solid black' : 'transparent',
                            color: authMode === 'LOGIN' ? 'black' : '#888'
                        }}
                    >
                        Accedi
                    </button>
                    <button
                        onClick={() => setAuthMode('REGISTER')}
                        style={{
                            flex: 1, padding: '12px', background: 'none', border: 'none', cursor: 'pointer',
                            fontWeight: authMode === 'REGISTER' ? 'bold' : 'normal',
                            borderBottom: authMode === 'REGISTER' ? '2px solid black' : 'transparent',
                            color: authMode === 'REGISTER' ? 'black' : '#888'
                        }}
                    >
                        Registrati
                    </button>
                </div>

                {/* ALERT ERRORI */}
                {(formError || error) && (
                    <div style={{ background: '#FFF4F4', color: '#D32F2F', padding: '12px', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #FFCDD2', fontSize: '0.9rem' }}>
                        ⚠️ {formError || error}
                    </div>
                )}

                {/* FORM */}
                <form onSubmit={handleSubmit} className={classes.form}>

                    {authMode === 'REGISTER' && (
                        <div className={classes.group}>
                            <label className={classes.label}>Nome del Manager / Studio</label>
                            <input
                                className={classes.input}
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Es. Marco Rossi"
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
                            placeholder="tu@email.com"
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
                            required={authMode === 'REGISTER'} // Opzionale in Login per demo
                        />
                        {authMode === 'LOGIN' && (
                            <div style={{ textAlign: 'right', marginTop: '4px' }}>
                                <small style={{ color: '#888', cursor: 'pointer' }} onClick={() => alert("Per demo: manager@inkflow.com (no password)")}>Password dimenticata?</small>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        className={classes.primaryButton}
                        disabled={isLoading}
                        style={{ marginTop: '1rem', width: '100%' }}
                    >
                        {isLoading ? 'Caricamento...' : (authMode === 'LOGIN' ? 'Accedi' : 'Crea Account')}
                    </button>

                </form>

                {/* DIAGNOSTICA */}
                <div style={{ position: 'fixed', bottom: 5, right: 5, fontSize: '9px', opacity: 0.3, pointerEvents: 'none' }}>
                    v2.0 Clean | DB: {import.meta.env.VITE_SUPABASE_URL ? 'OK' : 'MISSING'}
                </div>
            </div>
        </div>
    );
}
