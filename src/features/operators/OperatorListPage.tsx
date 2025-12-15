import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { storage } from '../../lib/storage';
import { type User, type UserRole } from '../../types';
import { Plus, User as UserIcon, X, MessageCircle, Pencil, Trash2 } from 'lucide-react';
import classes from '../crm/ClientListPage.module.css'; // Reusing styles
import { useAuth } from '../auth/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { initGoogleCalendar, loginToGoogleCalendar, listGoogleCalendars, listGoogleCalendarEvents } from '../../lib/googleCalendar';

export function OperatorListPage() {
    const navigate = useNavigate();
    const { user } = useAuth(); // Get current user for tenantId
    const [users, setUsers] = useState<User[]>([]);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [createdCredentials, setCreatedCredentials] = useState<{ email: string, password: string } | null>(null);

    // Google Calendar State
    const [googleCalendars, setGoogleCalendars] = useState<any[]>([]);
    const [googleInitStatus, setGoogleInitStatus] = useState<{ status: 'idle' | 'loading' | 'success' | 'error'; message: string }>({ status: 'idle', message: '' });

    const [formData, setFormData] = useState<Partial<User>>({
        role: 'ARTIST',
        profile: { color: '#FF6B35', bio: '', taxId: '', address: '', commissionRate: 50, googleCalendarConnected: false }
    });

    const fetchCalendars = async (token: string) => {
        try {
            const data = await listGoogleCalendars(token);
            setGoogleCalendars(data.items || []);
        } catch (err) {
            console.error("Failed to list calendars:", err);
            // If token invalid, maybe clear it? For now just log.
        }
    };

    const initialized = useRef(false);

    // Initialize Google Calendar
    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        const init = async () => {
            setGoogleInitStatus({ status: 'loading', message: 'Inizializzazione Google...' });

            // Check for existing token
            const existingToken = localStorage.getItem('google_access_token');
            if (existingToken) {
                fetchCalendars(existingToken);
            }

            const result = await initGoogleCalendar((response: any) => {
                if (response.access_token) {
                    console.log("Google Auth Success, Access Token:", response.access_token);
                    localStorage.setItem('google_access_token', response.access_token);
                    setGoogleInitStatus({ status: 'success', message: 'Connesso!' });
                    fetchCalendars(response.access_token);
                }
            });

            if (result.success) {
                setGoogleInitStatus({ status: 'success', message: 'Google Pronto' });
            } else {
                setGoogleInitStatus({ status: 'error', message: result.error || 'Errore sconosciuto' });
            }
        };
        init();
    }, []);

    useEffect(() => {
        const loadUsers = async () => {
            if (!user?.tenantId) return;
            try {
                // Pass tenantId to filter users
                const allUsers = await storage.getUsers(user.tenantId);
                // Mostra solo ARTIST, nascondi MANAGER e STUDIER
                const staff = allUsers.filter(u => u.role === 'ARTIST');
                setUsers(staff);
            } catch (error) {
                console.error("Failed to load users:", error);
            }
        };
        loadUsers();
    }, [user?.tenantId]);

    const handleOpenAddModal = () => {
        setEditMode(false);
        setCurrentUserId(null);
        setFormData({
            role: 'ARTIST',
            profile: { color: '#FF6B35', bio: '', taxId: '', address: '', commissionRate: 50, googleCalendarConnected: false }
        });
        setCreatedCredentials(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (user: User) => {
        setEditMode(true);
        setCurrentUserId(user.id);

        // Migrate legacy 'COMMISSION' contractType to new system
        let migratedProfile = { ...user.profile };
        if (user.profile?.contractType === 'COMMISSION') {
            migratedProfile = {
                ...user.profile,
                contractType: undefined, // Remove old COMMISSION type
                commissionRate: user.profile.commissionRate || 50
            };
        }

        setFormData({
            ...user,
            profile: {
                ...migratedProfile,
                commissionRate: migratedProfile.commissionRate || 0
            }
        });
        setCreatedCredentials(null); // Fix: Ensure credentials overlay is hidden
        setIsModalOpen(true);
    };

    const handleImportFromGoogle = async () => {
        const token = localStorage.getItem('google_access_token');
        const calendarId = formData.profile?.googleCalendarId;

        if (!token || !calendarId) {
            alert("Assicurati di essere connesso a Google e di aver selezionato un calendario.");
            return;
        }

        if (!confirm("Vuoi importare gli appuntamenti da Google Calendar? Verranno importati gli eventi dei prossimi 6 mesi.")) {
            return;
        }

        setGoogleInitStatus({ status: 'loading', message: 'Importazione in corso...' });

        try {
            const timeMin = new Date().toISOString(); // From Now
            const timeMax = new Date();
            timeMax.setMonth(timeMax.getMonth() + 6); // +6 Months

            const data = await listGoogleCalendarEvents(token, calendarId, timeMin, timeMax.toISOString());
            const events = data.items || [];

            if (events.length === 0) {
                alert("Nessun evento trovato su Google Calendar nel periodo selezionato.");
                setGoogleInitStatus({ status: 'success', message: 'Nessun evento da importare.' });
                return;
            }

            // 1. Ensure we have a generic client for Google Imports
            const allClients = await storage.getClients(user!.tenantId);
            let googleClient = allClients.find(c => c.email === 'google-import@inkflow.com');

            if (!googleClient) {
                // Create dummy client
                const newClient: any = {
                    id: uuidv4(),
                    tenantId: user!.tenantId,
                    firstName: 'Google',
                    lastName: 'Calendar Import',
                    email: 'google-import@inkflow.com',
                    phone: '',
                    preferences: { styles: [] },
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                await storage.saveClient(newClient);
                googleClient = newClient;
            }

            // 2. Fetch existing appointments to avoid duplicates
            const allAppointments = await storage.getAppointments(user!.tenantId);
            // We are editing a user or creating one?
            // If creating (editMode=false), we don't have an ID yet!
            // We can only import if we have an Artist ID.
            // If creating, we must save first?
            // Actually, we can generate the ID `userToSave.id` is available in `handleSubmit`.
            // But here we are in `handleImport`.

            // If !editMode, we don't know the ID yet. We should force user to save first?
            // Or use the ID we are about to create?
            // The `formData` doesn't have ID.

            // Let's restrict import to Edit Mode only for safety, or generate ID if allowed.
            // But if we generate ID here, we must ensure `handleSubmit` uses the SAME ID.
            // Currently `handleSubmit` generates `uuidv4()` on the fly if not editMode.

            // Allow import only in Edit Mode.
            if (!editMode || !currentUserId) {
                alert("Salva prima l'operatore per importare gli appuntamenti.");
                setGoogleInitStatus({ status: 'idle', message: '' });
                return;
            }

            const artistId = currentUserId;

            let importedCount = 0;

            for (const event of events) {
                if (!event.start?.dateTime) continue; // Skip all-day events for now if they have date only

                const start = new Date(event.start.dateTime).toISOString();
                const end = new Date(event.end.dateTime || event.start.dateTime).toISOString();

                // Check overlap
                const isDuplicate = allAppointments.some(appt =>
                    appt.artistId === artistId &&
                    appt.startTime === start &&
                    appt.title === (event.summary || 'Evento Google')
                );

                if (isDuplicate) continue;

                const newAppt: any = {
                    id: uuidv4(),
                    tenantId: user!.tenantId,
                    clientId: googleClient!.id,
                    artistId: artistId,
                    title: event.summary || 'Evento Google',
                    description: event.description || 'Importato da Google Calendar',
                    startTime: start,
                    endTime: end,
                    status: 'CONFIRMED',
                    financials: { depositPaid: false },
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                await storage.saveAppointment(newAppt);
                importedCount++;
            }

            alert(`Importazione completata! ${importedCount} appuntamenti aggiunti.`);
            setGoogleInitStatus({ status: 'success', message: 'Importazione Riuscita!' });

        } catch (error: any) {
            console.error("Import failed:", error);
            alert("Errore importazione: " + error.message);
            setGoogleInitStatus({ status: 'error', message: 'Errore Importazione' });
        }
    };

    const handleDeleteUser = async (e: React.MouseEvent, userId: string) => {
        e.stopPropagation();
        if (confirm('Sei sicuro di voler eliminare questo operatore?')) {
            try {
                await storage.deleteUser(userId);
                const updatedUsers = users.filter(u => u.id !== userId);
                setUsers(updatedUsers);
            } catch (error) {
                console.error("Failed to delete user:", error);
                alert("Errore durante l'eliminazione dell'operatore");
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user?.tenantId) {
            alert("Errore: Tenant ID non trovato. Riprova a fare login.");
            return;
        }

        // Prepare new or updated user object
        let userToSave: User;

        if (editMode && currentUserId) {
            const existingUser = users.find(u => u.id === currentUserId);
            if (!existingUser) return;

            userToSave = {
                ...existingUser,
                ...formData,
                profile: { ...existingUser.profile, ...formData.profile }
            } as User;
        } else {
            userToSave = {
                id: uuidv4(),
                tenantId: user.tenantId, // Use current user's tenantId
                email: formData.email || '',
                name: formData.name || '',
                role: formData.role as UserRole,
                avatarUrl: formData.avatarUrl,
                profile: {
                    ...formData.profile,
                    color: formData.profile?.color || '#333'
                }
            } as User;
        }

        // --- PASSWORD HANDLING ---
        const passwordInput = document.getElementById('password-field-manual') as HTMLInputElement;
        if (passwordInput && passwordInput.value) {
            // Salviamo la password nel profilo (sporco ma efficace per MVP senza Auth Server)
            userToSave.profile = {
                ...userToSave.profile,
                password: passwordInput.value
            } as any;

            // Aggiorniamo anche lo stato locale credentials per mostrarlo nella modale di successo
            if (!editMode) {
                setCreatedCredentials({
                    email: userToSave.email,
                    password: passwordInput.value
                });
            }
        } else if (editMode && !passwordInput.value) {
            // In edit mode, se vuoto, manteniamo la vecchia password
            if (currentUserId) {
                const existingUser = users.find(u => u.id === currentUserId);
                if (existingUser && (existingUser.profile as any)?.password) {
                    userToSave.profile = {
                        ...userToSave.profile,
                        password: (existingUser.profile as any).password
                    } as any;
                }
            }
        } else if (!editMode && (!passwordInput || !passwordInput.value)) {
            // Nuova creazione senza password? Generiamone una random
            const randomPass = Math.random().toString(36).slice(-8);
            userToSave.profile = { ...userToSave.profile, password: randomPass } as any;
            setCreatedCredentials({ email: userToSave.email, password: randomPass });
        }

        try {
            await storage.saveUser(userToSave);

            // Reload users to be safe or update local state manually
            if (editMode) {
                setUsers(users.map(u => u.id === userToSave.id ? userToSave : u));
                setIsModalOpen(false);
            } else {
                setUsers([...users, userToSave]);
                // Show credentials for new user is handled above or by checking createdCredentials state in render
            }
        } catch (error: any) {
            console.error("Failed to save user (Detailed):", error);
            alert("Errore salvataggio operatore: " + (error.message || JSON.stringify(error)));
        }
    };

    return (
        <div className={classes.container}>
            <div className={classes.header}>
                <h1 className={classes.title}>Artisti</h1>
                <button className={classes.addBtn} onClick={handleOpenAddModal}>
                    <Plus size={20} />
                    <span>Aggiungi Operatore</span>
                </button>
            </div>

            <div className={`${classes.tableWrapper} ${classes.desktopOnly}`}>
                <table className={classes.table}>
                    <thead>
                        <tr>
                            <th>Avatar</th>
                            <th>Nome</th>
                            <th>Email</th>
                            <th>Contatto</th>
                            <th>Ruolo</th>
                            <th>Colore</th>
                            <th>Stato</th>
                            <th style={{ textAlign: 'center' }}>Azioni</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr
                                key={user.id}
                                onClick={() => handleOpenEditModal(user)}
                                style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <td>
                                    {user.avatarUrl ? (
                                        <img src={user.avatarUrl} alt={user.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <UserIcon size={20} />
                                        </div>
                                    )}
                                </td>
                                <td
                                    style={{ fontWeight: '500', cursor: 'pointer', color: 'var(--color-primary)' }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/artists/${user.id}`);
                                    }}
                                >
                                    {user.name}
                                </td>
                                <td style={{ color: 'var(--color-text-secondary)' }}>{user.email}</td>
                                <td>
                                    {user.profile?.phone ? (
                                        <div
                                            onClick={(e) => e.stopPropagation()} // Prevent row click
                                        >
                                            <a
                                                href={`https://wa.me/${user.profile.phone.replace(/[^0-9]/g, '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                                                    color: '#25D366', fontWeight: '500', textDecoration: 'none',
                                                    padding: '0.25rem 0.5rem', borderRadius: '4px',
                                                    backgroundColor: 'rgba(37, 211, 102, 0.1)'
                                                }}
                                                title={user.profile.phone}
                                            >
                                                <MessageCircle size={16} />
                                                <span>WhatsApp</span>
                                            </a>
                                        </div>
                                    ) : (
                                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>-</span>
                                    )}
                                </td>
                                <td>
                                    <span style={{
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '999px',
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        background: user.role === 'MANAGER' ? 'rgba(255, 107, 53, 0.2)' : 'rgba(0, 204, 102, 0.2)',
                                        color: user.role === 'MANAGER' ? 'var(--color-primary)' : '#00CC66'
                                    }}>
                                        {user.role}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: user.profile?.color || '#FF6B35', border: '2px solid var(--color-border)' }} />
                                    </div>
                                </td>
                                <td>
                                    {user.profile?.googleCalendarConnected ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#00CC66' }}>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor' }} />
                                            <span style={{ fontSize: '0.875rem' }}>Attivo</span>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)' }}>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor', opacity: 0.5 }} />
                                            <span style={{ fontSize: '0.875rem' }}>Offline</span>
                                        </div>
                                    )}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                    <button
                                        className={classes.actionBtn}
                                        onClick={(e) => handleDeleteUser(e, user.id)}
                                        style={{ color: 'var(--color-error)', border: 'none', background: 'none', cursor: 'pointer', padding: '8px' }}
                                        title="Elimina"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile List View */}
            <div className={classes.mobileOnly}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {users.map(user => (
                        <div key={user.id} style={{
                            background: 'var(--color-surface)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '1.5rem',
                            border: '1px solid var(--color-border)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                            display: 'flex', flexDirection: 'column', gap: '1.25rem'
                        }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                {user.avatarUrl ? (
                                    <img src={user.avatarUrl} alt={user.name} style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-primary)' }} />
                                ) : (
                                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--color-surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <UserIcon size={32} />
                                    </div>
                                )}
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0, marginBottom: '0.25rem' }}>{user.name}</h3>
                                    <span style={{
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '999px',
                                        fontSize: '0.8rem',
                                        fontWeight: '600',
                                        background: user.role === 'MANAGER' ? 'rgba(255, 107, 53, 0.15)' : 'rgba(0, 204, 102, 0.15)',
                                        color: user.role === 'MANAGER' ? 'var(--color-primary)' : '#00CC66'
                                    }}>
                                        {user.role}
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <button
                                    onClick={() => handleOpenEditModal(user)}
                                    style={{
                                        padding: '0.875rem', borderRadius: 'var(--radius-md)',
                                        background: 'var(--color-surface-hover)', border: '1px solid var(--color-border)',
                                        color: 'var(--color-text-primary)', fontWeight: '500', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem'
                                    }}
                                >
                                    <Pencil size={18} /> Modifica
                                </button>
                                <button
                                    onClick={(e) => handleDeleteUser(e, user.id)}
                                    style={{
                                        padding: '0.875rem', borderRadius: 'var(--radius-md)',
                                        background: 'rgba(255, 0, 0, 0.1)', border: '1px solid rgba(255, 0, 0, 0.2)',
                                        color: 'var(--color-error)', fontWeight: '500', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem'
                                    }}
                                >
                                    <Trash2 size={18} /> Elimina
                                </button>
                            </div>

                            {user.profile?.phone ? (
                                <a
                                    href={`https://wa.me/${user.profile.phone.replace(/[^0-9]/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        width: '100%',
                                        boxSizing: 'border-box',
                                        padding: '1rem',
                                        borderRadius: 'var(--radius-md)',
                                        background: '#25D366',
                                        color: 'white',
                                        fontWeight: 'bold',
                                        fontSize: '1rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.75rem',
                                        textDecoration: 'none',
                                        boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)'
                                    }}
                                >
                                    <MessageCircle size={24} />
                                    Scrivigli su WhatsApp
                                </a>
                            ) : (
                                <div style={{
                                    padding: '1rem', textAlign: 'center',
                                    background: 'var(--color-surface-hover)',
                                    borderRadius: 'var(--radius-md)',
                                    color: 'var(--color-text-muted)',
                                    fontSize: '0.9rem'
                                }}>
                                    Nessun telefono
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal Overlay */}
            {
                isModalOpen && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
                        padding: '1rem' // Ensure some spacing on mobile edges
                    }}>
                        {/* Modal Content */}
                        <div style={{
                            backgroundColor: 'var(--color-surface)',
                            padding: '2rem',
                            borderRadius: 'var(--radius-lg)',
                            width: '100%',
                            maxWidth: '600px', // On desktop
                            border: '1px solid var(--color-border)',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            overflowX: 'hidden', // Prevent horizontal scroll
                            position: 'relative',
                            boxSizing: 'border-box' // Include padding in width
                        }}>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                style={{
                                    position: 'absolute',
                                    top: '1rem',
                                    right: '1rem', // Tighter positioning on mobile matching padding
                                    background: 'var(--color-surface-hover)',
                                    border: '1px solid var(--color-border)',
                                    color: 'var(--color-text-primary)',
                                    cursor: 'pointer',
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-error)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'transparent'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-surface-hover)'; e.currentTarget.style.color = 'var(--color-text-primary)'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
                            >
                                <X size={20} />
                            </button>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', paddingRight: '40px' }}>
                                    {editMode ? 'Scheda Operatore' : 'Nuovo Operatore'}
                                </h2>
                            </div>

                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                                {/* Avatar Section */}
                                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', paddingBottom: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
                                    <div style={{ position: 'relative' }}>
                                        {formData.avatarUrl ? (
                                            <img
                                                src={formData.avatarUrl}
                                                alt="Preview"
                                                style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-primary)' }}
                                            />
                                        ) : (
                                            <div style={{
                                                width: '80px', height: '80px', borderRadius: '50%',
                                                background: 'var(--color-surface-hover)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                border: '1px dashed var(--color-border)'
                                            }}>
                                                <UserIcon size={32} style={{ color: 'var(--color-text-muted)' }} />
                                            </div>
                                        )}
                                        <label htmlFor="avatar-upload" style={{
                                            position: 'absolute', bottom: 0, right: 0,
                                            background: 'var(--color-primary)', borderRadius: '50%',
                                            width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer', border: '2px solid var(--color-surface)'
                                        }}>
                                            <Pencil size={14} color="white" />
                                        </label>
                                        <input
                                            id="avatar-upload"
                                            type="file"
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => {
                                                        setFormData({ ...formData, avatarUrl: reader.result as string });
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Foto Profilo</h3>
                                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Clicca sulla matita per caricare una foto.</p>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className={classes.group}>
                                        <label style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Nome Completo</label>
                                        <input required className={classes.searchInput} style={{ width: '100%' }}
                                            value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                    </div>
                                    <div className={classes.group}>
                                        <label style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Email di Login</label>
                                        <input required type="email" className={classes.searchInput} style={{ width: '100%' }}
                                            value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                    </div>
                                </div>

                                {/* New Password Field */}
                                <div className={classes.group}>
                                    <label style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                        {editMode ? 'Reset Password (lascia vuoto per non cambiare)' : 'Imposta Password Iniziale'}
                                    </label>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <input
                                            type="text"
                                            className={classes.searchInput}
                                            style={{ width: '100%', fontFamily: 'monospace' }}
                                            placeholder={editMode ? 'Nuova password...' : 'Es. Pippo123'}
                                            id="password-field-manual"
                                        />
                                        <button
                                            type="button"
                                            className={classes.secondaryButton}
                                            onClick={() => {
                                                const randomPass = Math.random().toString(36).slice(-8);
                                                (document.getElementById('password-field-manual') as HTMLInputElement).value = randomPass;
                                            }}
                                        >
                                            Genera
                                        </button>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1rem' }}>
                                    <div className={classes.group}>
                                        <label style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Ruolo</label>
                                        <select className={classes.searchInput} style={{ width: '100%' }}
                                            value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}>
                                            <option value="ARTIST">Artista (Tatuatore)</option>
                                            <option value="MANAGER">Manager Studio</option>
                                            <option value="STUDENT">Studente</option>
                                        </select>
                                    </div>
                                </div>

                                {/* CONTRACT DATA - Simplified */}
                                <div style={{
                                    background: 'var(--color-surface-hover)',
                                    padding: '1.5rem',
                                    borderRadius: 'var(--radius-md)',
                                    marginBottom: '1rem',
                                    border: '1px solid var(--color-border)'
                                }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1.5rem', color: 'var(--color-text-primary)' }}>
                                        💼 Dati Contratto
                                    </h3>

                                    {/* Rent Mode Dropdown */}
                                    <div className={classes.group} style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem', display: 'block', fontWeight: '500' }}>
                                            Modalità Affitto Postazione
                                        </label>
                                        <select
                                            className={classes.searchInput}
                                            style={{ width: '100%' }}
                                            value={formData.profile?.contractType || ''}
                                            onChange={e => {
                                                const value = e.target.value;
                                                setFormData({
                                                    ...formData,
                                                    profile: {
                                                        ...formData.profile!,
                                                        contractType: value || undefined
                                                    }
                                                });
                                            }}
                                        >
                                            <option value="">Nessun Affitto</option>
                                            <option value="RENT_MONTHLY">Affitto Mensile</option>
                                            <option value="RENT_PACK">Pacchetto Presenze</option>
                                        </select>
                                    </div>

                                    {/* Monthly Rent Fields */}
                                    {formData.profile?.contractType === 'RENT_MONTHLY' && (
                                        <div style={{
                                            background: 'var(--color-surface)',
                                            padding: '1rem',
                                            borderRadius: 'var(--radius-md)',
                                            border: '1px solid var(--color-border)',
                                            marginBottom: '1.5rem',
                                            display: 'grid',
                                            gridTemplateColumns: '1fr 1fr',
                                            gap: '1rem'
                                        }}>
                                            <div className={classes.group}>
                                                <label style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                                    Importo Mensile (€)
                                                </label>
                                                <input
                                                    type="number"
                                                    className={classes.searchInput}
                                                    style={{ width: '100%' }}
                                                    value={formData.profile?.rentAmount || ''}
                                                    placeholder="Es. 500"
                                                    onChange={e => setFormData({
                                                        ...formData,
                                                        profile: {
                                                            ...formData.profile!,
                                                            rentAmount: parseFloat(e.target.value) || undefined
                                                        }
                                                    })}
                                                />
                                            </div>
                                            <div className={classes.group}>
                                                <label style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                                    Prossimo Rinnovo
                                                </label>
                                                <input
                                                    type="date"
                                                    className={classes.searchInput}
                                                    style={{ width: '100%' }}
                                                    value={formData.profile?.rentRenewalDate || ''}
                                                    onChange={e => setFormData({
                                                        ...formData,
                                                        profile: {
                                                            ...formData.profile!,
                                                            rentRenewalDate: e.target.value
                                                        }
                                                    })}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Pack Rent Fields */}
                                    {formData.profile?.contractType === 'RENT_PACK' && (
                                        <div style={{
                                            background: 'var(--color-surface)',
                                            padding: '1rem',
                                            borderRadius: 'var(--radius-md)',
                                            border: '1px solid var(--color-border)',
                                            marginBottom: '1.5rem',
                                            display: 'grid',
                                            gridTemplateColumns: editMode ? '1fr 1fr 1fr' : '1fr 1fr',
                                            gap: '1rem'
                                        }}>
                                            <div className={classes.group}>
                                                <label style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                                    Importo Pacchetto (€)
                                                </label>
                                                <input
                                                    type="number"
                                                    className={classes.searchInput}
                                                    style={{ width: '100%' }}
                                                    value={formData.profile?.rentAmount || ''}
                                                    placeholder="Es. 300"
                                                    onChange={e => setFormData({
                                                        ...formData,
                                                        profile: {
                                                            ...formData.profile!,
                                                            rentAmount: parseFloat(e.target.value) || undefined
                                                        }
                                                    })}
                                                />
                                            </div>
                                            <div className={classes.group}>
                                                <label style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                                    Totale Presenze
                                                </label>
                                                <input
                                                    type="number"
                                                    className={classes.searchInput}
                                                    style={{ width: '100%' }}
                                                    value={formData.profile?.rentPackPresences || ''}
                                                    placeholder="Es. 10"
                                                    onChange={e => setFormData({
                                                        ...formData,
                                                        profile: {
                                                            ...formData.profile!,
                                                            rentPackPresences: parseInt(e.target.value) || undefined
                                                        }
                                                    })}
                                                />
                                            </div>
                                            {editMode && (
                                                <div className={classes.group}>
                                                    <label style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                                        Già Usate
                                                    </label>
                                                    <input
                                                        type="number"
                                                        className={classes.searchInput}
                                                        style={{ width: '100%' }}
                                                        value={formData.profile?.rentUsedPresences || 0}
                                                        onChange={e => setFormData({
                                                            ...formData,
                                                            profile: {
                                                                ...formData.profile!,
                                                                rentUsedPresences: parseInt(e.target.value) || 0
                                                            }
                                                        })}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* COMMISSION SECTION - Separate and Independent */}
                                <div style={{
                                    background: 'var(--color-surface-hover)',
                                    padding: '1.5rem',
                                    borderRadius: 'var(--radius-md)',
                                    marginBottom: '1rem',
                                    border: '1px solid var(--color-border)'
                                }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1.5rem', color: 'var(--color-text-primary)' }}>
                                        💰 Commissione sui Lavori
                                    </h3>

                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.75rem',
                                            cursor: 'pointer',
                                            fontSize: '0.875rem',
                                            fontWeight: '500'
                                        }}>
                                            <input
                                                type="checkbox"
                                                checked={(formData.profile?.commissionRate || 0) > 0}
                                                onChange={e => {
                                                    setFormData({
                                                        ...formData,
                                                        profile: {
                                                            ...formData.profile!,
                                                            commissionRate: e.target.checked ? 50 : 0
                                                        }
                                                    });
                                                }}
                                            />
                                            <span>Attiva Commissione</span>
                                        </label>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem', marginLeft: '2rem' }}>
                                            Percentuale aggiuntiva su ogni tatuaggio realizzato (combinabile con affitto)
                                        </p>
                                    </div>

                                    {(formData.profile?.commissionRate || 0) > 0 && (
                                        <div style={{
                                            background: 'var(--color-surface)',
                                            padding: '1rem',
                                            borderRadius: 'var(--radius-md)',
                                            border: '1px solid var(--color-border)'
                                        }}>
                                            <label style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem', display: 'block' }}>
                                                Percentuale Commissione (%)
                                            </label>
                                            <input
                                                type="number"
                                                className={classes.searchInput}
                                                style={{ width: '100%', fontSize: '1.1rem', fontWeight: 'bold' }}
                                                value={formData.profile?.commissionRate || 50}
                                                min="0"
                                                max="100"
                                                placeholder="50"
                                                onChange={e => setFormData({
                                                    ...formData,
                                                    profile: {
                                                        ...formData.profile!,
                                                        commissionRate: parseInt(e.target.value) || 0
                                                    }
                                                })}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className={classes.group}>
                                        <label style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Telefono (con prefisso)</label>
                                        <input className={classes.searchInput} style={{ width: '100%' }} placeholder="+39 333..."
                                            value={formData.profile?.phone || ''}
                                            onChange={e => setFormData({ ...formData, profile: { ...formData.profile!, phone: e.target.value } })} />
                                    </div>
                                    <div className={classes.group}>
                                        <label style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Colore Calendario</label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <input type="color" style={{ width: '50px', height: '42px', padding: '0', border: 'none', background: 'none' }}
                                                value={formData.profile?.color || '#FF6B35'}
                                                onChange={e => setFormData({ ...formData, profile: { ...formData.profile!, color: e.target.value } })} />
                                            <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                                                {formData.profile?.color || '#FF6B35'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className={classes.group}>
                                    <label style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Bio / Note</label>
                                    <textarea className={classes.searchInput} style={{ width: '100%', minHeight: '80px', resize: 'vertical' }}
                                        value={formData.profile?.bio || ''}
                                        onChange={e => setFormData({ ...formData, profile: { ...formData.profile!, bio: e.target.value } })} />
                                </div>

                                <div className={classes.group}>
                                    <label style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Partita IVA / Tax ID</label>
                                    <input className={classes.searchInput} style={{ width: '100%' }}
                                        value={formData.profile?.taxId || ''}
                                        onChange={e => setFormData({ ...formData, profile: { ...formData.profile!, taxId: e.target.value } })} />
                                </div>

                                {/* Google Calendar Mapping (Manager Side) */}
                                <div style={{ padding: '1rem', background: 'rgba(66, 133, 244, 0.1)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(66, 133, 244, 0.3)' }}>
                                    <h4 style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#4285F4', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5v-5z"></path></svg>
                                        Integrazione Google Calendar
                                    </h4>

                                    {!localStorage.getItem('google_access_token') ? (
                                        <div style={{ textAlign: 'center' }}>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                                                Per sincronizzare gli appuntamenti, connetti il <strong>Duo Account Manager</strong>.
                                            </p>
                                            <button type="button"
                                                onClick={() => loginToGoogleCalendar()}
                                                style={{
                                                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                                    padding: '0.75rem', background: '#4285F4', color: 'white', borderRadius: '4px', fontWeight: '500', border: 'none', cursor: 'pointer',
                                                    opacity: googleInitStatus.status === 'success' ? 1 : 0.6,
                                                    pointerEvents: googleInitStatus.status === 'success' ? 'auto' : 'none'
                                                }}>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" /></svg>
                                                Fai Login Google (Manager)
                                            </button>
                                            <p style={{
                                                fontSize: '0.7rem',
                                                marginTop: '5px',
                                                textAlign: 'center',
                                                color: googleInitStatus.status === 'error' ? 'red' :
                                                    googleInitStatus.status === 'success' ? 'green' : 'gray'
                                            }}>
                                                Status: {googleInitStatus.message || googleInitStatus.status}
                                            </p>
                                        </div>
                                    ) : (
                                        <div>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--color-success)', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                                ✓ Manager Autenticato.
                                            </p>
                                            <label style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem', display: 'block' }}>
                                                Associa a un calendario specifico:
                                            </label>
                                            <select
                                                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)', marginBottom: '0.5rem' }}
                                                value={formData.profile?.googleCalendarId || ''}
                                                onChange={e => {
                                                    const calId = e.target.value;
                                                    setFormData({
                                                        ...formData,
                                                        profile: {
                                                            ...formData.profile!,
                                                            googleCalendarId: calId,
                                                            googleCalendarConnected: !!calId
                                                        }
                                                    });
                                                }}
                                            >
                                                <option value="">-- Nessun Collegamento --</option>
                                                {/* We need to populate this list dynamically */}
                                                {googleCalendars.map(cal => (
                                                    <option key={cal.id} value={cal.id}>{cal.summary}</option>
                                                ))}
                                            </select>
                                            {formData.profile?.googleCalendarId && (
                                                <div style={{ marginTop: '0.5rem' }}>
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                                                        Gli appuntamenti per questo artista verranno salvati nel calendario selezionato.
                                                    </p>

                                                    {editMode && (
                                                        <button
                                                            type="button"
                                                            onClick={handleImportFromGoogle}
                                                            style={{
                                                                width: '100%',
                                                                padding: '0.5rem',
                                                                marginTop: '0.5rem',
                                                                marginBottom: '0.5rem',
                                                                background: 'var(--color-surface)',
                                                                border: '1px solid var(--color-primary)',
                                                                color: 'var(--color-primary)',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                                                fontSize: '0.85rem', fontWeight: '500'
                                                            }}
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
                                                            Importa Appuntamenti Esistenti (Prossimi 6 mesi)
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                            <button type="button" onClick={() => { localStorage.removeItem('google_access_token'); window.location.reload(); }} style={{ marginTop: '0.5rem', background: 'none', border: 'none', textDecoration: 'underline', fontSize: '0.75rem', color: 'gray', cursor: 'pointer' }}>
                                                Logout Google
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <button type="submit" className={classes.addBtn} style={{ justifyContent: 'center', marginTop: '1rem', height: '50px', fontSize: '1rem' }}>
                                    {editMode ? 'Salva Modifiche' : 'Crea Operatore'}
                                </button>
                            </form>

                            {createdCredentials && (
                                <div style={{
                                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                    background: 'var(--color-surface)',
                                    padding: '2rem',
                                    borderRadius: 'var(--radius-lg)',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    zIndex: 10
                                }}>
                                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(0, 204, 102, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                                        <UserIcon size={32} color="#00CC66" />
                                    </div>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', textAlign: 'center' }}>Operatore Creato!</h3>
                                    <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', marginBottom: '2rem', maxWidth: '400px' }}>
                                        Condividi queste credenziali provvisorie con l'operatore per permettergli di accedere.
                                    </p>

                                    <div style={{ background: 'var(--color-surface-hover)', padding: '1.5rem', borderRadius: 'var(--radius-md)', width: '100%', maxWidth: '400px', marginBottom: '2rem', border: '1px solid var(--color-border)' }}>
                                        <div style={{ marginBottom: '1rem' }}>
                                            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>EMAIL</span>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <code style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{createdCredentials.email}</code>
                                            </div>
                                        </div>
                                        <div>
                                            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>PASSWORD PROVVISORIA</span>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <code style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{createdCredentials.password}</code>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => {
                                            const subject = encodeURIComponent('Benvenuto nello Staff - Credenziali Accesso');
                                            const body = encodeURIComponent(`Ciao,\n\necco le tue credenziali per accedere al CRM:\n\nEmail: ${createdCredentials.email}\nPassword Provvisoria: ${createdCredentials.password}\n\nAccedi qui: ${window.location.origin}\n\nBuon lavoro!`);

                                            // User requested Gmail specifically
                                            const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${createdCredentials.email}&su=${subject}&body=${body}`;
                                            window.open(gmailUrl, '_blank');
                                        }}
                                        className={classes.secondaryButton}
                                        style={{ width: '100%', maxWidth: '400px', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                    >
                                        <MessageCircle size={18} /> Invia credenziali con Gmail
                                    </button>

                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className={classes.primaryButton}
                                        style={{ width: '100%', maxWidth: '400px' }}
                                    >
                                        Chiudi
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }
        </div >
    );
}
