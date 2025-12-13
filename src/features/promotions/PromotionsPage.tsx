import { useState, useEffect } from 'react';
import { storage } from '../../lib/storage';
import { type Client, type TattooStyle } from '../../types';
import { Filter, Send, Mail, MessageCircle, Check, X } from 'lucide-react';
import classes from '../crm/ClientListPage.module.css';
import { AVAILABLE_TATTOO_STYLES } from '../../lib/constants';
import { useAuth } from '../auth/AuthContext';

export function PromotionsPage() {
    const { user } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClients, setSelectedClients] = useState<string[]>([]);
    const [styleFilter, setStyleFilter] = useState<TattooStyle | 'all'>('all');
    const [broadcastOnly, setBroadcastOnly] = useState(true);
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
        if (broadcastOnly && !client.inBroadcast) return false;
        if (styleFilter !== 'all' && client.preferredStyle !== styleFilter) return false;
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

    const sendWhatsAppBulk = () => {
        const selected = clients.filter(c => selectedClients.includes(c.id));

        if (selected.length === 0) {
            alert('Seleziona almeno un cliente');
            return;
        }

        if (!messageTemplate.trim()) {
            alert('Inserisci un messaggio');
            return;
        }

        // Open WhatsApp for each selected client
        selected.forEach((client, index) => {
            setTimeout(() => {
                const phone = client.phone.replace(/[^0-9]/g, '');
                const message = encodeURIComponent(messageTemplate);
                window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
            }, index * 500); // Stagger by 500ms to avoid blocking
        });
    };

    const sendEmailBulk = () => {
        const selected = clients.filter(c => selectedClients.includes(c.id));

        if (selected.length === 0) {
            alert('Seleziona almeno un cliente');
            return;
        }

        const emails = selected.map(c => c.email).join(',');
        const subject = encodeURIComponent('Promozione Speciale - InkFlow Tattoo Studio');
        const body = encodeURIComponent(messageTemplate);
        window.location.href = `mailto:${emails}?subject=${subject}&body=${body}`;
    };

    return (
        <div className={classes.container}>
            <div className={classes.header}>
                <h1 className={classes.title}>Promozioni</h1>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        className={classes.addBtn}
                        onClick={sendEmailBulk}
                        disabled={selectedClients.length === 0}
                        style={{
                            background: selectedClients.length === 0 ? 'rgba(100, 100, 100, 0.2)' : 'rgba(66, 133, 244, 0.2)',
                            border: `1px solid ${selectedClients.length === 0 ? '#666' : '#4285F4'}`,
                            cursor: selectedClients.length === 0 ? 'not-allowed' : 'pointer'
                        }}
                    >
                        <Mail size={20} />
                        <span>Invia Email ({selectedClients.length})</span>
                    </button>
                    <button
                        className={classes.addBtn}
                        onClick={sendWhatsAppBulk}
                        disabled={selectedClients.length === 0}
                        style={{
                            background: selectedClients.length === 0 ? 'rgba(100, 100, 100, 0.2)' : 'rgba(37, 211, 102, 0.2)',
                            border: `1px solid ${selectedClients.length === 0 ? '#666' : '#25D366'}`,
                            cursor: selectedClients.length === 0 ? 'not-allowed' : 'pointer'
                        }}
                    >
                        <MessageCircle size={20} />
                        <span>Invia WhatsApp ({selectedClients.length})</span>
                    </button>
                </div>
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
                    <Filter size={18} />
                    Filtri Clienti
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>
                            Filtra per Stile
                        </label>
                        <select
                            className={classes.searchInput}
                            value={styleFilter}
                            onChange={(e) => setStyleFilter(e.target.value as any)}
                        >
                            <option value="all">Tutti gli stili</option>
                            {AVAILABLE_TATTOO_STYLES.map((style: TattooStyle) => (
                                <option key={style} value={style}>{style}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>
                            Opzioni
                        </label>
                        <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.6rem 1rem',
                            background: 'var(--color-surface-hover)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            cursor: 'pointer'
                        }}>
                            <input
                                type="checkbox"
                                checked={broadcastOnly}
                                onChange={(e) => setBroadcastOnly(e.target.checked)}
                                style={{ accentColor: '#25D366' }}
                            />
                            <span style={{ fontSize: '0.9rem' }}>Solo clienti in Broadcast</span>
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
                        {filteredClients.length} clienti corrispondenti
                    </span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={selectAll}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                background: 'transparent',
                                color: 'var(--color-success)',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <Check size={14} />
                            Seleziona Tutti
                        </button>
                        <button
                            onClick={deselectAll}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                background: 'transparent',
                                color: 'var(--color-error)',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <X size={14} />
                            Deseleziona Tutti
                        </button>
                    </div>
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
                    Messaggio Promozionale
                </h3>

                <textarea
                    className={classes.searchInput}
                    rows={6}
                    value={messageTemplate}
                    onChange={(e) => setMessageTemplate(e.target.value)}
                    placeholder="Scrivi il tuo messaggio promozionale qui...

Esempio:
🎨 Ciao! Abbiamo una promozione speciale per te!
Dal 15 al 31 gennaio: 20% di sconto su tutti i tatuaggi in stile geometrico!

Prenota subito il tuo appuntamento! 📅

InkFlow Tattoo Studio"
                    style={{
                        width: '100%',
                        lineHeight: '1.6',
                        resize: 'vertical'
                    }}
                />

                <div style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    background: 'rgba(255, 107, 53, 0.1)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem',
                    color: 'var(--color-text-secondary)'
                }}>
                    💡 <strong>Suggerimento:</strong> Personalizza il messaggio in base allo stile selezionato per aumentare l'engagement!
                </div>
            </div>

            {/* Clients List */}
            <div className={classes.tableWrapper}>
                {filteredClients.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '3rem',
                        background: 'var(--color-surface)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--color-border)'
                    }}>
                        <p style={{ fontSize: '1.1rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                            Nessun cliente trovato
                        </p>
                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                            Modifica i filtri per vedere più clienti
                        </p>
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
                                <th>Nome</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Stile Preferito</th>
                                <th>Broadcast</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredClients.map(client => (
                                <tr key={client.id} className={classes.row}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={selectedClients.includes(client.id)}
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
                                        <strong>{client.firstName} {client.lastName}</strong>
                                    </td>
                                    <td>{client.email}</td>
                                    <td>{client.phone}</td>
                                    <td>
                                        {client.preferredStyle ? (
                                            <span className={classes.tag}>{client.preferredStyle}</span>
                                        ) : (
                                            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>-</span>
                                        )}
                                    </td>
                                    <td>
                                        {client.inBroadcast ? (
                                            <span style={{ color: '#25D366', fontSize: '1.2rem' }}>✓</span>
                                        ) : (
                                            <span style={{ color: 'var(--color-text-muted)' }}>-</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
