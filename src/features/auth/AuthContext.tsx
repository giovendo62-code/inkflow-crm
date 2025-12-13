import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { type User } from '../../types';
import { storage } from '../../lib/storage';
// import { supabase } from '../../lib/supabase'; // DISABILITATO PER DEBUG
// import { syncFromCloud } from '../../lib/sync'; // DISABILITATO PER DEBUG

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (email: string, password?: string, requiredRole?: string) => Promise<void>;
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

    const login = async (email: string, password?: string, requiredRole?: string) => {
        setError(null);
        try {
            console.log('⚠️ Usando Mock Login locale (Supabase Backed)');
            const users = await storage.getUsers();
            const normalizedEmail = email.trim().toLowerCase();
            const foundUser = users.find(u => u.email.toLowerCase() === normalizedEmail);

            if (foundUser) {
                if (requiredRole && foundUser.role !== requiredRole) {
                    throw new Error(`Login fallito: Questo account è di tipo ${foundUser.role}, ma hai selezionato ${requiredRole}.`);
                }

                setUser(foundUser);
                localStorage.setItem('inkflow_session', JSON.stringify(foundUser));
            } else {
                // AUTO-HEALING: Se l'utente manager demo è sparito, ricrealo al volo
                if (email === 'manager@inkflow.com') {
                    if (requiredRole && requiredRole !== 'MANAGER') {
                        throw new Error(`Login fallito: Account Manager non valido per ruolo ${requiredRole}.`);
                    }
                    const newManager = {
                        id: uuidv4(), // WAS: 'user-manager' causing UUID syntax error in DB
                        tenantId: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
                        email: 'manager@inkflow.com',
                        name: 'Marco Rossi',
                        role: 'MANAGER',
                        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marco',
                        profile: { bio: 'Manager', color: '#FF6B35' }
                    } as User;

                    await storage.saveUser(newManager);

                    setUser(newManager);
                    localStorage.setItem('inkflow_session', JSON.stringify(newManager));
                    console.log('✅ Utente Manager ricreato e loggato.');
                    return;
                }

                // AUTO-HEALING ARTISTA
                if (email === 'artist@inkflow.com') {
                    if (requiredRole && requiredRole !== 'ARTIST') {
                        throw new Error(`Login fallito: Account Artista non valido per ruolo ${requiredRole}.`);
                    }
                    const newArtist = {
                        id: uuidv4(),
                        tenantId: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
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

                    await storage.saveUser(newArtist);

                    setUser(newArtist);
                    localStorage.setItem('inkflow_session', JSON.stringify(newArtist));
                    console.log('✅ Utente Artista ricreato e loggato.');
                    return;
                }

                // AUTO-HEALING STUDENTE (PER TEST)
                if (email === 'student@inkflow.com') {
                    if (requiredRole && requiredRole !== 'STUDENT') {
                        throw new Error(`Login fallito: Account Studente non valido per ruolo ${requiredRole}.`);
                    }
                    const newStudent = {
                        id: uuidv4(),
                        tenantId: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
                        email: 'student@inkflow.com',
                        name: 'Luca Verdi',
                        role: 'STUDENT',
                        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luca',
                        profile: {
                            bio: 'Corsista Base',
                            color: '#4285F4'
                        }
                    } as User;

                    await storage.saveUser(newStudent);

                    setUser(newStudent);
                    localStorage.setItem('inkflow_session', JSON.stringify(newStudent));
                    console.log('✅ Utente Studente ricreato e loggato.');
                    return;
                }

                throw new Error('Utente non trovato. Controlla email o registrati.');
            }
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    };

    const register = async (email: string, password: string, name: string, _role: string) => {
        // MOCK REGISTER
        setError(null);
        try {
            if (_role === 'MANAGER') {
                const newTenantId = uuidv4();
                const newUser: User = {
                    id: uuidv4(),
                    tenantId: newTenantId,
                    email,
                    name,
                    role: 'MANAGER',
                    avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name.replace(' ', '')}`,
                    profile: {
                        bio: 'Studio Manager',
                        color: '#FF6B35'
                    }
                };

                // Tenta il salvataggio su Cloud (Supabase)
                try {
                    await storage.saveUser(newUser);
                } catch (err) {
                    console.error("Supabase Save Failed, fallback to LocalStorage", err);
                    alert("⚠️ Attenzione: Impossibile salvare sul Cloud (Chiavi errate?). L'account sarà salvato solo LOCALE su questo dispositivo.");
                }

                // AUTO-LOGIN IMMEDIATO (Funziona sempre, anche offline)
                setUser(newUser);
                localStorage.setItem('inkflow_session', JSON.stringify(newUser));

                console.log('✅ Nuovo Manager registrato e loggato automaticamente:', newUser);
            } else {
                throw new Error("Solo i Manager possono registrarsi pubblicamente. Contatta il tuo studio per gli altri ruoli.");
            }
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
