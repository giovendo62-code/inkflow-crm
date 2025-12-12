import { useState, useEffect } from 'react';
import { storage } from '../../lib/storage';
import { type User, type UserRole } from '../../types';
import { Plus, User as UserIcon, X, MessageCircle, Pencil, Trash2 } from 'lucide-react';
import classes from '../crm/ClientListPage.module.css'; // Reusing styles
import { v4 as uuidv4 } from 'uuid';

export function OperatorListPage() {
    const [users, setUsers] = useState<User[]>([]);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const [formData, setFormData] = useState<Partial<User>>({
        role: 'ARTIST',
        profile: { color: '#FF6B35', bio: '', taxId: '', address: '', commissionRate: 50, googleCalendarConnected: false }
    });

    useEffect(() => {
        // Mostra solo MANAGER e ARTIST, nascondi gli STUDENTI (che sono in Academy)
        const staff = storage.getUsers().filter(u => u.role === 'MANAGER' || u.role === 'ARTIST');
        setUsers(staff);
    }, []);

    const handleOpenAddModal = () => {
        setEditMode(false);
        setCurrentUserId(null);
        setFormData({
            role: 'ARTIST',
            profile: { color: '#FF6B35', bio: '', taxId: '', address: '', commissionRate: 50, googleCalendarConnected: false }
        });
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (user: User) => {
        setEditMode(true);
        setCurrentUserId(user.id);
        setFormData({
            ...user,
            profile: {
                ...user.profile,
                commissionRate: user.profile?.commissionRate || 50
            }
        });
        setIsModalOpen(true);
    };

    const handleDeleteUser = (e: React.MouseEvent, userId: string) => {
        e.stopPropagation();
        if (confirm('Sei sicuro di voler eliminare questo operatore?')) {
            const updatedUsers = users.filter(u => u.id !== userId);
            setUsers(updatedUsers);
            localStorage.setItem('inkflow_users', JSON.stringify(updatedUsers));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        let updatedUsers = [...users];

        if (editMode && currentUserId) {
            // Update existing
            updatedUsers = updatedUsers.map(u =>
                u.id === currentUserId ? {
                    ...u,
                    ...formData,
                    profile: { ...u.profile, ...formData.profile }
                } as User : u
            );
        } else {
            // Create new
            const newUser: User = {
                id: uuidv4(),
                tenantId: 'studio-1', // Mock
                email: formData.email || '',
                name: formData.name || '',
                role: formData.role as UserRole,
                avatarUrl: formData.avatarUrl,
                profile: {
                    ...formData.profile,
                    color: formData.profile?.color || '#333'
                }
            } as User;
            updatedUsers.push(newUser);
        }

        setUsers(updatedUsers);
        localStorage.setItem('inkflow_users', JSON.stringify(updatedUsers));
        setIsModalOpen(false);
    };

    return (
        <div className={classes.container}>
            <div className={classes.header}>
                <h1 className={classes.title}>Artisti & Staff</h1>
                <button className={classes.addBtn} onClick={handleOpenAddModal}>
                    <Plus size={20} />
                    <span>Aggiungi Operatore</span>
                </button>
            </div>

            <div className={classes.tableWrapper}>
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
                                <td style={{ fontWeight: '500' }}>{user.name}</td>
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

            {/* Modal Overlay */}
            {
                isModalOpen && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
                    }}>
                        {/* Modal Content */}
                        <div style={{
                            backgroundColor: 'var(--color-surface)',
                            padding: '2rem',
                            borderRadius: 'var(--radius-lg)',
                            width: '100%',
                            maxWidth: '600px',
                            border: '1px solid var(--color-border)',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            position: 'relative' // Per posizionare la X assoluta
                        }}>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                style={{
                                    position: 'absolute',
                                    top: '1.5rem',
                                    right: '1.5rem',
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
                                        <label style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Email</label>
                                        <input required type="email" className={classes.searchInput} style={{ width: '100%' }}
                                            value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className={classes.group}>
                                        <label style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Ruolo</label>
                                        <select className={classes.searchInput} style={{ width: '100%' }}
                                            value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}>
                                            <option value="ARTIST">Artista (Tatuatore)</option>
                                            <option value="MANAGER">Manager Studio</option>
                                            <option value="STUDENT">Studente</option>
                                        </select>
                                    </div>
                                    <div className={classes.group}>
                                        <label style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Commissione (%)</label>
                                        <input type="number" className={classes.searchInput} style={{ width: '100%' }}
                                            value={formData.profile?.commissionRate || ''}
                                            onChange={e => setFormData({ ...formData, profile: { ...formData.profile!, commissionRate: parseInt(e.target.value) } })} />
                                    </div>
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

                                {/* Google Calendar Integration */}
                                <div style={{ padding: '1rem', background: 'rgba(66, 133, 244, 0.1)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(66, 133, 244, 0.3)' }}>
                                    <h4 style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#4285F4', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5v-5z"></path></svg>
                                        Google Calendar Sync
                                    </h4>

                                    {formData.profile?.googleCalendarConnected ? (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-success)', fontSize: '0.9rem' }}>
                                                <span style={{ width: '10px', height: '10px', background: 'currentColor', borderRadius: '50%' }}></span>
                                                Connesso
                                            </div>
                                            <button type="button"
                                                onClick={() => setFormData({ ...formData, profile: { ...formData.profile!, googleCalendarConnected: false } })}
                                                style={{ color: 'var(--color-error)', fontSize: '0.85rem', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}>
                                                Disconnetti
                                            </button>
                                        </div>
                                    ) : (
                                        <button type="button"
                                            onClick={() => setFormData({ ...formData, profile: { ...formData.profile!, googleCalendarConnected: true } })}
                                            style={{
                                                width: '100%',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                                padding: '0.75rem', background: '#4285F4', color: 'white', borderRadius: '4px', fontWeight: '500', border: 'none', cursor: 'pointer'
                                            }}>
                                            Connetti Account Google
                                        </button>
                                    )}
                                </div>

                                <button type="submit" className={classes.addBtn} style={{ justifyContent: 'center', marginTop: '1rem', height: '50px', fontSize: '1rem' }}>
                                    {editMode ? 'Salva Modifiche' : 'Crea Operatore'}
                                </button>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
