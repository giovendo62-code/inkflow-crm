import { useAuth } from '../../features/auth/AuthContext';
import { storage } from '../../lib/storage';
import { supabase } from '../../lib/supabase';
import { type Tenant } from '../../types';
import { LogOut, Bell, Building2, RotateCw, QrCode, X } from 'lucide-react';
import classes from './Header.module.css';
import QRCode from 'react-qr-code';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function Header() {
    const { user, logout } = useAuth();
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showQR, setShowQR] = useState(false);
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
                        event: '*',
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
                    aria-label="QR Code"
                    onClick={() => setShowQR(true)}
                    title="Mostra QR per aprire su mobile"
                >
                    <QrCode size={20} />
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

                <button onClick={logout} className={classes.logoutBtn} title="Sign Out"><LogOut size={18} /></button>
                {showQR && (
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: '#000000',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 9999
                        }}
                        onClick={() => setShowQR(false)}
                    >
                        <div
                            style={{
                                background: '#ffffff',
                                padding: '2rem',
                                borderRadius: '24px',
                                textAlign: 'center',
                                maxWidth: '400px',
                                position: 'relative',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setShowQR(false)}
                                style={{
                                    position: 'absolute',
                                    right: '1rem',
                                    top: '1rem',
                                    background: '#1f2937',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '36px',
                                    height: '36px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = '#ef4444')}
                                onMouseLeave={e => (e.currentTarget.style.background = '#1f2937')}
                            >
                                <X size={20} />
                            </button>
                            <h3 style={{ margin: '0 0 1.5rem 0', color: '#111827', fontSize: '1.5rem', fontWeight: 'bold' }}>
                                📱 Apri su Mobile
                            </h3>
                            <div
                                style={{
                                    background: '#ffffff',
                                    padding: '1.5rem',
                                    borderRadius: '16px',
                                    border: '4px solid #ffffff',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                                }}
                            >
                                <QRCode
                                    value="https://inkflow-crm-4bau.vercel.app/login"
                                    size={256}
                                    level="H"
                                    style={{ height: 'auto', maxWidth: '100%', width: '100%', display: 'block' }}
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
        </header>
    );
}
