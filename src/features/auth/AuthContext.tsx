import React, { createContext, useContext, useState, useEffect } from 'react';
import { type User, type UserRole } from '../../types';
import { storage } from '../../lib/storage';
import { supabase } from '../../lib/supabase'; // Ensure this import exists

// --- HELPER: UUID SICURO (No dipendenze esterne) ---
const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    const d = Date.now();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (d + Math.random() * 16) % 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
};

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (email: string, password?: string, requiredRole?: UserRole) => Promise<void>;
    register: (email: string, password: string, name: string, role: string) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
    loading: boolean;
    error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- INIT: Carica sessione locale all'avvio ---
    useEffect(() => {
        const initAuth = async () => {
            try {
                const stored = localStorage.getItem('inkflow_session');
                if (stored) {
                    const parsedUser = JSON.parse(stored);
                    setUser(parsedUser);
                    console.log('🔄 Sessione locale ripristinata:', parsedUser.email);

                    // Verify and refresh from DB to get latest profile (e.g. contract changes)
                    try {
                        const users = await storage.getUsers();
                        const freshUser = users.find(u => u.id === parsedUser.id);
                        if (freshUser) {
                            console.log('🔄 Dati utente aggiornati dal DB');
                            setUser(freshUser);
                            localStorage.setItem('inkflow_session', JSON.stringify(freshUser));
                        } else {
                            // User deleted or invalid?
                            console.warn('Utente non trovato nel DB, logout forzato.');
                            // localStorage.removeItem('inkflow_session');
                            // setUser(null); 
                        }
                    } catch (dbError) {
                        console.error('Errore refresh utente background:', dbError);
                    }
                }
            } catch (e) {
                console.error('Session restore failed', e);
                localStorage.removeItem('inkflow_session');
            } finally {
                setLoading(false);
            }
        };
        initAuth();
    }, []);

    // --- LOGIN ---
    const login = async (email: string, password?: string, requiredRole?: UserRole) => {
        setLoading(true);
        setError(null);
        try {
            console.log(`🔐 Login attempt: ${email}`);

            // 1. Cerca Utente nel DB (Cloud)
            // Usiamo storage.getUsers che fa la query su 'users'
            const users = await storage.getUsers();
            const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

            if (!foundUser) {
                throw new Error('Utente non trovato.');
            }

            // 2. Strict Password Check
            // La password è nel profilo (come da design attuale)
            const storedPassword = (foundUser.profile as any)?.password;

            if (!storedPassword) {
                // Fallback: se non c'è nel profilo, forse è un operatore vecchio o demo
                // Per sicurezza, se non c'è password, neghiamo accesso in Strict Mode
                throw new Error("Password non impostata per questo utente. Contatta l'amministratore.");
            }

            if (!password || storedPassword !== password) {
                throw new Error("Password errata.");
            }

            // 3. Verifica Ruolo
            if (requiredRole && foundUser.role !== requiredRole) {
                throw new Error(`Accesso negato. Ruolo richiesto: ${requiredRole}`);
            }

            // 4. Set Session
            const userWithRole = {
                ...foundUser,
                isAuthenticated: true
            };

            setUser(userWithRole);
            try {
                localStorage.setItem('inkflow_session', JSON.stringify(userWithRole));
            } catch (e: any) {
                console.warn('Storage Quota Exceeded. Attempting cleanup...', e);
                try {
                    localStorage.clear(); // Emergency cleanup
                    localStorage.setItem('inkflow_session', JSON.stringify(userWithRole));
                } catch (retryError) {
                    console.error('Unable to persist session to LocalStorage. User will be logged out on refresh.', retryError);
                }
            }

        } catch (error: any) {
            console.error('Login error:', error);
            setError(error.message);
            throw error; // Rilancia per gestire l'UI (es. mostrare alert)
        } finally {
            setLoading(false);
        }
    };

    // --- REGISTER (Solo Manager) ---
    const register = async (email: string, password: string, name: string, role: string) => {
        setLoading(true);
        setError(null);

        try {
            console.log(`📝 Registering: ${email} (${role})`);

            if (role !== 'MANAGER') {
                throw new Error("Solo i Manager possono registrarsi da qui.");
            }

            // check esistenza email
            try {
                const existingUsers = await storage.getUsers();
                if (existingUsers.some(u => u.email.toLowerCase() === email.toLowerCase())) {
                    throw new Error("Questa email è già registrata.");
                }
            } catch (err) {
                // Ignore error checking users, maybe connection issue or table empty
            }

            // 1. IDs
            const tenantId = generateUUID();
            const userId = generateUUID();

            const newUser: User = {
                id: userId,
                tenantId: tenantId,
                email,
                name,
                role: 'MANAGER',
                avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
                createdAt: new Date().toISOString(),
                profile: {
                    bio: 'Manager',
                    phone: '',
                    address: '',
                    password: password,
                    preferences: {
                        theme: 'dark',
                        notifications: true,
                        password: password
                    },
                    color: '#7C3AED' // Default color
                }
            };

            // 2. CREATE TENANT FIRST (Crucial for Foreign Key)
            const { error: tenantError } = await supabase
                .from('tenants')
                .insert({
                    id: tenantId,
                    name: `Studio di ${name}`,
                    created_at: new Date().toISOString()
                });

            if (tenantError) {
                console.error("Tenant creation failed:", tenantError);
                throw new Error("Errore creazione Studio: " + tenantError.message);
            }

            // 3. CREATE USER
            await storage.saveUser(newUser);

            // 4. Auto-Login
            await login(email, password);

        } catch (error: any) {
            console.error('Registration failed:', error);
            setError(error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('inkflow_session');
        // Opzionale: supabase.auth.signOut() se usassimo auth nativa
    };

    const refreshUser = async () => {
        if (!user) return;

        try {
            const users = await storage.getUsers();
            const updatedUser = users.find(u => u.id === user.id);

            if (updatedUser) {
                setUser(updatedUser);
                localStorage.setItem('inkflow_session', JSON.stringify(updatedUser));
            }
        } catch (error) {
            console.error('Failed to refresh user:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout, refreshUser, loading, error }}>
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
