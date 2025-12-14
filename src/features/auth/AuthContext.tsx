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

            // The original code had a `data` object which is not defined here.
            // Assuming `foundUser` is the equivalent of `data.user` for the purpose of this edit.
            // If `foundUser` is null, it means login failed.
            if (!foundUser) throw new Error('Login failed: User not found.');

            // The original code had a `supabase` object which is not defined here.
            // Assuming the profile fetch is now integrated with `storage.getUsers()`
            // and `foundUser` already contains the full profile.
            // If `foundUser` is present, we proceed with password check and role check.

            // 2. Fetch Profile from 'users' table (This step is implicitly handled if `foundUser` is already a full User object)
            // If `foundUser` is just basic user info and a separate profile fetch is needed,
            // you would need to define `supabase` or a similar mechanism here.
            // For now, we assume `foundUser` is the complete profile.

            // If profile is missing (e.g., foundUser is null or incomplete), fail.
            if (!foundUser) { // This check is redundant due to the previous throw, but kept for clarity if logic changes.
                console.error('Profile not found for user:', email);
                throw new Error('User profile not found.');
            }

            // 3. Verify Password (if strictly enforcing stored password match)
            const storedPassword = (foundUser.profile as any)?.password;

            if (!storedPassword) {
                throw new Error("Account not configured (Password missing). Contact Manager.");
            }

            if (!password || storedPassword !== password) {
                throw new Error('Invalid password.');
            }

            // Role check
            if (requiredRole && foundUser.role !== requiredRole) {
                throw new Error(`Access denied. Required role: ${requiredRole}`);
            }

            // 4. Set Session
            const userWithRole = {
                ...foundUser,
                isAuthenticated: true
            };

            setUser(userWithRole);
            localStorage.setItem('inkflow_session', JSON.stringify(userWithRole));

        } catch (error: any) {
            console.error('Login error:', error);
            // STRICT MODE: No fallback to local storage.
            // If server login fails, we fail.
            setError(error.message);
            throw error;
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
            profile: {
                color: '#888888'
            }
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
