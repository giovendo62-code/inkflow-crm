import { useState, useEffect } from 'react';
import { type Client, type TattooStyle } from '../../types';
import { X, User, Mail, Phone, MapPin, Calendar, FileText, MessageSquare } from 'lucide-react';
import classes from './ClientListPage.module.css';
import { AVAILABLE_TATTOO_STYLES } from '../../lib/constants';

interface ClientDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    client: Client | null;
    onSave: (client: Client) => void;
}

export function ClientDetailsModal({ isOpen, onClose, client, onSave }: ClientDetailsModalProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Client | null>(null);

    useEffect(() => {
        if (client) {
            setFormData(client);
            setIsEditing(false);
        }
    }, [client]);

    if (!isOpen || !client || !formData) return null;

    const handleSave = () => {
        if (formData) {
            const updatedClient = {
                ...formData,
                updatedAt: new Date().toISOString()
            };
            onSave(updatedClient);
            setIsEditing(false);
            onClose();
        }
    };

    const handleChange = (field: keyof Client, value: any) => {
        if (formData) {
            setFormData({ ...formData, [field]: value });
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '1rem'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: 'var(--color-surface)',
                    borderRadius: 'var(--radius-lg)',
                    width: '100%',
                    maxWidth: '800px',
                    maxHeight: '90vh',
                    overflow: 'auto',
                    position: 'relative'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    position: 'sticky',
                    top: 0,
                    background: 'var(--color-surface)',
                    zIndex: 10
                }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <User size={24} />
                        {formData.firstName} {formData.lastName}
                    </h2>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {!isEditing ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--color-primary)',
                                    background: 'var(--color-primary)',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    fontWeight: '500'
                                }}
                            >
                                Modifica
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={() => {
                                        setFormData(client);
                                        setIsEditing(false);
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
                                    Annulla
                                </button>
                                <button
                                    onClick={handleSave}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--color-success)',
                                        background: 'var(--color-success)',
                                        color: 'white',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        fontWeight: '500'
                                    }}
                                >
                                    Salva
                                </button>
                            </>
                        )}
                        <button
                            onClick={onClose}
                            style={{
                                padding: '0.5rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                background: 'transparent',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Personal Info */}
                    <section>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <User size={18} />
                            Informazioni Personali
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                    Nome
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        className={classes.searchInput}
                                        value={formData.firstName}
                                        onChange={(e) => handleChange('firstName', e.target.value)}
                                    />
                                ) : (
                                    <p style={{ fontSize: '0.95rem' }}>{formData.firstName}</p>
                                )}
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                    Cognome
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        className={classes.searchInput}
                                        value={formData.lastName}
                                        onChange={(e) => handleChange('lastName', e.target.value)}
                                    />
                                ) : (
                                    <p style={{ fontSize: '0.95rem' }}>{formData.lastName}</p>
                                )}
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                    Codice Fiscale
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        className={classes.searchInput}
                                        value={formData.fiscalCode}
                                        onChange={(e) => handleChange('fiscalCode', e.target.value)}
                                    />
                                ) : (
                                    <p style={{ fontSize: '0.95rem' }}>{formData.fiscalCode || '-'}</p>
                                )}
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                    Data di Nascita
                                </label>
                                {isEditing ? (
                                    <input
                                        type="date"
                                        className={classes.searchInput}
                                        value={formData.birthDate}
                                        onChange={(e) => handleChange('birthDate', e.target.value)}
                                    />
                                ) : (
                                    <p style={{ fontSize: '0.95rem' }}>{formData.birthDate || '-'}</p>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Contact Info */}
                    <section>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Mail size={18} />
                            Contatti
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                    <Mail size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
                                    Email
                                </label>
                                {isEditing ? (
                                    <input
                                        type="email"
                                        className={classes.searchInput}
                                        value={formData.email}
                                        onChange={(e) => handleChange('email', e.target.value)}
                                    />
                                ) : (
                                    <p style={{ fontSize: '0.95rem' }}>{formData.email}</p>
                                )}
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                    <Phone size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
                                    Telefono
                                </label>
                                {isEditing ? (
                                    <input
                                        type="tel"
                                        className={classes.searchInput}
                                        value={formData.phone}
                                        onChange={(e) => handleChange('phone', e.target.value)}
                                    />
                                ) : (
                                    <p style={{ fontSize: '0.95rem' }}>{formData.phone}</p>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Address */}
                    <section>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <MapPin size={18} />
                            Indirizzo
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                    Via
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        className={classes.searchInput}
                                        value={formData.street}
                                        onChange={(e) => handleChange('street', e.target.value)}
                                    />
                                ) : (
                                    <p style={{ fontSize: '0.95rem' }}>{formData.street || '-'}</p>
                                )}
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                    Città
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        className={classes.searchInput}
                                        value={formData.city}
                                        onChange={(e) => handleChange('city', e.target.value)}
                                    />
                                ) : (
                                    <p style={{ fontSize: '0.95rem' }}>{formData.city || '-'}</p>
                                )}
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                    CAP
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        className={classes.searchInput}
                                        value={formData.zip}
                                        onChange={(e) => handleChange('zip', e.target.value)}
                                    />
                                ) : (
                                    <p style={{ fontSize: '0.95rem' }}>{formData.zip || '-'}</p>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Preferences */}
                    <section>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FileText size={18} />
                            Preferenze Tatuaggi
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                    Stile Preferito
                                </label>
                                {isEditing ? (
                                    <select
                                        className={classes.searchInput}
                                        value={formData.preferredStyle || ''}
                                        onChange={(e) => handleChange('preferredStyle', e.target.value || undefined)}
                                    >
                                        <option value="">-- Nessuno --</option>
                                        {AVAILABLE_TATTOO_STYLES.map(style => (
                                            <option key={style} value={style}>{style}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <p style={{ fontSize: '0.95rem' }}>{formData.preferredStyle || '-'}</p>
                                )}
                            </div>
                            <div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: isEditing ? 'pointer' : 'default' }}>
                                    {isEditing && (
                                        <input
                                            type="checkbox"
                                            checked={formData.inBroadcast || false}
                                            onChange={(e) => handleChange('inBroadcast', e.target.checked)}
                                            style={{ width: '18px', height: '18px', accentColor: '#25D366' }}
                                        />
                                    )}
                                    <MessageSquare size={14} color="#25D366" />
                                    <span style={{ fontSize: '0.9rem' }}>
                                        {formData.inBroadcast ? '✓ In Lista Broadcast WhatsApp' : 'Non in Broadcast'}
                                    </span>
                                </label>
                            </div>
                        </div>
                    </section>

                    {/* Notes */}
                    {formData.notes && (
                        <section>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>
                                Note
                            </h3>
                            {isEditing ? (
                                <textarea
                                    className={classes.searchInput}
                                    rows={4}
                                    value={formData.notes}
                                    onChange={(e) => handleChange('notes', e.target.value)}
                                    style={{ width: '100%', resize: 'vertical' }}
                                />
                            ) : (
                                <p style={{ fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>{formData.notes}</p>
                            )}
                        </section>
                    )}

                    {/* Metadata */}
                    <section style={{ paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                        <div style={{ display: 'flex', gap: '2rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                            <div>
                                <Calendar size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
                                Creato: {new Date(formData.createdAt).toLocaleDateString('it-IT')}
                            </div>
                            <div>
                                <Calendar size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
                                Modificato: {new Date(formData.updatedAt).toLocaleDateString('it-IT')}
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
