import { useAuth } from '../../features/auth/AuthContext';
import { storage } from '../../lib/storage';
import { type Tenant } from '../../types';
import { LogOut, Bell, Building2 } from 'lucide-react';
import classes from './Header.module.css';
import { useState, useEffect } from 'react';

export function Header() {
    const { user, logout } = useAuth();
    const [tenant, setTenant] = useState<Tenant | null>(null);

    useEffect(() => {
        const loadTenant = async () => {
            const tenants = await storage.getTenants();
            if (tenants.length > 0) {
                const currentTenant = tenants.find(t => t.id === user?.tenantId) || tenants[0];
                setTenant(currentTenant);
            }
        };
        loadTenant();
    }, [user]);

    return (
        <header className={classes.header}>
            {/* Studio Branding */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {tenant?.logo ? (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.5rem 1rem',
                        background: 'var(--color-surface)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)'
                    }}>
                        <img
                            src={tenant.logo}
                            alt={tenant.name}
                            style={{
                                height: '32px',
                                maxWidth: '120px',
                                objectFit: 'contain'
                            }}
                        />
                        <div style={{
                            borderLeft: '1px solid var(--color-border)',
                            paddingLeft: '0.75rem',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            <span style={{
                                fontSize: '0.7rem',
                                color: 'var(--color-text-muted)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>
                                Studio
                            </span>
                            <span style={{
                                fontSize: '0.9rem',
                                fontWeight: '600',
                                color: 'var(--color-text-primary)'
                            }}>
                                {tenant.name}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        background: 'var(--color-surface)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)'
                    }}>
                        <Building2 size={24} style={{ color: 'var(--color-primary)' }} />
                        <div>
                            <div style={{
                                fontSize: '0.7rem',
                                color: 'var(--color-text-muted)',
                                textTransform: 'uppercase'
                            }}>
                                Studio
                            </div>
                            <div style={{
                                fontSize: '0.9rem',
                                fontWeight: '600'
                            }}>
                                {tenant?.name || 'InkFlow Studio'}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* User Info */}
            <h2 className={classes.pageTitle}>Dashboard</h2>

            <div className={classes.actions}>
                <button className={classes.iconBtn} aria-label="Notifications">
                    <Bell size={20} />
                    <span className={classes.badge}>2</span>
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
