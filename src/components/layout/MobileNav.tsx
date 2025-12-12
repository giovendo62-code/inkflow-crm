import { NavLink } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import {
    LayoutDashboard,
    Calendar,
    Users,
    MessageSquare,
    FileText,
    Settings,
    GraduationCap,
    MoreHorizontal
} from 'lucide-react';
import classes from './MobileNav.module.css';

export function MobileNav() {
    const { user } = useAuth();
    const isStudent = user?.role === 'STUDENT';

    // Items for Student
    const studentItems = [
        { label: 'Home', path: '/', icon: LayoutDashboard },
        { label: 'Presenze', path: '/attendance', icon: Calendar },
        { label: 'Materiali', path: '/materials', icon: FileText },
    ];

    // Items for Manager/Artist
    const managerItems = [
        { label: 'Home', path: '/', icon: LayoutDashboard },
        { label: 'Agenda', path: '/calendar', icon: Calendar },
        { label: 'Clienti', path: '/clients', icon: Users },
        { label: 'Chat', path: '/chat', icon: MessageSquare },
        { label: 'Altro', path: '/settings', icon: MoreHorizontal },
    ];

    const items = isStudent ? studentItems : managerItems;

    return (
        <nav className={classes.mobileNav}>
            {items.map((item) => (
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
