import { useState, useEffect } from 'react';
import { storage } from '../../lib/storage';
import { type Client, type TattooStyle } from '../../types';
import { Search, Plus, User as UserIcon, Upload, Filter, ArrowUpDown, FileSpreadsheet, Trash2 } from 'lucide-react';
import classes from './ClientListPage.module.css';
import { AddClientModal } from './AddClientModal';
import { ImportCSVModal } from './ImportCSVModal';
import { ClientDetailsModal } from './ClientDetailsModal';
import { AVAILABLE_TATTOO_STYLES } from '../../lib/constants';
import { useAuth } from '../auth/AuthContext';

type SortField = 'name' | 'email' | 'createdAt' | 'preferredStyle';
type SortOrder = 'asc' | 'desc';

export function ClientListPage() {
    const { user } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    // Client Details Modal
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);

    // Advanced Filters
    const [styleFilter, setStyleFilter] = useState<TattooStyle | 'all'>('all');
    const [broadcastFilter, setBroadcastFilter] = useState<'all' | 'yes' | 'no'>('all');
    const [newClientsFilter, setNewClientsFilter] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    // Sorting
    const [sortField, setSortField] = useState<SortField>('createdAt');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    const loadClients = async () => {
        if (!user?.tenantId) return;
        try {
            const data = await storage.getClients(user.tenantId);
            setClients(data);
        } catch (error) {
            console.error('Failed to load clients:', error);
        }
    };

    useEffect(() => {
        loadClients();
    }, [user?.tenantId]);

    const handleBroadcastToggle = async (clientId: string, inBroadcast: boolean) => {
        const client = clients.find(c => c.id === clientId);
        if (!client) return;

        const updatedClient = { ...client, inBroadcast, updatedAt: new Date().toISOString() };

        // Optimistic update
        setClients(clients.map(c => c.id === clientId ? updatedClient : c));

        try {
            await storage.saveClient(updatedClient);
        } catch (error) {
            console.error('Failed to update client:', error);
            // Revert on error if needed, or show toast
        }
    };

    const handleViewClient = (client: Client) => {
        setSelectedClient(client);
        setIsDetailsModalOpen(true);
    };

    const handleSaveClient = async (updatedClient: Client) => {
        try {
            const savedClient = await storage.saveClient(updatedClient);
            setClients(clients.map(c => c.id === savedClient.id ? savedClient : c));
        } catch (error) {
            console.error('Failed to save client:', error);
        }
    };

    const handleDeleteClient = async (clientId: string, clientName: string) => {
        const confirmed = window.confirm(
            `Sei sicuro di voler eliminare ${clientName}?\n\nQuesta azione è irreversibile e eliminerà:\n- Tutti i dati del cliente\n- Appuntamenti associati\n- Consensi firmati\n\nConfermi?`
        );

        if (!confirmed) return;

        try {
            await storage.deleteClient(clientId);
            setClients(clients.filter(c => c.id !== clientId));

            // Close modal if the deleted client was being viewed
            if (selectedClient?.id === clientId) {
                setIsDetailsModalOpen(false);
                setSelectedClient(null);
            }
        } catch (error) {
            console.error('Failed to delete client:', error);
            alert('Errore durante l\'eliminazione del cliente. Riprova.');
        }
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    // EXPORT FUNCTION (New)
    const handleExportGoogleSheets = () => {
        // Headers aligned with table + info for Sheets
        const headers = [
            'Nome', 'Cognome', 'Email', 'Telefono', 'Codice Fiscale',
            'Stile Preferito', 'Indirizzo', 'Privacy Firmata',
            'Consenso Firmato', 'Broadcast WhatsApp'
        ];

        const rows = clients.map(c => [
            c.firstName,
            c.lastName,
            c.email,
            c.phone,
            c.fiscalCode || '',
            c.preferredStyle || '',
            c.address ? `${c.address.street}, ${c.address.city}` : '',
            c.privacyPolicyAccepted ? 'SI' : 'NO',
            c.informedConsentAccepted ? 'SI' : 'NO',
            c.inBroadcast ? 'SI' : 'NO'
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `inkflow_clients_export_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredClients = clients.filter(client => {
        // Basic search
        const matchesSearch = searchTerm === '' ||
            client.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.email.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        // Style filter
        if (styleFilter !== 'all' && client.preferredStyle !== styleFilter) return false;

        // Broadcast filter
        if (broadcastFilter === 'yes' && !client.inBroadcast) return false;
        if (broadcastFilter === 'no' && client.inBroadcast) return false;

        // New clients filter (last 30 days)
        if (newClientsFilter) {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const clientDate = new Date(client.createdAt);
            if (clientDate < thirtyDaysAgo) return false;
        }

        return true;
    });

    // Sort filtered clients
    const sortedClients = [...filteredClients].sort((a, b) => {
        let comparison = 0;

        switch (sortField) {
            case 'name':
                const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
                const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
                comparison = nameA.localeCompare(nameB);
                break;
            case 'email':
                comparison = a.email.toLowerCase().localeCompare(b.email.toLowerCase());
                break;
            case 'createdAt':
                comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                break;
            case 'preferredStyle':
                const styleA = a.preferredStyle || '';
                const styleB = b.preferredStyle || '';
                comparison = styleA.localeCompare(styleB);
                break;
        }

        return sortOrder === 'asc' ? comparison : -comparison;
    });

    return (
        <div className={classes.container}>
            <div className={classes.header}>
                <h1 className={classes.title}>Clients</h1>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className={classes.addBtn} onClick={handleExportGoogleSheets} style={{ background: 'rgba(15, 157, 88, 0.2)', border: '1px solid #0F9D58', color: '#0F9D58' }}>
                        <FileSpreadsheet size={20} />
                        <span>Export Sheets</span>
                    </button>
                    <button className={classes.addBtn} onClick={() => setIsImportModalOpen(true)} style={{ background: 'rgba(66, 133, 244, 0.2)', border: '1px solid #4285F4' }}>
                        <Upload size={20} />
                        <span>Importa CSV</span>
                    </button>
                    <button className={classes.addBtn} onClick={() => setIsModalOpen(true)}>
                        <Plus size={20} />
                        <span>Add Client</span>
                    </button>
                </div>
            </div>

            <div className={classes.toolbar}>
                <div className={classes.search}>
                    <Search size={18} className={classes.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        className={classes.searchInput}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    style={{
                        padding: '0.5rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        background: showFilters ? 'var(--color-primary)' : 'transparent',
                        color: showFilters ? 'white' : 'var(--color-text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    <Filter size={16} />
                    <span>Filtri Avanzati</span>
                </button>
            </div>

            {showFilters && (
                <div style={{
                    padding: '1.5rem',
                    background: 'var(--color-surface-hover)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    marginBottom: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>
                                Stile Preferito
                            </label>
                            <select
                                className={classes.searchInput}
                                value={styleFilter}
                                onChange={(e) => setStyleFilter(e.target.value as any)}
                            >
                                <option value="all">Tutti gli stili</option>
                                {AVAILABLE_TATTOO_STYLES.map(style => (
                                    <option key={style} value={style}>{style}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>
                                Ordina Per
                            </label>
                            <select
                                className={classes.searchInput}
                                value={sortField}
                                onChange={(e) => handleSort(e.target.value as SortField)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                <option value="createdAt">📅 Data Immissione</option>
                                <option value="name">👤 Nome</option>
                                <option value="email">📧 Email</option>
                                <option value="preferredStyle">🎨 Stile Preferito</option>
                            </select>
                            <button
                                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                style={{
                                    marginTop: '0.5rem',
                                    padding: '0.5rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--color-border)',
                                    background: 'var(--color-surface)',
                                    color: 'var(--color-text-secondary)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    fontSize: '0.85rem',
                                    width: '100%',
                                    justifyContent: 'center'
                                }}
                            >
                                <ArrowUpDown size={14} />
                                {sortOrder === 'asc' ? '▲ Crescente' : '▼ Decrescente'}
                            </button>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>
                                In Broadcast WhatsApp
                            </label>
                            <select
                                className={classes.searchInput}
                                value={broadcastFilter}
                                onChange={(e) => setBroadcastFilter(e.target.value as any)}
                            >
                                <option value="all">Tutti</option>
                                <option value="yes">Sì</option>
                                <option value="no">No</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>
                                Altri Filtri
                            </label>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.6rem',
                                background: 'var(--color-surface)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                cursor: 'pointer'
                            }}>
                                <input
                                    type="checkbox"
                                    checked={newClientsFilter}
                                    onChange={(e) => setNewClientsFilter(e.target.checked)}
                                    style={{ accentColor: 'var(--color-primary)' }}
                                />
                                <span style={{ fontSize: '0.9rem' }}>Nuovi Clienti (30gg)</span>
                            </label>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)' }}>
                        <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                            {sortedClients.length} clienti trovati
                        </span>
                        <button
                            onClick={() => {
                                setStyleFilter('all');
                                setBroadcastFilter('all');
                                setNewClientsFilter(false);
                                setSearchTerm('');
                            }}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                background: 'transparent',
                                color: 'var(--color-text-secondary)',
                                cursor: 'pointer',
                                fontSize: '0.9rem'
                            }}
                        >
                            Reset Filtri
                        </button>
                    </div>
                </div>
            )}

            {/* Desktop Table View */}
            <div className={`${classes.tableWrapper} ${classes.desktopOnly}`}>
                <table className={classes.table}>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Stile Preferito</th>
                            <th>In Broadcast</th>
                            <th>Last Visit</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedClients.length > 0 ? (
                            sortedClients.map(client => (
                                <tr key={client.id} className={classes.row}>
                                    <td>
                                        <div className={classes.clientName}>
                                            <div className={classes.avatar}>
                                                <UserIcon size={16} />
                                            </div>
                                            <span>{client.firstName} {client.lastName}</span>
                                        </div>
                                    </td>
                                    <td>{client.email}</td>
                                    <td>{client.phone}</td>
                                    <td>
                                        {client.preferredStyle ? (
                                            <span className={classes.tag}>{client.preferredStyle.toLowerCase()}</span>
                                        ) : (
                                            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>-</span>
                                        )}
                                    </td>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={client.inBroadcast || false}
                                            onChange={(e) => handleBroadcastToggle(client.id, e.target.checked)}
                                            style={{
                                                width: '18px',
                                                height: '18px',
                                                accentColor: '#25D366',
                                                cursor: 'pointer'
                                            }}
                                        />
                                    </td>
                                    <td style={{ color: 'var(--color-text-muted)' }}>-</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                className={classes.actionBtn}
                                                onClick={() => handleViewClient(client)}
                                            >
                                                View
                                            </button>
                                            <button
                                                className={classes.actionBtn}
                                                onClick={() => handleDeleteClient(client.id, `${client.firstName} ${client.lastName}`)}
                                                style={{
                                                    background: 'rgba(239, 68, 68, 0.1)',
                                                    color: '#ef4444',
                                                    border: '1px solid rgba(239, 68, 68, 0.3)'
                                                }}
                                                title="Elimina cliente"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                                    No clients found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className={classes.mobileOnly} style={{ paddingBottom: '5rem' }}>
                {sortedClients.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {sortedClients.map(client => (
                            <div
                                key={client.id}
                                style={{
                                    background: 'var(--color-surface)',
                                    padding: '1rem',
                                    borderRadius: 'var(--radius-lg)',
                                    border: '1px solid var(--color-border)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.75rem'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div className={classes.avatar} style={{ width: 40, height: 40 }}>
                                            <UserIcon size={20} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '600', fontSize: '1rem' }}>{client.firstName} {client.lastName}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{client.email}</div>
                                        </div>
                                    </div>
                                    {client.inBroadcast && (
                                        <span style={{ color: '#25D366', fontSize: '1.2rem' }}>✓</span>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {client.preferredStyle && (
                                        <span className={classes.tag} style={{ background: 'rgba(66, 133, 244, 0.1)', color: '#4285F4' }}>
                                            {client.preferredStyle}
                                        </span>
                                    )}
                                    <span className={classes.tag}>{client.phone}</span>
                                </div>

                                <button
                                    onClick={() => handleViewClient(client)}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        background: 'var(--color-surface-hover)',
                                        border: '1px solid var(--color-primary)',
                                        color: 'var(--color-primary)',
                                        borderRadius: 'var(--radius-md)',
                                        fontWeight: '600',
                                        marginTop: '0.5rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Modifica / Dettagli
                                </button>

                                <button
                                    onClick={() => handleDeleteClient(client.id, `${client.firstName} ${client.lastName}`)}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                        color: '#ef4444',
                                        borderRadius: 'var(--radius-md)',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    <Trash2 size={16} />
                                    Elimina Cliente
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                        Nessun cliente trovato.
                    </div>
                )}
            </div>

            <AddClientModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={loadClients}
            />

            <ImportCSVModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onSuccess={loadClients}
            />

            <ClientDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                client={selectedClient}
                onSave={handleSaveClient}
            />
        </div>
    );
}
