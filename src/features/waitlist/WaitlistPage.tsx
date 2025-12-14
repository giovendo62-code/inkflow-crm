import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { storage } from '../../lib/storage';
import { WaitlistEntry, WaitlistStatus, User as AppUser, Client } from '../../types';
import { Plus, Search, Trash2, User, Phone, Mail, Calendar, Save, X, Filter, Edit2, Check, Clock, AlertCircle, ArrowUpDown } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import classes from './WaitlistPage.module.css';

export function WaitlistPage() {
    const { user } = useAuth();
    const [entries, setEntries] = useState<WaitlistEntry[]>([]);
    const [artists, setArtists] = useState<AppUser[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<WaitlistStatus | 'ALL'>('ALL');
    const [artistFilter, setArtistFilter] = useState<string>('ALL');
    const [sortOrder, setSortOrder] = useState<'date_desc' | 'date_asc'>('date_desc');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<WaitlistEntry | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<WaitlistEntry>>({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        projectDescription: '',
        assignedArtistId: '',
        notes: '',
        status: 'PENDING',
        clientId: undefined,
        requestDate: '' // Add requestDate to form
    });

    // Client Selection State
    const [clientSearch, setClientSearch] = useState('');
    const [showClientList, setShowClientList] = useState(false);

    useEffect(() => {
        loadData();
    }, [user?.tenantId]);

    const loadData = async () => {
        if (!user?.tenantId) return;
        setIsLoading(true);
        try {
            const [data, users, allClients] = await Promise.all([
                storage.getWaitlist(user.tenantId),
                storage.getUsers(user.tenantId),
                storage.getClients(user.tenantId)
            ]);
            setEntries(data);
            setArtists(users.filter(u => u.role === 'ARTIST'));
            setClients(allClients);
        } catch (error) {
            console.error("Failed to load waitlist:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (user?.role !== 'MANAGER') return;
        if (!confirm('Sei sicuro di voler rimuovere questo cliente dalla lista d\'attesa?')) return;
        try {
            await storage.deleteWaitlistEntry(id);
            setEntries(prev => prev.filter(e => e.id !== id));
        } catch (error) {
            console.error("Delete failed:", error);
            alert("Errore durante l'eliminazione");
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.tenantId || !formData.firstName || !formData.lastName) {
            alert("Nome e Cognome obbligatori (Seleziona un cliente)");
            return;
        }

        const entry: WaitlistEntry = {
            id: editingEntry ? editingEntry.id : uuidv4(),
            tenantId: user.tenantId,
            clientId: formData.clientId,
            firstName: formData.firstName!,
            lastName: formData.lastName!,
            phone: formData.phone || '',
            email: formData.email || '',
            projectDescription: formData.projectDescription || '',
            // Use custom date or default to now if not set
            requestDate: formData.requestDate ? new Date(formData.requestDate).toISOString() : new Date().toISOString(),
            assignedArtistId: formData.assignedArtistId || undefined,
            notes: formData.notes || '',
            status: (formData.status as WaitlistStatus) || 'PENDING',
            createdAt: editingEntry ? editingEntry.createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        try {
            await storage.saveWaitlistEntry(entry);
            setIsModalOpen(false);
            setEditingEntry(null);
            setFormData({ status: 'PENDING' });
            loadData();
        } catch (error) {
            console.error("Save failed:", error);
            alert("Errore salvataggio");
        }
    };

    const openModal = (entry?: WaitlistEntry) => {
        setClientSearch('');
        setShowClientList(false);
        if (entry) {
            setEditingEntry(entry);
            setFormData({
                ...entry,
                requestDate: entry.requestDate.split('T')[0] // Format for input date
            });
        } else {
            setEditingEntry(null);
            setFormData({
                firstName: '',
                lastName: '',
                phone: '',
                email: '',
                projectDescription: '',
                assignedArtistId: '',
                notes: '',
                status: 'PENDING',
                clientId: undefined,
                requestDate: new Date().toISOString().split('T')[0] // Default today
            });
        }
        setIsModalOpen(true);
    };

    const selectClient = (client: Client) => {
        setFormData(prev => ({
            ...prev,
            clientId: client.id,
            firstName: client.firstName,
            lastName: client.lastName,
            phone: client.phone,
            email: client.email
        }));
        setClientSearch('');
        setShowClientList(false);
    };

    const clearSelectedClient = () => {
        setFormData(prev => ({
            ...prev,
            clientId: undefined,
            firstName: '',
            lastName: '',
            phone: '',
            email: ''
        }));
    };

    const updateStatus = async (entry: WaitlistEntry, newStatus: WaitlistStatus) => {
        try {
            const updated = { ...entry, status: newStatus };
            await storage.saveWaitlistEntry(updated);
            setEntries(prev => prev.map(e => e.id === entry.id ? updated : e));
        } catch (error) {
            console.error("Status update failed:", error);
        }
    };

    const filteredEntries = entries
        .filter(e => {
            const matchesSearch = (e.firstName + ' ' + e.lastName + e.phone).toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'ALL' || e.status === statusFilter;
            const matchesArtist = artistFilter === 'ALL'
                ? true
                : artistFilter === 'UNASSIGNED'
                    ? !e.assignedArtistId
                    : e.assignedArtistId === artistFilter;
            return matchesSearch && matchesStatus && matchesArtist;
        })
        .sort((a, b) => {
            if (sortOrder === 'date_desc') {
                return new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime();
            } else {
                return new Date(a.requestDate).getTime() - new Date(b.requestDate).getTime();
            }
        });

    const getStatusConfig = (status: WaitlistStatus) => {
        switch (status) {
            case 'WORKED': return {
                color: '#10B981',
                bg: 'rgba(16, 185, 129, 0.1)',
                text: '#047857',
                label: 'Lavorato'
            };
            case 'PARTIAL': return {
                color: '#F59E0B',
                bg: 'rgba(245, 158, 11, 0.1)',
                text: '#B45309',
                label: 'Parziale'
            };
            default: return {
                color: '#CBD5E1',
                bg: 'var(--color-surface)',
                text: '#475569',
                label: 'In Attesa'
            };
        }
    };

    if (user?.role !== 'MANAGER') {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>Accesso Negato: Solo per Manager.</div>;
    }

    const pendingCount = entries.filter(e => e.status === 'PENDING').length;

    return (
        <div className={classes.container}>
            <div className={classes.header}>
                <div>
                    <h1 className={classes.title}>Waitlist</h1>
                    <div className={classes.statsBar}>
                        <div className={classes.statBadge}><span>{pendingCount}</span> In Attesa</div>
                        <div className={classes.statBadge}><span>{entries.length}</span> Totali</div>
                    </div>
                </div>
                <button className={classes.addButton} onClick={() => openModal()}>
                    <Plus size={20} />
                    Nuova Richiesta
                </button>
            </div>

            <div className={classes.controls}>
                <div className={classes.searchWrapper}>
                    <Search className={classes.searchIcon} size={18} />
                    <input
                        type="text"
                        placeholder="Cerca nome, telefono..."
                        className={classes.searchInput}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    className={classes.selectInput}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                >
                    <option value="ALL">Tutti gli stati</option>
                    <option value="PENDING">⬜ In Attesa</option>
                    <option value="PARTIAL">🟨 Parziale</option>
                    <option value="WORKED">🟩 Lavorato</option>
                </select>
                <select
                    className={classes.selectInput}
                    value={artistFilter}
                    onChange={(e) => setArtistFilter(e.target.value)}
                >
                    <option value="ALL">🎨 Tutti gli artisti</option>
                    <option value="UNASSIGNED">Non assegnato</option>
                    {artists.map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                </select>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ArrowUpDown size={18} color="var(--color-text-muted)" />
                    <select
                        className={classes.selectInput}
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value as any)}
                    >
                        <option value="date_desc">Più recenti prima</option>
                        <option value="date_asc">Meno recenti prima</option>
                    </select>
                </div>
            </div>

            <div className={classes.list}>
                {filteredEntries.map(entry => {
                    const statusStyle = getStatusConfig(entry.status);
                    const artist = artists.find(a => a.id === entry.assignedArtistId);

                    return (
                        <div key={entry.id} className={classes.listRow}
                            style={{ '--status-color': statusStyle.color } as any}>

                            {/* Column 1: Name & Phone */}
                            <div className={classes.colName}>
                                <span>{entry.firstName} {entry.lastName}</span>
                                {entry.phone && <small>{entry.phone}</small>}
                            </div>

                            {/* Column 2: Project Description */}
                            <div className={classes.colDesc} title={entry.projectDescription}>
                                {entry.projectDescription || <span style={{ opacity: 0.5 }}>- Nessun progetto -</span>}
                            </div>

                            {/* Column 3: Date */}
                            <div className={classes.colDate}>
                                <Calendar size={14} />
                                {new Date(entry.requestDate).toLocaleDateString()}
                            </div>

                            {/* Column 4: Artist */}
                            <div className={classes.colArtist}>
                                {artist ? (
                                    <>
                                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#6366f1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>
                                            {artist.name[0]}
                                        </div>
                                        <span>{artist.name}</span>
                                    </>
                                ) : <span style={{ opacity: 0.5 }}>-</span>}
                            </div>

                            {/* Column 5: Status */}
                            <div className={classes.colStatus}>
                                <div className={classes.statusBadge} style={{ '--status-bg': statusStyle.bg, '--status-text': statusStyle.text } as any}>
                                    {statusStyle.label}
                                </div>
                            </div>

                            {/* Column 6: Actions */}
                            <div className={classes.colActions}>
                                <button className={classes.iconBtn} onClick={() => openModal(entry)} title="Modifica">
                                    <Edit2 size={16} />
                                </button>
                                <button className={`${classes.iconBtn} ${classes.deleteBtn}`} onClick={(e) => handleDelete(entry.id, e)} title="Elimina">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {isModalOpen && (
                <div className={classes.modalOverlay}>
                    <div className={classes.modal}>
                        <div className={classes.modalHeader}>
                            <h2 className={classes.modalTitle}>{editingEntry ? 'Modifica Richiesta' : 'Nuova Richiesta'}</h2>
                            <button className={classes.closeBtn} onClick={() => setIsModalOpen(false)}><X /></button>
                        </div>
                        <form onSubmit={handleSave} className={classes.modalBody}>

                            <div className={classes.formGroup}>
                                <label className={classes.label}>Data Inserimento (Modificabile)</label>
                                <input
                                    type="date"
                                    className={classes.input}
                                    value={formData.requestDate ? formData.requestDate.split('T')[0] : ''}
                                    onChange={e => setFormData({ ...formData, requestDate: e.target.value })}
                                    required
                                />
                            </div>

                            {/* CLIENT SELECTION */}
                            <div className={classes.formGroup}>
                                <label className={classes.label}>Cliente *</label>
                                {formData.firstName ? (
                                    <div style={{
                                        padding: '0.75rem',
                                        backgroundColor: 'var(--color-background)',
                                        borderRadius: '12px',
                                        border: '1px solid var(--color-primary)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <div>
                                            <div style={{ fontWeight: 'bold' }}>{formData.firstName} {formData.lastName}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{formData.phone}</div>
                                        </div>
                                        {!editingEntry && (
                                            <button type="button" onClick={clearSelectedClient} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}>
                                                Cambia
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div style={{ position: 'relative' }}>
                                        <Search className={classes.searchIcon} size={16} style={{ top: '50%', transform: 'translateY(-50%)' }} />
                                        <input
                                            className={classes.input}
                                            style={{ paddingLeft: '2.5rem' }}
                                            placeholder="Cerca cliente esistente..."
                                            value={clientSearch}
                                            onChange={e => { setClientSearch(e.target.value); setShowClientList(true); }}
                                        />
                                        {showClientList && clientSearch && (
                                            <div className={classes.dropdownList}>
                                                {clients
                                                    .filter(c => (c.firstName + ' ' + c.lastName).toLowerCase().includes(clientSearch.toLowerCase()))
                                                    .map(c => (
                                                        <div key={c.id} className={classes.dropdownItem} onClick={() => selectClient(c)}>
                                                            <div style={{ fontWeight: '600' }}>{c.firstName} {c.lastName}</div>
                                                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{c.phone}</div>
                                                        </div>
                                                    ))}
                                                {clients.filter(c => (c.firstName + ' ' + c.lastName).toLowerCase().includes(clientSearch.toLowerCase())).length === 0 && (
                                                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Nessun cliente trovato</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className={classes.formGroup}>
                                <label className={classes.label}>Descrizione Progetto</label>
                                <textarea className={classes.input} value={formData.projectDescription} onChange={e => setFormData({ ...formData, projectDescription: e.target.value })} rows={3} placeholder="Descrivi l'idea del tatuaggio..." />
                            </div>
                            <div className={classes.formGroup}>
                                <label className={classes.label}>Note Interne</label>
                                <textarea className={classes.input} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} rows={2} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className={classes.formGroup}>
                                    <label className={classes.label}>Artista</label>
                                    <select className={classes.input} value={formData.assignedArtistId || ''} onChange={e => setFormData({ ...formData, assignedArtistId: e.target.value })}>
                                        <option value="">- Nessuno -</option>
                                        {artists.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                    </select>
                                </div>
                                <div className={classes.formGroup}>
                                    <label className={classes.label}>Stato</label>
                                    <select className={classes.input} value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as any })}>
                                        <option value="PENDING">In Attesa</option>
                                        <option value="PARTIAL">Parziale</option>
                                        <option value="WORKED">Lavorato</option>
                                    </select>
                                </div>
                            </div>

                            <button type="submit" className={classes.submitBtn} disabled={!formData.clientId}>
                                {formData.clientId ? 'Salva Richiesta' : 'Seleziona un Cliente'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
