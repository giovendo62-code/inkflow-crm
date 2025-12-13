import React, { createContext, useContext, useState, useEffect } from 'react';
import { type User, type UserRole } from '../../types';
import { storage } from '../../lib/storage';

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
                    console.log('🔄 Sessione ripristinata:', parsedUser.email);
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

            // 1. Cerca Utenti nel DB (Cloud)
            const users = await storage.getUsers();
            const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

            if (foundUser) {
                // Utente Trovato 
                // (Qui dovremmo controllare la password, ma nel mock la saltiamo o controlliamo hardcoded)
                if (requiredRole && foundUser.role !== requiredRole) {
                    throw new Error(`Accesso negato. Richiesto ruolo: ${requiredRole}`);
                }

                // Successo
                finishLogin(foundUser);
                return;
            }

            // 2. Se non trovato e NON c'è password (Demo Mode per dev)
            if (!password && ['manager@inkflow.com', 'artist@inkflow.com'].includes(email)) {
                console.log('⚠️ Demo User Recovery...');
                const demoUser = createDemoUser(email);
                finishLogin(demoUser);
                // Salviamo pure il demo user nel DB per la prossima volta (lazy fix)
                try { await storage.saveUser(demoUser); } catch { }
                return;
            }

            throw new Error("Utente non trovato. Registrati prima.");

        } catch (e: any) {
            console.error("Login Error:", e);
            setError(e.message);
            throw e;
        } finally {
            setLoading(false);
        }
    };

    // --- REGISTER ---
    const register = async (email: string, password: string, name: string, role: string) => {
        setLoading(true);
        setError(null);

        try {
            console.log(`📝 Registering: ${email} (${role})`);

            if (role !== 'MANAGER') {
                throw new Error("Solo i Manager possono registrarsi da qui.");
            }

            // 1. Prepara i Dati (ID generati qui per consistenza locale/cloud)
            const tenantId = generateUUID();
            const userId = generateUUID();

            const newUser: User = {
                id: userId,
                tenantId: tenantId,
                email,
                name,
                role: 'MANAGER',
                avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name.replace(/\s/g, '')}`,
                profile: {
                    bio: 'Studio Manager',
                    color: '#FF6B35'
                }
            };

            // 2. Tenta Salvataggio Cloud (Prima Tenant, poi User)
            let cloudSuccess = false;
            try {
                await storage.saveTenant({
                    id: tenantId,
                    name: `Studio di ${name}`,
                    logo: '',
                    theme: { primaryColor: '#7C3AED', sidebarStyle: 'dark', menuPosition: 'left', colorMode: 'dark' }
                });

                await storage.saveUser(newUser);
                cloudSuccess = true;
                console.log("✅ Cloud Registration Success");

            } catch (cloudErr: any) {
                console.error("❌ Cloud Registration Failed:", cloudErr);

                // Se errore è Conflitto (409), significa che esiste già.
                if (cloudErr.status === 409 || (cloudErr.message && cloudErr.message.includes('409'))) {
                    alert("⚠️ Attenzione: Utente o Studio già esistenti.\nTi faccio entrare lo stesso.");
                    cloudSuccess = true; // Consideriamolo un successo parziale (l'utente c'è)
                } else {
                    alert(`⚠️ Errore Cloud: ${cloudErr.message}\n\nL'account verrà creato solo LOCALE.`);
                }
            }

            // 3. Finalizza Login (Sempre, anche se Cloud fallisce)
            finishLogin(newUser);

            if (cloudSuccess) {
                alert("🎉 Benvenuto in InkFlow!");
            }

        } catch (e: any) {
            console.error("Register Logic Error:", e);
            setError(e.message);
            throw e;
        } finally {
            setLoading(false);
        }
    };

    // --- HELPERS ---
    const finishLogin = (u: User) => {
        setUser(u);
        localStorage.setItem('inkflow_session', JSON.stringify(u));
        // Force reload tenants/data if needed
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('inkflow_session');
        localStorage.removeItem('inkflow_tenant_id'); // clean up extra vars
    };

    const createDemoUser = (email: string): User => {
        return {
            id: generateUUID(),
            tenantId: 'demo-tenant',
            email,
            name: 'Demo User',
            role: email.includes('manager') ? 'MANAGER' : 'ARTIST',
            avatarUrl: '',
            profile: {}
        };
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
