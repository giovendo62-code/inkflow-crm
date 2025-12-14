
import { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Clock, MessageCircle, Bell, Mail, FileText, Upload, Image, Trash2, User as UserIcon } from 'lucide-react';
import { type Appointment, type Client, type User, type Tenant, type TattooStyle } from '../../types';
import { storage } from '../../lib/storage';
import { useAuth } from '../auth/AuthContext';
import { usePrivacy } from '../context/PrivacyContext';
import classes from '../crm/ClientListPage.module.css';

interface AppointmentDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    appointment: Appointment | null;
}

export function AppointmentDetailsModal({ isOpen, onClose, onSave, appointment }: AppointmentDetailsModalProps) {
    const { user } = useAuth();
    const { showFinancials } = usePrivacy();
    const [clients, setClients] = useState<Client[]>([]);
    const [artists, setArtists] = useState<User[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);

    // Form State
    const [title, setTitle] = useState('');
    const [clientId, setClientId] = useState('');
    const [artistId, setArtistId] = useState('');
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [duration, setDuration] = useState(60);
    const [status, setStatus] = useState<'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'>('SCHEDULED');

    // Extended Fields
    const [priceQuote, setPriceQuote] = useState<number>(0);
    const [depositAmount, setDepositAmount] = useState<number>(0);
    const [depositPaid, setDepositPaid] = useState(false);
    const [tattooStyle, setTattooStyle] = useState<string>('');
    const [notes, setNotes] = useState('');
    const [attachments, setAttachments] = useState<string[]>([]);
    const [clientSearch, setClientSearch] = useState('');

    // Reminders State
    const [reminders, setReminders] = useState({
        whatsapp: true,
        sms: true,
        email: true
    });

    useEffect(() => {
        if (isOpen && appointment) {
            const loadData = async () => {
                if (!user?.tenantId) return;
                const loadedClients = await storage.getClients(user.tenantId);
                const loadedUsers = await storage.getUsers(user.tenantId);
                const tenants = await storage.getTenants();
                const myTenant = tenants.find(t => t.id === user.tenantId);
                if (myTenant) setCurrentTenant(myTenant);

                setClients(loadedClients);
                setAllUsers(loadedUsers);
                setArtists(loadedUsers.filter(u => u.role === 'ARTIST'));
            };
            loadData();

            // Populate form with existing data
            setTitle(appointment.title);
            setClientId(appointment.clientId);
            setArtistId(appointment.artistId);

            const start = new Date(appointment.startTime);
            const end = new Date(appointment.endTime);
            setDate(start.toISOString().split('T')[0]);
            setStartTime(start.toTimeString().slice(0, 5));
            setDuration(Math.round((end.getTime() - start.getTime()) / 60000));

            setStatus(appointment.status);
            setPriceQuote(appointment.financials?.priceQuote || 0);
            setDepositAmount(appointment.financials?.depositAmount || 0);
            setDepositPaid(appointment.financials?.depositPaid || false);
            setTattooStyle(appointment.tattooStyle || '');
            setNotes(appointment.notes || '');
            setAttachments(appointment.attachments || []);
            setReminders(appointment.reminders || { whatsapp: true, sms: true, email: true });
        }
    }, [isOpen, appointment]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            files.forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setAttachments(prev => [...prev, reader.result as string]);
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!appointment) return;

        const startDateTime = new Date(`${date}T${startTime}`);
        const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

        const updatedAppointment: Appointment = {
            ...appointment,
            title: title || 'Appointment',
            clientId,
            artistId,
            startTime: startDateTime.toISOString(),
            endTime: endDateTime.toISOString(),
            status,
            tattooStyle: (tattooStyle || undefined) as any,
            reminders,
            updatedAt: new Date().toISOString(),
            financials: {
                priceQuote,
                depositAmount,
                depositPaid
            },
            notes,
            attachments
        };

        try {
            await storage.saveAppointment(updatedAppointment);
            onSave();
            onClose();
        } catch (error) {
            console.error('Failed to update appointment:', error);
            alert('Errore aggiornamento appuntamento');
        }
    };

    const handleDelete = async () => {
        if (!appointment) return;

        if (window.confirm('Sei sicuro di voler eliminare questo appuntamento?')) {
            try {
                await storage.deleteAppointment(appointment.id);
                onSave();
                onClose();
            } catch (error) {
                console.error('Failed to delete appointment:', error);
                alert('Errore eliminazione appuntamento');
            }
        }
    };

    if (!isOpen || !appointment) return null;

    const currentArtist = allUsers.find(a => a.id === artistId);
    const currentClient = clients.find(c => c.id === clientId);

    // Check if artist can edit this appointment
    const canEdit = user?.role === 'MANAGER' || (user?.role === 'ARTIST' && appointment.artistId === user.id);

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 100, padding: '1rem'
        }}>
            <div style={{
                backgroundColor: 'var(--color-surface)',
                borderRadius: 'var(--radius-lg)',
                width: '100%', maxWidth: '800px',
                border: '1px solid var(--color-border)',
                maxHeight: '95vh',
                overflowY: 'auto',
                overflowX: 'hidden'
            }}>
                {/* Header */}
                <div style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'linear-gradient(135deg, var(--color-surface) 0%, var(--color-surface-hover) 100%)'
                }}>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                            Dettagli Appuntamento
                        </h2>
                        {currentArtist && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 1rem',
                                borderRadius: 'var(--radius-md)',
                                backgroundColor: currentArtist.profile?.color || 'var(--color-primary)',
                                color: 'white',
                                width: 'fit-content'
                            }}>
                                <UserIcon size={16} />
                                <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                                    {currentArtist.name}
                                </span>
                            </div>
                        )}
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                        <X size={24} />
                    </button>
                </div>

                {!canEdit && (
                    <div style={{
                        padding: '1rem',
                        background: 'rgba(255, 152, 0, 0.1)',
                        borderBottom: '1px solid rgba(255, 152, 0, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: '#ff9800'
                    }}>
                        <span style={{ fontSize: '1.2rem' }}>🔒</span>
                        <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                            Solo visualizzazione - Questo appuntamento appartiene a {currentArtist?.name}
                        </span>
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Top Section: Basic Info */}
                    <div className={classes.formGrid}>

                        {/* Left Column */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className={classes.group}>
                                <label className={classes.label}>Titolo</label>
                                <input
                                    className={classes.searchInput}
                                    style={{ width: '100%' }}
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="Es. Seduta Braccio"
                                    disabled={!canEdit}
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
                                    disabled={!canEdit}
                                />
                                <select
                                    className={classes.searchInput}
                                    style={{ width: '100%' }}
                                    value={clientId}
                                    onChange={e => setClientId(e.target.value)}
                                    required
                                    size={5}
                                    disabled={!canEdit}
                                >
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

                            <div className={classes.group}>
                                <label className={classes.label}>Status</label>
                                <select
                                    className={classes.searchInput}
                                    style={{ width: '100%' }}
                                    value={status}
                                    onChange={e => setStatus(e.target.value as any)}
                                    disabled={!canEdit}
                                >
                                    <option value="SCHEDULED">Scheduled</option>
                                    <option value="CONFIRMED">Confirmed</option>
                                    <option value="COMPLETED">Completed</option>
                                    <option value="CANCELLED">Cancelled</option>
                                </select>
                            </div>
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
                                        disabled={!canEdit}
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
                                            disabled={!canEdit}
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
                                        disabled={!canEdit}
                                    >
                                        <option value="30">30 min</option>
                                        <option value="60">1 ora</option>
                                        <option value="120">2 ore</option>
                                        <option value="180">3 ore</option>
                                        <option value="240">4 ore</option>
                                        <option value="480">8 ore</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ borderTop: '1px solid var(--color-border)', margin: '0.5rem 0' }}></div>

                    {/* Financials & Notes */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
                        {canEdit && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: '1 1 300px' }}>
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

                                <div className={classes.group}>
                                    <label className={classes.label}>Preventivo (€)</label>
                                    <input
                                        type={showFinancials ? "number" : "password"}
                                        className={classes.searchInput}
                                        style={{ width: '100%' }}
                                        value={priceQuote}
                                        onChange={e => setPriceQuote(Number(e.target.value))}
                                        min="0"
                                        disabled={!showFinancials && !canEdit} // Optional safety
                                    />
                                </div>
                                <div className={classes.group}>
                                    <label className={classes.label}>Acconto (€)</label>
                                    <input
                                        type={showFinancials ? "number" : "password"}
                                        className={classes.searchInput}
                                        style={{ width: '100%' }}
                                        value={depositAmount}
                                        onChange={e => setDepositAmount(Number(e.target.value))}
                                        min="0"
                                        disabled={!showFinancials && !canEdit}
                                    />
                                </div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={depositPaid}
                                        onChange={e => setDepositPaid(e.target.checked)}
                                        style={{ width: '16px', height: '16px' }}
                                    />
                                    <span style={{ fontSize: '0.9rem' }}>Acconto Pagato</span>
                                </label>
                            </div>
                        )}

                        <div className={classes.group} style={{ display: 'flex', flexDirection: 'column', flex: '1 1 300px' }}>
                            <label className={classes.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FileText size={16} /> Note
                            </label>
                            <textarea
                                className={classes.searchInput}
                                style={{ width: '100%', flex: 1, resize: 'none', lineHeight: '1.5', minHeight: '120px' }}
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder="Dettagli, reference..."
                                disabled={!canEdit}
                            />
                        </div>
                    </div>

                    {/* Attachments */}
                    {/* Attachments Section - Visible if can edit OR has attachments */}
                    {(canEdit || attachments.length > 0) && (
                        <div className={classes.group}>
                            <label className={classes.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Image size={16} /> Immagini
                            </label>

                            {canEdit && (
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
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)', pointerEvents: 'none' }}>
                                        <Upload size={24} />
                                        <span style={{ fontSize: '0.9rem' }}>Carica immagini</span>
                                    </div>
                                </div>
                            )}

                            {attachments.length > 0 && (
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                                    {attachments.map((src, index) => (
                                        <div key={index} style={{ position: 'relative', minWidth: '80px', width: '80px', height: '80px' }}>
                                            <img
                                                src={src}
                                                alt="attachment"
                                                onClick={() => window.open(src, '_blank')}
                                                title="Clicca per ingrandire"
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                    borderRadius: 'var(--radius-md)',
                                                    cursor: 'zoom-in',
                                                    border: '1px solid var(--color-border)'
                                                }}
                                            />
                                            {canEdit && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeAttachment(index)}
                                                    style={{
                                                        position: 'absolute', top: -5, right: -5,
                                                        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                                                        borderRadius: '50%', width: '20px', height: '20px',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        cursor: 'pointer',
                                                        zIndex: 2
                                                    }}
                                                >
                                                    <X size={12} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* WhatsApp Actions (Manual) */}
                    {currentClient && (
                        <div style={{
                            padding: '1.5rem',
                            backgroundColor: 'rgba(37, 211, 102, 0.05)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid #25D366',
                            marginBottom: '1rem'
                        }}>
                            <h4 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#128C7E' }}>
                                <MessageCircle size={18} />
                                Comunicazioni WhatsApp Rapide
                            </h4>

                            <div className={classes.formGrid}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const phone = currentClient.phone.replace(/[^0-9]/g, '');
                                        const formattedPhone = phone.startsWith('3') && phone.length === 10 ? `39${phone} ` : phone;

                                        const dateObj = new Date(date);
                                        const formattedDate = dateObj.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });

                                        const text = `Ciao ${currentClient.firstName}! 👋\n\nTi confermo il tuo appuntamento per *${formattedDate}* alle ore *${startTime}*.\n\n⚠️ *IMPORTANTE*: Rispondi a questo messaggio per confermare la ricezione.\n\nTi aspettiamo!\n\n—\n${currentTenant?.name || ''}\n📍 ${currentTenant?.address || ''}\n📲 ${currentTenant?.whatsapp || ''}`;

                                        window.open(`https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(text)}`, '_blank');
                                    }}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                        padding: '0.75rem',
                                        backgroundColor: '#25D366',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: 'var(--radius-md)',
                                        cursor: 'pointer',
                                        fontWeight: '600'
                                    }}
                                >
                                    <MessageCircle size={18} />
                                    Invia Conferma
                                </button >

                                <button
                                    type="button"
                                    onClick={() => {
                                        const phone = currentClient.phone.replace(/[^0-9]/g, '');
                                        const formattedPhone = phone.startsWith('3') && phone.length === 10 ? `39${phone}` : phone;

                                        const dateObj = new Date(date);
                                        const formattedDate = dateObj.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });

                                        const text = `Ciao ${currentClient.firstName}, ti scriviamo per ricordarti il tuo appuntamento presso il nostro studio.\n📅 Data: ${formattedDate}\n⏰ Orario: ${startTime}\n${notes ? `\n${notes}` : ''}\n\n❗ Questo messaggio richiede una conferma. Ti chiediamo di rispondere per confermare la tua presenza.\nIn assenza di risposta, l’appuntamento potrebbe essere cancellato per permettere ad altri clienti di prenotarsi.\n\n—\n${currentTenant?.name || 'InkFlow Studio'}\n📍 ${currentTenant?.address || ''}\n📲 ${currentTenant?.whatsapp || ''}`;

                                        window.open(`https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(text)}`, '_blank');
                                    }}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                        padding: '0.75rem',
                                        backgroundColor: 'white',
                                        color: '#25D366',
                                        border: '1px solid #25D366',
                                        borderRadius: 'var(--radius-md)',
                                        cursor: 'pointer',
                                        fontWeight: '600'
                                    }}
                                >
                                    <Bell size={18} />
                                    Invia Reminder (1 Settimana)
                                </button>
                            </div >
                        </div >
                    )}

                    <div style={{
                        padding: '1.5rem',
                        backgroundColor: 'var(--color-surface-hover)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)'
                    }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Bell size={18} color="var(--color-primary)" />
                            Promemoria Automatici
                        </h4>

                        <div style={{ display: 'flex', gap: '2rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={reminders.whatsapp}
                                    onChange={e => setReminders({ ...reminders, whatsapp: e.target.checked })}
                                    style={{ width: '16px', height: '16px' }}
                                    disabled={!canEdit}
                                />
                                <MessageCircle size={16} color={reminders.whatsapp ? '#25D366' : 'gray'} />
                                <span style={{ fontSize: '0.9rem' }}>WhatsApp</span>
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={reminders.sms}
                                    onChange={e => setReminders({ ...reminders, sms: e.target.checked })}
                                    style={{ width: '16px', height: '16px' }}
                                    disabled={!canEdit}
                                />
                                <Bell size={16} color={reminders.sms ? '#4285F4' : 'gray'} />
                                <span style={{ fontSize: '0.9rem' }}>SMS</span>
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={reminders.email}
                                    onChange={e => setReminders({ ...reminders, email: e.target.checked })}
                                    style={{ width: '16px', height: '16px' }}
                                    disabled={!canEdit}
                                />
                                <Mail size={16} color={reminders.email ? 'var(--color-primary)' : 'gray'} />
                                <span style={{ fontSize: '0.9rem' }}>Email</span>
                            </label>
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        {canEdit && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                style={{
                                    padding: '1rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid #ff4444',
                                    background: 'transparent',
                                    color: '#ff4444',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                <Trash2 size={16} />
                                Elimina
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                flex: 1,
                                padding: '1rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                background: 'transparent',
                                color: 'var(--color-text-primary)',
                                cursor: 'pointer'
                            }}
                        >
                            {canEdit ? 'Annulla' : 'Chiudi'}
                        </button>
                        {canEdit && (
                            <button
                                type="submit"
                                className={classes.addBtn}
                                style={{ flex: 2, justifyContent: 'center' }}
                            >
                                Salva Modifiche
                            </button>
                        )}
                    </div>
                </form >
            </div >
        </div >
    );
}
