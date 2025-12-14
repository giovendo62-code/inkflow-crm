import { useState, useEffect } from 'react';
import { storage } from '../../lib/storage';
import { type Client, type TattooStyle } from '../../types';
import { Filter, Send, Mail, MessageCircle, Check, X, Search, Smartphone } from 'lucide-react';
import classes from '../crm/ClientListPage.module.css';
import { AVAILABLE_TATTOO_STYLES } from '../../lib/constants';
import { useAuth } from '../auth/AuthContext';

export function PromotionsPage() {
    const { user } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClients, setSelectedClients] = useState<string[]>([]);
    const [styleFilter, setStyleFilter] = useState<TattooStyle | 'all'>('all');
    const [broadcastOnly, setBroadcastOnly] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [messageTemplate, setMessageTemplate] = useState('');

    useEffect(() => {
        const loadClients = async () => {
            if (!user?.tenantId) return;
            const allClients = await storage.getClients(user.tenantId);
            setClients(allClients);
        };
        loadClients();
    }, [user?.tenantId]);

    const filteredClients = clients.filter(client => {
        // Filter by broadcast flag
        if (broadcastOnly && !client.inBroadcast) return false;

        // Filter by style
        if (styleFilter !== 'all' && client.preferredStyle !== styleFilter) return false;

        // Filter by search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            const fullName = `${client.firstName} ${client.lastName}`.toLowerCase();
            const phone = client.phone.replace(/[^0-9]/g, '');
            return fullName.includes(term) || phone.includes(term) || client.firstName.toLowerCase().includes(term) || client.lastName.toLowerCase().includes(term);
        }

        return true;
    });

    const toggleClient = (clientId: string) => {
        if (selectedClients.includes(clientId)) {
            setSelectedClients(selectedClients.filter(id => id !== clientId));
        } else {
            setSelectedClients([...selectedClients, clientId]);
        }
    };

    const selectAll = () => {
        setSelectedClients(filteredClients.map(c => c.id));
    };

    const deselectAll = () => {
        setSelectedClients([]);
    };

    const handleSendWhatsApp = (client: Client) => {
        if (!messageTemplate.trim()) {
            alert('Inserisci prima un messaggio promozionale nel box sopra.');
            return;
        }

        const phone = client.phone.replace(/[^0-9]/g, '');
        // Default to Italian prefix if missing and looks like clear number
        const formattedPhone = phone.startsWith('3') && phone.length === 10 ? `39${phone}` : phone;

        const message = encodeURIComponent(messageTemplate);
        window.open(`https://wa.me/${formattedPhone}?text=${message}`, '_blank');
    };

    return (
        <div className={classes.container}>
            <div className={classes.header}>
                <h1 className={classes.title}>Promozioni</h1>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {/* Bulk Actions removed as per user request for manual control, keeping Email for now or removing? User focused on WA. Keeping Email as backup. */}
                    <button
                        className={classes.addBtn}
                        onClick={() => {
                            const selected = clients.filter(c => selectedClients.includes(c.id));
                            if (selected.length === 0) return;
                            const emails = selected.map(c => c.email).join(',');
                            const subject = encodeURIComponent('Promozione Speciale');
                            const body = encodeURIComponent(messageTemplate);
                            window.location.href = `mailto:${emails}?subject=${subject}&body=${body}`;
                        }}
                        disabled={selectedClients.length === 0}
                        style={{
                            background: selectedClients.length === 0 ? 'rgba(100, 100, 100, 0.2)' : 'rgba(66, 133, 244, 0.2)',
                            border: `1px solid ${selectedClients.length === 0 ? '#666' : '#4285F4'}`,
                            cursor: selectedClients.length === 0 ? 'not-allowed' : 'pointer'
                        }}
                    >
                        <Mail size={20} />
                        <span>Email Multipla ({selectedClients.length})</span>
                    </button>
                </div>
            </div>

            {/* Message Template */}
            <div style={{
                marginBottom: '1.5rem',
                padding: '1.5rem',
                background: 'var(--color-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)'
            }}>
                <h3 style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    <Send size={18} />
                    1. Scrivi Messaggio Promozionale
                </h3>

                <textarea
                    className={classes.formInput}
                    rows={6}
                    value={messageTemplate}
                    onChange={(e) => setMessageTemplate(e.target.value)}
                    placeholder="Scrivi qui il testo della promozione...

Esempio:
Ciao! 🎨 Dal 15 al 30 del mese sconto del 20% sui tatuaggi Realistici! Rispondi a questo messaggio per prenotare."
                    style={{
                        width: '100%',
                        lineHeight: '1.6',
                        resize: 'vertical',
                        marginBottom: '0.5rem'
                    }}
                />
            </div>

            {/* Filter Section */}
            <div style={{
                marginBottom: '1.5rem',
                padding: '1.5rem',
                background: 'var(--color-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)'
            }}>
                <h3 style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    <Search size={18} />
                    2. Cerca e Seleziona Clienti
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>

                    {/* Search Input */}
                    <div className={classes.search}>
                        <Search className={classes.searchIcon} size={20} />
                        <input
                            type="text"
                            className={classes.searchInput}
                            placeholder="Cerca nome o telefono..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div>
                        <select
                            className={classes.formInput}
                            value={styleFilter}
                            onChange={(e) => setStyleFilter(e.target.value as any)}
                        >
                            <option value="all">Tutti gli stili</option>
                            {AVAILABLE_TATTOO_STYLES.map((style: TattooStyle) => (
                                <option key={style} value={style}>{style}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.6rem 1rem',
                            background: 'var(--color-surface-hover)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            cursor: 'pointer',
                            width: '100%'
                        }}>
                            <input
                                type="checkbox"
                                checked={broadcastOnly}
                                onChange={(e) => setBroadcastOnly(e.target.checked)}
                                style={{ accentColor: '#25D366' }}
                            />
                            <span style={{ fontSize: '0.9rem' }}>Solo Broadcast</span>
                        </label>
                    </div>
                </div>

                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '1rem',
                    borderTop: '1px solid var(--color-border)'
                }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                        {filteredClients.length} clienti trovati
                    </span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={selectAll}
                            className={classes.addBtn}
                            style={{ background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-primary)' }}
                        >
                            <Check size={14} /> Seleziona Tutti
                        </button>
                        <button
                            onClick={deselectAll}
                            className={classes.addBtn}
                            style={{ background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-error)' }}
                        >
                            <X size={14} /> Deseleziona
                        </button>
                    </div>
                </div>
            </div>

            {/* Clients List */}
            <div className={classes.tableWrapper}>
                {filteredClients.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        Nessun cliente corrisponde ai criteri di ricerca
                    </div>
                ) : (
                    <table className={classes.table}>
                        <thead>
                            <tr>
                                <th style={{ width: '50px' }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedClients.length === filteredClients.length && filteredClients.length > 0}
                                        onChange={(e) => e.target.checked ? selectAll() : deselectAll()}
                                        style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                                    />
                                </th>
                                <th>Clienti Selezionati ({selectedClients.filter(id => filteredClients.find(c => c.id === id)).length})</th>
                                <th>WhatsApp</th>
                                <th className={classes.desktopOnly}>Stile</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredClients.map(client => {
                                const isSelected = selectedClients.includes(client.id);
                                return (
                                    <tr key={client.id} className={classes.row} style={{ background: isSelected ? 'rgba(37, 211, 102, 0.05)' : undefined }}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleClient(client.id)}
                                                style={{
                                                    cursor: 'pointer',
                                                    width: '18px',
                                                    height: '18px',
                                                    accentColor: 'var(--color-primary)'
                                                }}
                                            />
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: '600', fontSize: '1rem' }}>{client.firstName} {client.lastName}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Smartphone size={14} />
                                                {client.phone}
                                            </div>
                                        </td>
                                        <td>
                                            {isSelected ? (
                                                <button
                                                    onClick={() => handleSendWhatsApp(client)}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.5rem',
                                                        background: '#25D366',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '0.5rem 1rem',
                                                        borderRadius: '999px',
                                                        fontWeight: '600',
                                                        cursor: 'pointer',
                                                        boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                                                    }}
                                                >
                                                    <MessageCircle size={18} />
                                                    Invia Promo
                                                </button>
                                            ) : (
                                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                                                    Seleziona per inviare
                                                </span>
                                            )}
                                        </td>
                                        <td className={classes.desktopOnly}>
                                            {client.preferredStyle && <span className={classes.tag}>{client.preferredStyle}</span>}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
