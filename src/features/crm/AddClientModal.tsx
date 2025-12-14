import { useState, useRef } from 'react';
import { X, Upload, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { storage } from '../../lib/storage';
import { type Client, type TattooStyle } from '../../types';
import classes from './ClientListPage.module.css';
import loginClasses from '../auth/LoginPage.module.css';
import { useAuth } from '../auth/AuthContext';

interface AddClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function AddClientModal({ isOpen, onClose, onSuccess }: AddClientModalProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false); // State for file upload

    // We generate a ID on mount/init so we can use it for folder path before saving
    // Using a state initialized with uuidv4 ensures it stays constant across re-renders until closed/reset
    const [newClientId] = useState(uuidv4());

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        fiscalCode: '',
        birthDate: '',
        birthPlace: '',
        street: '',
        city: '',
        zip: '',
        municipality: '',
        email: '',
        phone: '',
        styles: [] as TattooStyle[],
        preferredStyle: '' as TattooStyle | '',
        inBroadcast: false,
        notes: '',
        attachments: [] as string[],
        privacyAccepted: false,
        informedConsentAccepted: false
    });

    const availableStyles: TattooStyle[] = [
        'REALISTICO',
        'MICRO_REALISTICO',
        'MINIMAL',
        'GEOMETRICO',
        'TRADIZIONALE',
        'GIAPPONESE',
        'BLACKWORK',
        'WATERCOLOR',
        'TRIBAL',
        'OLD_SCHOOL',
        'NEW_SCHOOL',
        'LETTERING',
        'ALTRO'
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user?.tenantId) {
            alert('Errore: Nessun studio attivo identificato.');
            return;
        }

        setLoading(true);

        const newClient: Client = {
            id: newClientId, // Use the pre-generated ID
            tenantId: user.tenantId,
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            fiscalCode: formData.fiscalCode,
            birthDate: formData.birthDate,
            birthPlace: formData.birthPlace,
            address: {
                street: formData.street,
                city: formData.city,
                zip: formData.zip,
                municipality: formData.municipality,
                country: 'Italia'
            },
            preferences: {
                styles: formData.styles,
                notes: formData.notes
            },
            preferredStyle: formData.preferredStyle || undefined,
            inBroadcast: formData.inBroadcast,
            consents: {
                privacy: formData.privacyAccepted,
                informedConsent: formData.informedConsentAccepted,
                privacyDate: formData.privacyAccepted ? new Date().toISOString() : undefined,
                informedConsentDate: formData.informedConsentAccepted ? new Date().toISOString() : undefined
            },
            attachments: formData.attachments,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),

            // Root flags for easier access
            privacyPolicyAccepted: formData.privacyAccepted,
            privacyPolicyDate: formData.privacyAccepted ? new Date().toISOString() : undefined,
            informedConsentAccepted: formData.informedConsentAccepted,
            informedConsentDate: formData.informedConsentAccepted ? new Date().toISOString() : undefined
        };

        try {
            await storage.saveClient(newClient);
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to save client:', error);
            alert('Errore durante il salvataggio. Riprova.');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        setUploading(true);

        try {
            // Use the newClientId for the folder path
            const path = `clients/${newClientId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
            const url = await storage.uploadFile(file, path);
            setFormData(prev => ({ ...prev, attachments: [...prev.attachments, url] }));
        } catch (err: any) {
            console.error(err);
            alert("Errore caricamento file: " + err.message);
        } finally {
            setUploading(false);
        }
    };

    const toggleStyle = (style: TattooStyle) => {
        if (formData.styles.includes(style)) {
            setFormData({ ...formData, styles: formData.styles.filter(s => s !== style) });
        } else {
            setFormData({ ...formData, styles: [...formData.styles, style] });
        }
    };

    // Old addAttachment via URL prompt is removed/replaced by file upload

    const removeAttachment = (index: number) => {
        setFormData({
            ...formData,
            attachments: formData.attachments.filter((_, i) => i !== index)
        });
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 100, overflowY: 'auto', padding: '2rem'
        }}>
            <div style={{
                backgroundColor: 'var(--color-surface)', padding: '2rem', borderRadius: 'var(--radius-lg)',
                width: '100%', maxWidth: '800px', border: '1px solid var(--color-border)',
                maxHeight: '90vh', overflowY: 'auto'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', position: 'sticky', top: 0, background: 'var(--color-surface)', paddingBottom: '1rem', zIndex: 10 }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Nuovo Cliente</h2>
                    <button onClick={onClose}><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Dati Anagrafici */}
                    <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--color-primary)' }}>Dati Anagrafici</h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div className={loginClasses.group}>
                                <label className={loginClasses.label}>Nome *</label>
                                <input required className={loginClasses.input}
                                    value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} />
                            </div>
                            <div className={loginClasses.group}>
                                <label className={loginClasses.label}>Cognome</label>
                                <input className={loginClasses.input}
                                    value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} />
                            </div>
                        </div>

                        <div className={loginClasses.group} style={{ marginBottom: '1rem' }}>
                            <label className={loginClasses.label}>Codice Fiscale</label>
                            <input className={loginClasses.input} maxLength={16} pattern="[A-Z0-9]{16}"
                                placeholder="RSSMRA80A01H501U"
                                value={formData.fiscalCode}
                                onChange={e => setFormData({ ...formData, fiscalCode: e.target.value.toUpperCase() })} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className={loginClasses.group}>
                                <label className={loginClasses.label}>Data di Nascita</label>
                                <input type="date" className={loginClasses.input}
                                    value={formData.birthDate} onChange={e => setFormData({ ...formData, birthDate: e.target.value })} />
                            </div>
                            <div className={loginClasses.group}>
                                <label className={loginClasses.label}>Luogo di Nascita</label>
                                <input className={loginClasses.input} placeholder="Roma"
                                    value={formData.birthPlace} onChange={e => setFormData({ ...formData, birthPlace: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    {/* Residenza */}
                    <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--color-primary)' }}>Residenza</h3>

                        <div className={loginClasses.group} style={{ marginBottom: '1rem' }}>
                            <label className={loginClasses.label}>Indirizzo</label>
                            <input className={loginClasses.input} placeholder="Via Roma, 123"
                                value={formData.street} onChange={e => setFormData({ ...formData, street: e.target.value })} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div className={loginClasses.group}>
                                <label className={loginClasses.label}>Città</label>
                                <input className={loginClasses.input} placeholder="Milano"
                                    value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                            </div>
                            <div className={loginClasses.group}>
                                <label className={loginClasses.label}>CAP</label>
                                <input className={loginClasses.input} maxLength={5} pattern="[0-9]{5}" placeholder="20100"
                                    value={formData.zip} onChange={e => setFormData({ ...formData, zip: e.target.value })} />
                            </div>
                        </div>

                        <div className={loginClasses.group}>
                            <label className={loginClasses.label}>Comune</label>
                            <input className={loginClasses.input} placeholder="Milano"
                                value={formData.municipality} onChange={e => setFormData({ ...formData, municipality: e.target.value })} />
                        </div>
                    </div>

                    {/* Contatti */}
                    <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--color-primary)' }}>Contatti</h3>

                        <div className={loginClasses.group} style={{ marginBottom: '1rem' }}>
                            <label className={loginClasses.label}>Email</label>
                            <input type="email" className={loginClasses.input} placeholder="nome@esempio.it"
                                value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                        </div>

                        <div className={loginClasses.group}>
                            <label className={loginClasses.label}>Numero di Telefono</label>
                            <input type="tel" className={loginClasses.input} placeholder="+39 333 1234567"
                                value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                        </div>
                    </div>

                    {/* Preferenze */}
                    <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--color-primary)' }}>Preferenze</h3>

                        <div className={loginClasses.group} style={{ marginBottom: '1rem' }}>
                            <label className={loginClasses.label}>Stile Preferito Principale</label>
                            <select
                                className={loginClasses.input}
                                value={formData.preferredStyle}
                                onChange={e => setFormData({ ...formData, preferredStyle: e.target.value as TattooStyle })}
                            >
                                <option value="">-- Seleziona --</option>
                                {availableStyles.map(style => (
                                    <option key={style} value={style}>{style}</option>
                                ))}
                            </select>
                        </div>

                        <div className={loginClasses.group} style={{ marginBottom: '1rem' }}>
                            <label className={loginClasses.label}>Stili Preferiti</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {availableStyles.map(style => (
                                    <button
                                        key={style}
                                        type="button"
                                        onClick={() => toggleStyle(style)}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            borderRadius: '999px',
                                            border: '1px solid var(--color-border)',
                                            background: formData.styles.includes(style) ? 'var(--color-primary)' : 'transparent',
                                            color: formData.styles.includes(style) ? 'white' : 'var(--color-text-secondary)',
                                            fontSize: '0.8rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {style}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className={loginClasses.group} style={{ marginBottom: '1rem' }}>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                cursor: 'pointer',
                                padding: '0.75rem',
                                background: 'rgba(255,255,255,0.02)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)'
                            }}>
                                <input
                                    type="checkbox"
                                    checked={formData.inBroadcast}
                                    onChange={e => setFormData({ ...formData, inBroadcast: e.target.checked })}
                                    style={{
                                        width: '18px',
                                        height: '18px',
                                        accentColor: 'var(--color-primary)',
                                        cursor: 'pointer'
                                    }}
                                />
                                <span className={loginClasses.label} style={{ margin: 0 }}>
                                    Includi in Lista Broadcast WhatsApp
                                </span>
                            </label>
                            <small style={{
                                display: 'block',
                                marginTop: '0.5rem',
                                color: 'var(--color-text-secondary)',
                                fontSize: '0.85rem'
                            }}>
                                Se attivo, il cliente riceverà promozioni e aggiornamenti via WhatsApp
                            </small>
                        </div>

                        <div className={loginClasses.group}>
                            <label className={loginClasses.label}>Note</label>
                            <textarea className={loginClasses.input} rows={3} placeholder="Note aggiuntive..."
                                value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                        </div>
                    </div>

                    {/* Consensi Iniziali (Opzionale) */}
                    <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--color-primary)' }}>Stato Documenti</h3>
                        <div className={loginClasses.group} style={{ marginBottom: '0.5rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={formData.privacyAccepted}
                                    onChange={e => setFormData({ ...formData, privacyAccepted: e.target.checked })}
                                    style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
                                />
                                <span className={loginClasses.label} style={{ margin: 0 }}>Privacy Policy già firmata (cartaceo/precedente)</span>
                            </label>
                        </div>
                        <div className={loginClasses.group}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={formData.informedConsentAccepted}
                                    onChange={e => setFormData({ ...formData, informedConsentAccepted: e.target.checked })}
                                    style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
                                />
                                <span className={loginClasses.label} style={{ margin: 0 }}>Consenso Informato già firmato</span>
                            </label>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.5rem', marginLeft: '26px' }}>
                            Se lasciati vuoti, potrai richiedere la firma digitale dalla sezione <strong>Consensi</strong>.
                        </p>
                    </div>

                    {/* Allegati */}
                    <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--color-primary)', marginTop: '1rem' }}>Allegati</h3>

                        <label
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.05)',
                                border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)',
                                color: 'var(--color-text-secondary)', cursor: uploading ? 'wait' : 'pointer', marginBottom: '1rem',
                                width: 'fit-content'
                            }}>
                            <Upload size={18} />
                            {uploading ? 'Caricamento...' : 'Carica Immagine/Documento'}
                            <input
                                type="file"
                                disabled={uploading}
                                onChange={handleFileUpload}
                                style={{ display: 'none' }}
                                accept="image/*,application/pdf"
                            />
                        </label>

                        {formData.attachments.length > 0 && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
                                {formData.attachments.map((url, index) => (
                                    <div key={index} style={{
                                        position: 'relative', background: 'var(--color-surface-hover)',
                                        borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--color-border)'
                                    }}>
                                        <img src={url} alt={`Attachment ${index + 1}`}
                                            style={{ width: '100%', height: '120px', objectFit: 'cover' }}
                                            onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23333" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23666"%3ENo Image%3C/text%3E%3C/svg%3E' }}
                                        />
                                        <button type="button" onClick={() => removeAttachment(index)}
                                            style={{
                                                position: 'absolute', top: '4px', right: '4px',
                                                background: 'var(--color-error)', color: 'white',
                                                padding: '4px', borderRadius: '4px', display: 'flex',
                                                cursor: 'pointer', border: 'none'
                                            }}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <button type="submit" className={classes.addBtn}
                        disabled={loading || uploading}
                        style={{ justifyContent: 'center', marginTop: '1rem' }}>
                        {loading ? 'Salvataggio...' : 'Salva Cliente'}
                    </button>
                </form>
            </div>
        </div>
    );
}
