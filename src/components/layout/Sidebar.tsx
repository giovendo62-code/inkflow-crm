import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { storage } from '../../lib/storage';
import { type Tenant } from '../../types';
import {
    LayoutDashboard,
    Calendar,
    Users,
    Palette,
    DollarSign,
    Settings,
    MessageSquare,
    FileText,
    Send,
    GraduationCap,
    Clock,
    LogOut
} from 'lucide-react';
import classes from './Sidebar.module.css';
import { cn } from '../../lib/utils';

export function Sidebar() {
    const { user, logout } = useAuth();
    const isManager = user?.role === 'MANAGER';
    const isStudent = user?.role === 'STUDENT';
    const [tenant, setTenant] = useState<Tenant | null>(null);

    const handleLogout = () => {
        logout();
    };

    useEffect(() => {
        const loadTenant = async () => {
            const tenants = await storage.getTenants();
            if (tenants.length > 0) {
                // Find user's tenant or fallback to first
                const currentTenant = tenants.find(t => t.id === user?.tenantId) || tenants[0];
                setTenant(currentTenant);

                // Apply theme if exists
                if (currentTenant.theme?.primaryColor) {
                    document.documentElement.style.setProperty('--color-primary', currentTenant.theme.primaryColor);
                }

                // Apply color mode
                if (currentTenant.theme?.colorMode === 'light') {
                    document.documentElement.style.setProperty('--color-background', '#F5F5F5');
                    document.documentElement.style.setProperty('--color-surface', '#FFFFFF');
                    document.documentElement.style.setProperty('--color-surface-hover', '#F0F0F0');
                    document.documentElement.style.setProperty('--color-text-primary', '#1A1A1A');
                    document.documentElement.style.setProperty('--color-text-secondary', '#666666');
                    document.documentElement.style.setProperty('--color-text-muted', '#999999');
                    document.documentElement.style.setProperty('--color-border', '#E0E0E0');
                }
            }
        };
        loadTenant();
    }, [user]); // Re-run if user changes

    // Menu items for Students
    const studentNavItems = [
        { label: 'Dashboard', path: '/', icon: LayoutDashboard, visible: true },
        { label: 'Calendario Presenze', path: '/attendance', icon: Calendar, visible: true },
        { label: 'I Miei Materiali', path: '/materials', icon: FileText, visible: true },
    ];

    // Menu items for Manager & Artists
    const navItems = [
        { label: 'Dashboard', path: '/', icon: LayoutDashboard, visible: true },
        { label: 'Calendar', path: '/calendar', icon: Calendar, visible: true },
        { label: 'Clients', path: '/clients', icon: Users, visible: true }, // Artists can see clients too
        { label: 'Waitlist', path: '/waitlist', icon: Clock, visible: isManager }, // Manager only
        { label: 'Chat & News', path: '/chat', icon: MessageSquare, visible: true }, // New
        { label: 'Consents', path: '/consents', icon: FileText, visible: true }, // New
        { label: 'Artists', path: '/artists', icon: Palette, visible: isManager },
        { label: 'Financials', path: '/financials', icon: DollarSign, visible: true }, // Artist sees limited view
        { label: 'Promotions', path: '/promotions', icon: Send, visible: isManager }, // New - Manager only
        { label: 'Academy', path: '/academy', icon: GraduationCap, visible: isManager }, // New - Manager only
        { label: 'Settings', path: '/settings', icon: Settings, visible: isManager },
    ];

    const menuItems = isStudent ? studentNavItems : navItems;

    const sidebarStyle = tenant?.theme?.sidebarStyle || 'dark';
    const colorMode = tenant?.theme?.colorMode || 'dark';

    const getSidebarBackground = () => {
        if (colorMode === 'light') {
            switch (sidebarStyle) {
                case 'light': return '#E8E8E8';
                case 'colored': return tenant?.theme?.primaryColor || '#FF6B35';
                default: return '#FFFFFF';
            }
        } else {
            switch (sidebarStyle) {
                case 'light': return '#2A2A2A';
                case 'colored': return tenant?.theme?.primaryColor || '#FF6B35';
                default: return '#0A0A0A';
            }
        }
    };

    return (
        <aside
            className={classes.sidebar}
            style={{ background: getSidebarBackground() }}
            data-light-mode={colorMode === 'light'}
        >
            <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                {tenant?.logo ? (
                    <img
                        src={tenant.logo}
                        alt={tenant.name}
                        style={{
                            width: '96px',
                            height: '96px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '3px solid var(--color-primary)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                        }}
                    />
                ) : (
                    <div style={{
                        width: '96px',
                        height: '96px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2.5rem',
                        fontWeight: 'bold',
                        color: 'white',
                        border: '3px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                    }}>
                        {tenant?.name?.charAt(0).toUpperCase() || 'I'}
                    </div>
                )}
                <span style={{
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    textAlign: 'center',
                    lineHeight: '1.2',
                    letterSpacing: '0.02em'
                }}>
                    {tenant?.name || 'InkFlow Studio'}
                </span>
            </div>

            <nav className={classes.nav}>
                {menuItems.filter(item => item.visible).map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => cn(classes.link, isActive && classes.active)}
                    >
                        <item.icon size={20} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
                <button
                    onClick={handleLogout}
                    className={classes.link}
                    style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--color-error)', marginTop: 'auto' }}
                >
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </nav>

            <div style={{
                padding: '1rem',
                borderTop: '1px solid var(--color-border)',
                fontSize: '0.7rem',
                color: 'var(--color-text-muted)',
                textAlign: 'center'
            }}>
                InkFlow CRM v2.7
            </div>
        </aside>
    );
}
