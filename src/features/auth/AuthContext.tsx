import React, { createContext, useContext, useState, useEffect } from 'react';
import { type User } from '../../types';
import { storage } from '../../lib/storage';
// import { supabase } from '../../lib/supabase'; // DISABILITATO PER DEBUG
// import { syncFromCloud } from '../../lib/sync'; // DISABILITATO PER DEBUG

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (email: string, password?: string) => Promise<void>;
    register: (email: string, password: string, name: string, role: string) => Promise<void>;
    logout: () => void;
    loading: boolean;
    error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Init Check SIMPLIFICATO (SOLO LOCAL)
        const initAuth = async () => {
            try {
                // 1. Check Local Session (Legacy/Offline fallback)
                const storedUser = localStorage.getItem('inkflow_session');
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                }
                storage.initialize(); // Ensure mocks are there
            } catch (err) {
                console.error('Auth Init Error:', err);
            } finally {
                setLoading(false);
            }
        };

        initAuth();
    }, []);

    const login = async (email: string, password?: string) => {
        setError(null);
        try {
            // SOLO MOCK LOGIN PER ORA
            console.log('⚠️ Usando Mock Login locale (DEBUG MODE)');
            const users = storage.getUsers();
            const normalizedEmail = email.trim().toLowerCase();
            const foundUser = users.find(u => u.email.toLowerCase() === normalizedEmail);

            if (foundUser) {
                setUser(foundUser);
                localStorage.setItem('inkflow_session', JSON.stringify(foundUser));
            } else {
                // AUTO-HEALING: Se l'utente manager demo è sparito, ricrealo al volo
                if (email === 'manager@inkflow.com') {
                    const newManager = {
                        id: 'user-manager',
                        tenantId: 'studio-1',
                        email: 'manager@inkflow.com',
                        name: 'Marco Rossi',
                        role: 'MANAGER',
                        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marco',
                        profile: { bio: 'Manager', color: '#FF6B35' }
                    } as User;
                    const currentUsers = storage.getUsers();
                    currentUsers.push(newManager);
                    localStorage.setItem('inkflow_users', JSON.stringify(currentUsers));

                    setUser(newManager);
                    localStorage.setItem('inkflow_session', JSON.stringify(newManager));
                    console.log('✅ Utente Manager ricreato e loggato.');
                    return;
                }

                // AUTO-HEALING ARTISTA
                if (email === 'artist@inkflow.com') {
                    const newArtist = {
                        id: 'user-artist',
                        tenantId: 'studio-1',
                        email: 'artist@inkflow.com',
                        name: 'Alex Bianchi',
                        role: 'ARTIST',
                        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
                        profile: {
                            bio: 'Resident Artist',
                            color: '#00CC66',
                            commissionRate: 50
                        }
                    } as User;
                    const currentUsers = storage.getUsers();
                    // Evita duplicati se c'è già ma con ID diverso per qualche motivo strano
                    const others = currentUsers.filter(u => u.email !== 'artist@inkflow.com');
                    others.push(newArtist);

                    localStorage.setItem('inkflow_users', JSON.stringify(others));

                    setUser(newArtist);
                    localStorage.setItem('inkflow_session', JSON.stringify(newArtist));
                    console.log('✅ Utente Artista ricreato e loggato.');
                    return;
                }

                throw new Error('Utente non trovato. Controlla email o registrati.');
            }
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    };

    const register = async (email: string, password: string, name: string, role: string) => {
        // MOCK REGISTER
        setError(null);
        try {
            // Fake register in localStorage
            // ...
            alert("Registrazione temporaneamente disabilitata per debug");
        } catch (e: any) {
            setError(e.message);
        }
    };

    const logout = async () => {
        // await supabase.auth.signOut();
        setUser(null);
        localStorage.removeItem('inkflow_session');
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout, loading, error }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
