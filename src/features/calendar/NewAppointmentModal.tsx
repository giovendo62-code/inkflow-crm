import { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Clock, User as UserIcon, MessageCircle, Bell, Mail, FileText, Upload, Image } from 'lucide-react';
import { type Appointment, type Client, type User, type TattooStyle } from '../../types';
import { storage } from '../../lib/storage';
import { useAuth } from '../auth/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import classes from '../crm/ClientListPage.module.css';

interface NewAppointmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    initialDate?: Date;
}

export function NewAppointmentModal({ isOpen, onClose, onSave, initialDate }: NewAppointmentModalProps) {
    const { user } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [artists, setArtists] = useState<User[]>([]);

    // Form State
    const [title, setTitle] = useState('');
    const [clientId, setClientId] = useState('');
    const [artistId, setArtistId] = useState(user?.id || '');
    const [date, setDate] = useState(initialDate ? initialDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    const [startTime, setStartTime] = useState(initialDate ? initialDate.toTimeString().slice(0, 5) : '10:00');
    const [duration, setDuration] = useState(60); // minutes

    // Extended Fields
    const [priceQuote, setPriceQuote] = useState<number>(0);
    const [depositAmount, setDepositAmount] = useState<number>(0);
    const [tattooStyle, setTattooStyle] = useState<string>('');
    const [notes, setNotes] = useState('');
    const [attachments, setAttachments] = useState<string[]>([]);
    const [clientSearch, setClientSearch] = useState('');

    // Reminders State - Default TRUE as requested
    const [reminders, setReminders] = useState({
        whatsapp: true,
        sms: true,
        email: true
    });

    useEffect(() => {
        if (isOpen) {
            const loadData = async () => {
                if (!user?.tenantId) return;
                const loadedClients = await storage.getClients(user.tenantId);
                const loadedUsers = await storage.getUsers(user.tenantId);
                setClients(loadedClients);
                setArtists(loadedUsers.filter(u => u.role === 'ARTIST'));
            };
            loadData();

            if (initialDate) {
                setDate(initialDate.toISOString().split('T')[0]);
                setStartTime(initialDate.toTimeString().slice(0, 5));
            }
        }
    }, [isOpen, initialDate]);

    const [uploading, setUploading] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setUploading(true);
            const files = Array.from(e.target.files);

            try {
                const uploadPromises = files.map(async (file) => {
                    // Generate a unique path: appointments/{Date}-{Random}-{Name}
                    const path = `appointments/${Date.now()}-${Math.floor(Math.random() * 1000)}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
                    try {
                        const publicUrl = await storage.uploadFile(file, path);
                        return publicUrl;
                    } catch (err) {
                        console.error("Error uploading file:", file.name, err);
                        return null;
                    }
                });

                const uploadedUrls = await Promise.all(uploadPromises);
                const validUrls = uploadedUrls.filter(url => url !== null) as string[];

                setAttachments(prev => [...prev, ...validUrls]);
            } catch (error) {
                console.error("Main upload error:", error);
                alert("Errore durante il caricamento delle immagini");
            } finally {
                setUploading(false);
            }
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const startDateTime = new Date(`${date}T${startTime}`);
        const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

        if (!user?.tenantId) {
            alert('Errore: Nessun studio attivo identificato.');
            return;
        }

        const newAppointment: Appointment = {
            id: uuidv4(),
            tenantId: user.tenantId,
            clientId,
            artistId: user?.role === 'MANAGER' ? artistId : user!.id,
            title: title || 'Nuovo Appuntamento',
            description: '',
            startTime: startDateTime.toISOString(),
            endTime: endDateTime.toISOString(),
            serviceType: 'Tattoo',
            tattooStyle: (tattooStyle || undefined) as any,
            status: 'SCHEDULED',
            reminders,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            financials: {
                priceQuote: priceQuote,
                depositAmount: depositAmount,
                depositPaid: false
            },
            notes,
            attachments
        };

        try {
            await storage.saveAppointment(newAppointment);
            resetForm();
            onSave();
            onClose();
        } catch (error) {
            console.error('Failed to save appointment:', error);
            alert('Errore salvataggio appuntamento');
        }
    };

    const resetForm = () => {
        setTitle('');
        setClientId('');
        setDuration(60);
        setPriceQuote(0);
        setDepositAmount(0);
        setTattooStyle('');
        setNotes('');
        setAttachments([]);
        setReminders({ whatsapp: true, sms: true, email: true });
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 100, padding: '1rem'
        }}>
            <div style={{
                backgroundColor: 'var(--color-surface)',
                borderRadius: 'var(--radius-lg)',
                width: '100%', maxWidth: '800px', // Wider modal for more content
                border: '1px solid var(--color-border)',
                maxHeight: '95vh',
                overflowY: 'auto'
            }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Nuovo Appuntamento</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Top Section: Basic Info */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

                        {/* Left Column: Who & What */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {/* Title */}
                            <div className={classes.group}>
                                <label className={classes.label}>Titolo (Opzionale)</label>
                                <input
                                    className={classes.searchInput}
                                    style={{ width: '100%' }}
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="Es. Seduta Braccio"
                                />
                            </div>

                            <div className={classes.group}>
                                <label className={classes.label}>Cliente</label>
                                <input
                                    className={classes.searchInput}
                                    style={{ width: '100%', marginBottom: '0.5rem' }}
                                    placeholder="🔍 Cerca per nome, cognome, email..."
                                    value={clientSearch}
                                    onChange={e => setClientSearch(e.target.value)}
                                />
                                <select
                                    className={classes.searchInput}
                                    style={{ width: '100%' }}
                                    value={clientId}
                                    onChange={e => setClientId(e.target.value)}
                                    required
                                    size={5}
                                >
                                    <option value="">Seleziona Cliente...</option>
                                    {clients
                                        .filter(c => {
                                            if (!clientSearch) return true;
                                            const search = clientSearch.toLowerCase();
                                            return (
                                                c.firstName.toLowerCase().includes(search) ||
                                                c.lastName.toLowerCase().includes(search) ||
                                                c.email.toLowerCase().includes(search) ||
                                                c.phone.includes(search)
                                            );
                                        })
                                        .map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.firstName} {c.lastName} ({c.email})
                                            </option>
                                        ))
                                    }
                                </select>
                            </div>

                            {user?.role === 'MANAGER' && (
                                <div className={classes.group}>
                                    <label className={classes.label}>Artista</label>
                                    <select
                                        className={classes.searchInput}
                                        style={{ width: '100%' }}
                                        value={artistId}
                                        onChange={e => setArtistId(e.target.value)}
                                        required
                                    >
                                        {artists.map(a => (
                                            <option key={a.id} value={a.id}>{a.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Right Column: When */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className={classes.group}>
                                <label className={classes.label}>Data</label>
                                <div style={{ position: 'relative' }}>
                                    <CalendarIcon size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--color-text-muted)' }} />
                                    <input
                                        type="date"
                                        className={classes.searchInput}
                                        style={{ width: '100%', paddingLeft: '2.5rem' }}
                                        value={date}
                                        onChange={e => setDate(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div className={classes.group} style={{ flex: 1 }}>
                                    <label className={classes.label}>Ora Inizio</label>
                                    <div style={{ position: 'relative' }}>
                                        <Clock size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--color-text-muted)' }} />
                                        <input
                                            type="time"
                                            className={classes.searchInput}
                                            style={{ width: '100%', paddingLeft: '2.5rem' }}
                                            value={startTime}
                                            onChange={e => setStartTime(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className={classes.group} style={{ flex: 1 }}>
                                    <label className={classes.label}>Durata (min)</label>
                                    <select
                                        className={classes.searchInput}
                                        style={{ width: '100%' }}
                                        value={duration}
                                        onChange={e => setDuration(Number(e.target.value))}
                                    >
                                        <option value="30">30 min</option>
                                        <option value="60">1 ora</option>
                                        <option value="120">2 ore</option>
                                        <option value="180">3 ore</option>
                                        <option value="240">4 ore</option>
                                        <option value="480">8 ore (Full Day)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ borderTop: '1px solid var(--color-border)', margin: '0.5rem 0' }}></div>

                    {/* Middle Section: Financials & Notes */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

                        {/* Financials */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <h4 style={{ fontSize: '1rem', fontWeight: 'bold' }}>Dettagli Finanziari</h4>

                            <div className={classes.group}>
                                <label className={classes.label}>Stile Tatuaggio</label>
                                <select
                                    className={classes.searchInput}
                                    style={{ width: '100%' }}
                                    value={tattooStyle}
                                    onChange={e => setTattooStyle(e.target.value)}
                                >
                                    <option value="">-- Seleziona Stile --</option>
                                    <option value="REALISTICO">Realistico</option>
                                    <option value="MICRO_REALISTICO">Micro Realistico</option>
                                    <option value="MINIMAL">Minimal</option>
                                    <option value="GEOMETRICO">Geometrico</option>
                                    <option value="TRADIZIONALE">Tradizionale</option>
                                    <option value="GIAPPONESE">Giapponese</option>
                                    <option value="BLACKWORK">Blackwork</option>
                                    <option value="WATERCOLOR">Watercolor</option>
                                    <option value="TRIBAL">Tribal</option>
                                    <option value="OLD_SCHOOL">Old School</option>
                                    <option value="NEW_SCHOOL">New School</option>
                                    <option value="LETTERING">Lettering</option>
                                    <option value="ALTRO">Altro</option>
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className={classes.group}>
                                    <label className={classes.label}>Preventivo (€)</label>
                                    <input
                                        type="number"
                                        className={classes.searchInput}
                                        style={{ width: '100%' }}
                                        value={priceQuote}
                                        onChange={e => setPriceQuote(Number(e.target.value))}
                                        placeholder="0.00"
                                        min="0"
                                    />
                                </div>
                                <div className={classes.group}>
                                    <label className={classes.label}>Acconto (€)</label>
                                    <input
                                        type="number"
                                        className={classes.searchInput}
                                        style={{ width: '100%' }}
                                        value={depositAmount}
                                        onChange={e => setDepositAmount(Number(e.target.value))}
                                        placeholder="0.00"
                                        min="0"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className={classes.group} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <label className={classes.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FileText size={16} /> Note Aggiuntive
                            </label>
                            <textarea
                                className={classes.searchInput}
                                style={{ width: '100%', flex: 1, resize: 'none', lineHeight: '1.5' }}
                                rows={4}
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder="Dettagli sulla seduta, reference, etc..."
                            />
                        </div>
                    </div>

                    {/* Attachments Section */}
                    <div className={classes.group}>
                        <label className={classes.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Image size={16} /> Immagini e Reference
                        </label>

                        <div style={{
                            border: '2px dashed var(--color-border)',
                            borderRadius: 'var(--radius-md)',
                            padding: '1rem',
                            textAlign: 'center',
                            cursor: 'pointer',
                            backgroundColor: 'var(--color-surface-hover)',
                            position: 'relative'
                        }}>
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleFileChange}
                                style={{
                                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                    opacity: 0, cursor: 'pointer'
                                }}
                            />
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)' }}>
                                <Upload size={24} />
                                <span style={{ fontSize: '0.9rem' }}>Clicca o trascina qui per caricare immagini</span>
                            </div>
                        </div>

                        {/* Preview List */}
                        {attachments.length > 0 && (
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                                {attachments.map((src, index) => (
                                    <div key={index} style={{ position: 'relative', minWidth: '80px', width: '80px', height: '80px' }}>
                                        <img src={src} alt="attachment" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
                                        <button
                                            type="button"
                                            onClick={() => removeAttachment(index)}
                                            style={{
                                                position: 'absolute', top: -5, right: -5,
                                                background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                                                borderRadius: '50%', width: '20px', height: '20px',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Reminders Section */}
                    <div style={{
                        padding: '1.5rem',
                        backgroundColor: 'var(--color-surface-hover)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)'
                    }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Bell size={18} color="var(--color-primary)" />
                            Impostazioni Promemoria Automatici
                        </h4>

                        <div style={{ display: 'flex', gap: '2rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={reminders.whatsapp}
                                    onChange={e => setReminders({ ...reminders, whatsapp: e.target.checked })}
                                    style={{ width: '16px', height: '16px', accentColor: '#25D366' }}
                                />
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <MessageCircle size={16} color={reminders.whatsapp ? '#25D366' : 'gray'} />
                                    <span style={{ fontSize: '0.9rem' }}>WhatsApp</span>
                                </div>
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={reminders.sms}
                                    onChange={e => setReminders({ ...reminders, sms: e.target.checked })}
                                    style={{ width: '16px', height: '16px', accentColor: '#4285F4' }}
                                />
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Bell size={16} color={reminders.sms ? '#4285F4' : 'gray'} />
                                    <span style={{ fontSize: '0.9rem' }}>SMS</span>
                                </div>
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={reminders.email}
                                    onChange={e => setReminders({ ...reminders, email: e.target.checked })}
                                    style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }}
                                />
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Mail size={16} color={reminders.email ? 'var(--color-primary)' : 'gray'} />
                                    <span style={{ fontSize: '0.9rem' }}>Email</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                flex: 1, padding: '1rem', borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)', background: 'transparent',
                                color: 'var(--color-text-primary)', cursor: 'pointer'
                            }}
                        >
                            Annulla
                        </button>
                        <button
                            type="submit"
                            className={classes.addBtn}
                            style={{ flex: 1, justifyContent: 'center', opacity: uploading ? 0.7 : 1, cursor: uploading ? 'not-allowed' : 'pointer' }}
                            disabled={uploading}
                        >
                            {uploading ? 'Caricamento immagini...' : 'Crea Appuntamento'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
