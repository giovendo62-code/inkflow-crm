import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { Header } from './Header';
import classes from './Layout.module.css';

export function AppLayout() {
    const { isAuthenticated, loading } = useAuth();

    if (loading) return <div>Loading...</div>;
    if (!isAuthenticated) return <Navigate to="/login" replace />;

    return (
        <div className={classes.layout}>
            <Sidebar />
            <div className={classes.mainWrapper}>
                <Header />
                <main className={classes.content}>
                    <Outlet />
                </main>
            </div>
            <MobileNav />
        </div>
    );
}
