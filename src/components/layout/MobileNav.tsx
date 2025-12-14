import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import {
    LayoutDashboard,
    Calendar,
    Users,
    MessageSquare,
    FileText,
    Settings,
    GraduationCap,
    MoreHorizontal,
    DollarSign,
    Palette,
    Send,
    X
} from 'lucide-react';
import classes from './MobileNav.module.css';

export function MobileNav() {
    const { user } = useAuth();
    const location = useLocation();
    const [showMoreMenu, setShowMoreMenu] = useState(false);

    const isManager = user?.role === 'MANAGER';
    const isStudent = user?.role === 'STUDENT';

    if (isStudent) {
        // Simple list for students
        const studentItems = [
            { label: 'Home', path: '/', icon: LayoutDashboard },
            { label: 'Presenze', path: '/attendance', icon: Calendar },
            { label: 'Materiali', path: '/materials', icon: FileText },
        ];

        return (
            <nav className={classes.mobileNav}>
                {studentItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `${classes.item} ${isActive ? classes.active : ''}`
                        }
                    >
                        <item.icon />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>
        );
    }

    // Full list for Manager/Artist
    const allItems = [
        { label: 'Home', path: '/', icon: LayoutDashboard, main: true },
        { label: 'Agenda', path: '/calendar', icon: Calendar, main: true },
        { label: 'Chat', path: '/chat', icon: MessageSquare, main: true },
        { label: 'Clienti', path: '/clients', icon: Users, main: true },

        // Secondary items
        { label: 'Finanze', path: '/financials', icon: DollarSign, main: false },
        { label: 'Consensi', path: '/consents', icon: FileText, main: false },
        { label: 'Artisti', path: '/artists', icon: Palette, visible: isManager, main: false },
        { label: 'Promo', path: '/promotions', icon: Send, visible: isManager, main: false },
        { label: 'Academy', path: '/academy', icon: GraduationCap, visible: isManager, main: false },
        { label: 'Settings', path: '/settings', icon: Settings, main: false },
    ];

    const mainItems = allItems.filter(i => i.main && (i.visible !== false));
    const moreItems = allItems.filter(i => !i.main && (i.visible !== false));
    const isMoreActive = moreItems.some(item => location.pathname.startsWith(item.path));

    return (
        <>
            {/* More Menu Overlay */}
            {showMoreMenu && (
                <div
                    style={{
                        position: 'fixed',
                        bottom: '70px', // Above navbar
                        left: '10px',
                        right: '10px',
                        backgroundColor: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '1rem',
                        boxShadow: '0 -4px 20px rgba(0,0,0,0.2)',
                        zIndex: 100,
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '1rem'
                    }}
                >
                    <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 'bold' }}>Altre Opzioni</span>
                        <button onClick={() => setShowMoreMenu(false)} style={{ background: 'none', border: 'none', padding: '4px' }}>
                            <X size={20} />
                        </button>
                    </div>

                    {moreItems.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => setShowMoreMenu(false)}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '0.5rem',
                                textDecoration: 'none',
                                color: 'var(--color-text-secondary)',
                                fontSize: '0.75rem',
                                textAlign: 'center'
                            }}
                            className={({ isActive }) => isActive ? classes.active : ''}
                        >
                            <div style={{
                                padding: '0.75rem',
                                background: 'var(--color-surface-hover)',
                                borderRadius: 'var(--radius-md)',
                                color: 'inherit'
                            }}>
                                <item.icon size={24} />
                            </div>
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </div>
            )}

            {/* Bottom Nav */}
            <nav className={classes.mobileNav}>
                {mainItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setShowMoreMenu(false)}
                        className={({ isActive }) =>
                            `${classes.item} ${isActive ? classes.active : ''}`
                        }
                    >
                        <item.icon />
                        <span>{item.label}</span>
                    </NavLink>
                ))}

                {/* More Button */}
                <button
                    onClick={() => setShowMoreMenu(!showMoreMenu)}
                    className={`${classes.item} ${showMoreMenu || isMoreActive ? classes.active : ''}`}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                    <MoreHorizontal />
                    <span>Altro</span>
                </button>
            </nav>
        </>
    );
}
