import { useAuth } from '../../features/auth/AuthContext';
import { storage } from '../../lib/storage';
import { supabase } from '../../lib/supabase';
import { type Tenant } from '../../types';
import { LogOut, Bell, Building2, RotateCw } from 'lucide-react';
import classes from './Header.module.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function Header() {
    const { user, logout } = useAuth();
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        const loadTenant = async () => {
            const tenants = await storage.getTenants();
            if (tenants.length > 0) {
                const currentTenant = tenants.find(t => t.id === user?.tenantId) || tenants[0];
                setTenant(currentTenant);
            }
        };

        const checkUnread = async () => {
            if (user?.tenantId) {
                const count = await storage.getUnreadMessagesCount(user.tenantId, user.id);
                setUnreadCount(count);
            }
        };

        loadTenant();
        checkUnread();

        // Poll fallback
        const interval = setInterval(checkUnread, 30000);

        // Realtime Subscription
        let subscription: any;
        if (user?.tenantId) {
            subscription = supabase
                .channel(`header-notifications-${user.tenantId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'messages',
                        filter: `tenant_id=eq.${user.tenantId}`
                    },
                    () => {
                        console.log("🔔 New Message Notification!");
                        checkUnread();
                    }
                )
                .subscribe();
        }

        return () => {
            clearInterval(interval);
            if (subscription) subscription.unsubscribe();
        };
    }, [user]);

    return (
        <header className={classes.header}>
            {/* Studio Branding */}
            {/* Studio Branding - Mobile Only */}
            <div className={classes.studioBranding}>
                {tenant?.logo ? (
                    <img
                        src={tenant.logo}
                        alt={tenant.name}
                        style={{
                            height: '42px', // Bigger logo
                            maxWidth: '140px',
                            objectFit: 'contain',
                            borderRadius: '4px'
                        }}
                    />
                ) : (
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold'
                    }}>
                        <Building2 size={20} />
                    </div>
                )}


            </div>

            {/* Title - Hidden on small mobile via CSS to save space for logo */}
            <h2 className={classes.pageTitle}>
                Dashboard
            </h2>

            <div className={classes.actions}>
                <button
                    className={classes.iconBtn}
                    aria-label="Refresh App"
                    onClick={() => window.location.reload()}
                    title="Aggiorna App"
                >
                    <RotateCw size={20} />
                </button>
                <button
                    className={classes.iconBtn}
                    aria-label="Notifications"
                    onClick={() => navigate('/chat')}
                >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                        <span className={classes.badge}>{unreadCount}</span>
                    )}
                </button>

                <div className={classes.separator} />

                <div className={classes.user}>
                    <div className={classes.avatar}>
                        {user?.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.name} />
                        ) : (
                            <div className={classes.avatarPlaceholder}>{user?.name[0]}</div>
                        )}
                    </div>
                    <div className={classes.userInfo}>
                        <span className={classes.userName}>{user?.name}</span>
                        <span className={classes.userRole}>{user?.role}</span>
                    </div>
                </div>

                <button onClick={logout} className={classes.logoutBtn} title="Sign Out">
                    <LogOut size={18} />
                </button>
            </div>
        </header>
    );
}
