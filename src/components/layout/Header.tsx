import { useAuth } from '../../features/auth/AuthContext';
import { storage } from '../../lib/storage';
import { type Tenant } from '../../types';
import { LogOut, Bell, Building2 } from 'lucide-react';
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
                const count = await storage.getUnreadMessagesCount(user.tenantId);
                setUnreadCount(count);
            }
        };

        loadTenant();
        checkUnread();

        // Poll for unread messages every 30 seconds
        const interval = setInterval(checkUnread, 30000);
        return () => clearInterval(interval);
    }, [user]);

    return (
        <header className={classes.header}>
            {/* Studio Branding */}
            {/* Studio Branding - Cleaner & Bigger for Mobile */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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

                <div className={classes.brandText}>
                    <span style={{
                        fontSize: '1rem',
                        fontWeight: '700',
                        color: 'var(--color-text-primary)'
                    }}>
                        {tenant?.name || 'InkFlow'}
                    </span>
                    <span style={{
                        fontSize: '0.7rem',
                        color: 'var(--color-text-muted)',
                        textTransform: 'capitalize'
                    }}>
                        Studio Workspace
                    </span>
                </div>
            </div>

            {/* Title - Hidden on small mobile via CSS to save space for logo */}
            <h2 className={classes.pageTitle}>
                Dashboard
            </h2>

            <div className={classes.actions}>
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
