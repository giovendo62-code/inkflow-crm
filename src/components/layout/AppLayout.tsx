import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../features/auth/AuthContext';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { Header } from './Header';
import classes from './Layout.module.css';

export function AppLayout() {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();
    const isCalendar = location.pathname === '/calendar';

    // Default fullscreen on calendar, normal on others
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        if (isCalendar) {
            setIsFullscreen(true);
        } else {
            setIsFullscreen(false);
        }
    }, [isCalendar]);

    if (loading) return <div>Loading...</div>;
    if (!isAuthenticated) return <Navigate to="/login" replace />;

    return (
        <div className={classes.layout}>
            {/* Show Sidebar unless in Fullscreen mode */}
            <div style={{ display: isFullscreen ? 'none' : 'block' }}>
                <Sidebar />
            </div>

            <div className={classes.mainWrapper}>
                {!isFullscreen && <Header />}
                <main className={classes.content} style={{ padding: isFullscreen ? '0' : undefined }}>
                    <Outlet />
                </main>
            </div>

            {/* Show MobileNav unless in Fullscreen mode */}
            <div style={{ display: isFullscreen ? 'none' : 'block' }}>
                <MobileNav />
            </div>

            {/* Toggle Button - Only visible on Calendar page */}
            {isCalendar && (
                <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    style={{
                        position: 'fixed',
                        bottom: isFullscreen ? '24px' : '90px', // Move up when nav is visible to avoid overlap with Home
                        left: '24px',
                        zIndex: 9999,
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-primary)',
                        color: 'white',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                    }}
                    title={isFullscreen ? "Mostra Menu" : "A tutto schermo"}
                >
                    {isFullscreen ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                    ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
                    )}
                </button>
            )}
        </div>
    );
}
