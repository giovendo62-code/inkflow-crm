import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { storage } from '../../lib/storage';
import { type User, type Appointment } from '../../types';
import { useAuth } from '../auth/AuthContext';
import { ArrowLeft, Calendar, Euro, User as UserIcon, MessageCircle, Mail, MapPin, Lock, Eye, EyeOff, FileText, CreditCard, CheckCircle } from 'lucide-react';
import { usePrivacy } from '../context/PrivacyContext';
import classes from '../crm/ClientListPage.module.css';

export function OperatorDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();

    const [operator, setOperator] = useState<User | null>(null);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [clients, setClients] = useState<any[]>([]); // Using any[] to avoid importing Client type if not imported yet, ideally import it
    const [loading, setLoading] = useState(true);

    const { showFinancials } = usePrivacy();

    // Password Management State
    const [isEditingPassword, setIsEditingPassword] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSavePassword = async () => {
        if (!operator || !currentUser?.tenantId) return;

        try {
            const updatedUser: User = {
                ...operator,
                profile: {
                    ...operator.profile,
                    password: newPassword
                }
            };

            await storage.saveUser(updatedUser);
            setOperator(updatedUser);
            setIsEditingPassword(false);
            alert("Password aggiornata con successo!");
        } catch (error) {
            console.error("Failed to update password:", error);
            alert("Errore aggiornamento password");
        }
    };

    // Contract Management State
    const [isEditingContract, setIsEditingContract] = useState(false);
    // Simplified temp state mimicking the OperatorListPage structure
    const [tempProfile, setTempProfile] = useState<Partial<User['profile']>>({});

    useEffect(() => {
        if (operator?.profile) {
            setTempProfile({
                contractType: operator.profile.contractType || undefined, // undefined = Nessun Affitto
                rentAmount: operator.profile.rentAmount,
                rentPackPresences: operator.profile.rentPackPresences,
                rentUsedPresences: operator.profile.rentUsedPresences,
                rentRenewalDate: operator.profile.rentRenewalDate,
                commissionRate: operator.profile.commissionRate || 0
            });
        }
    }, [operator]);

    const handleSaveContract = async () => {
        if (!operator || !currentUser?.tenantId) return;

        try {
            // Parse numeric values from input strings if necessary
            const rentAmount = tempProfile.rentAmount !== undefined
                ? (typeof tempProfile.rentAmount === 'string' && tempProfile.rentAmount === '' ? 0 : parseFloat(tempProfile.rentAmount as any))
                : 0;

            const rentPackPresences = tempProfile.rentPackPresences !== undefined
                ? (typeof tempProfile.rentPackPresences === 'string' && tempProfile.rentPackPresences === '' ? 0 : parseInt(tempProfile.rentPackPresences as any))
                : 0;

            const rentUsedPresences = tempProfile.rentUsedPresences !== undefined
                ? (typeof tempProfile.rentUsedPresences === 'string' && tempProfile.rentUsedPresences === '' ? 0 : parseInt(tempProfile.rentUsedPresences as any))
                : 0;

            const commissionRate = tempProfile.commissionRate !== undefined
                ? (typeof tempProfile.commissionRate === 'string' && tempProfile.commissionRate === '' ? 0 : parseInt(tempProfile.commissionRate as any))
                : 0;

            const updatedUser: User = {
                ...operator,
                profile: {
                    ...operator.profile,
                    ...tempProfile,
                    rentAmount: isNaN(rentAmount) ? 0 : rentAmount,
                    rentPackPresences: isNaN(rentPackPresences) ? 0 : rentPackPresences,
                    rentUsedPresences: isNaN(rentUsedPresences) ? 0 : rentUsedPresences,
                    commissionRate: isNaN(commissionRate) ? 0 : commissionRate
                }
            };

            await storage.saveUser(updatedUser);
            setOperator(updatedUser);
            setIsEditingContract(false);
            alert("Contratto aggiornato con successo!");
        } catch (error) {
            console.error("Failed to update contract:", error);
            alert("Errore aggiornamento contratto");
        }
    };


    // ... (useEffect for loadData remains same) ...

    useEffect(() => {
        const loadData = async () => {
            if (!currentUser?.tenantId || !id) return;

            try {
                const [users, allAppointments, allClients] = await Promise.all([
                    storage.getUsers(currentUser.tenantId),
                    storage.getAppointments(currentUser.tenantId),
                    storage.getClients(currentUser.tenantId)
                ]);

                const foundOperator = users.find(u => u.id === id);
                if (foundOperator) {
                    setOperator(foundOperator);
                    // Filter appointments for this operator
                    const opAppointments = allAppointments.filter(a => a.artistId === id);
                    setAppointments(opAppointments);
                    setClients(allClients);
                }
            } catch (error) {
                console.error("Failed to load operator details:", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [currentUser?.tenantId, id]);

    if (loading) return <div className={classes.container}>Caricamento...</div>;
    if (!operator) return <div className={classes.container}>Operatore non trovato</div>;

    // Calculate Stats
    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter(a => a.status === 'COMPLETED');
    const totalEarnings = completedAppointments.reduce((sum, a) => sum + (a.financials?.priceQuote || 0), 0);
    const commissionRate = operator.profile?.commissionRate || 0;
    const estimatedCommission = (totalEarnings * commissionRate) / 100;

    const getClientName = (clientId: string) => {
        const client = clients.find(c => c.id === clientId);
        return client ? `${client.firstName} ${client.lastName}` : 'Sconosciuto';
    };

    const handleAddPresence = async (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (!operator) return;

        // Small timeout to ensure UI is stable before alert
        setTimeout(async () => {
            if (!confirm("Confermi di voler segnare una presenza?")) return;

            const currentUsed = operator.profile?.rentUsedPresences || 0;
            const total = operator.profile?.rentPackPresences || 0;

            if (total > 0 && currentUsed >= total) {
                alert("Attenzione: Il pacchetto di presenze è esaurito!");
                return;
            }

            try {
                const updatedOp: User = {
                    ...operator,
                    profile: {
                        ...operator.profile,
                        rentUsedPresences: currentUsed + 1
                    }
                };

                await storage.saveUser(updatedOp);
                setOperator(updatedOp);
            } catch (e) {
                console.error(e);
                alert("Errore durante il salvataggio della presenza.");
            }
        }, 100);
    };

    return (
        <div className={classes.container}>
            <button
                onClick={() => navigate('/artists')}
                className={classes.secondaryButton}
                style={{ marginBottom: '2rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
                <ArrowLeft size={16} /> Torna alla lista
            </button>

            <div style={{
                background: 'var(--color-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                overflow: 'hidden',
                marginBottom: '2rem'
            }}>
                <div style={{
                    padding: '2rem',
                    background: `linear-gradient(to right, ${operator.profile?.color || 'var(--color-primary)'}20, transparent)`,
                    display: 'flex',
                    alignItems: 'flex-start', // Changed to flex-start for better alignment with multiple cards
                    gap: '2rem',
                    flexWrap: 'wrap'
                }}>
                    {/* AVATAR & INFO (Left Column) */}
                    <div style={{ display: 'flex', gap: '2rem', flex: 1, minWidth: '300px' }}>
                        <div style={{
                            width: '120px',
                            height: '120px',
                            borderRadius: '50%',
                            border: `4px solid ${operator.profile?.color || 'var(--color-primary)'}`,
                            overflow: 'hidden',
                            background: 'var(--color-background)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            {operator.avatarUrl ? (
                                <img src={operator.avatarUrl} alt={operator.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <UserIcon size={60} color="var(--color-text-secondary)" />
                            )}
                        </div>

                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{operator.name}</h1>
                                <span style={{
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '999px',
                                    fontSize: '0.875rem',
                                    fontWeight: '600',
                                    background: 'var(--color-surface)',
                                    border: '1px solid var(--color-border)'
                                }}>
                                    {operator.role}
                                </span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--color-text-secondary)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Mail size={16} /> {operator.email}
                                </div>
                                {operator.profile?.phone && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <MessageCircle size={16} /> {operator.profile.phone}
                                    </div>
                                )}

                                {/* Password Section */}
                                <div style={{
                                    marginTop: '1rem',
                                    borderTop: '1px solid var(--color-border)',
                                    paddingTop: '1rem',
                                    width: '100%',
                                    maxWidth: '400px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ fontSize: '0.875rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Lock size={14} /> Password Accesso
                                        </span>
                                        {!isEditingPassword ? (
                                            currentUser?.role === 'MANAGER' && (
                                                <button
                                                    onClick={() => setIsEditingPassword(true)}
                                                    style={{ fontSize: '0.75rem', color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                                                >
                                                    Modifica
                                                </button>
                                            )
                                        ) : (
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => {
                                                        setNewPassword((operator.profile as any)?.password || '');
                                                        setIsEditingPassword(false);
                                                    }}
                                                    style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}
                                                >
                                                    Annulla
                                                </button>
                                                <button
                                                    onClick={handleSavePassword}
                                                    style={{ fontSize: '0.75rem', color: 'var(--color-success)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                                                >
                                                    Salva
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {isEditingPassword ? (
                                        <input
                                            type="text"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '0.5rem',
                                                borderRadius: 'var(--radius-md)',
                                                border: '1px solid var(--color-primary)',
                                                fontSize: '0.9rem'
                                            }}
                                            placeholder="Nuova password..."
                                        />
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '0.5rem' }}>
                                            <code style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.9rem' }}>
                                                {showPassword ? ((operator.profile as any)?.password || '••••••••') : '••••••••'}
                                            </code>
                                            <button
                                                onClick={() => setShowPassword(!showPassword)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}
                                                title={showPassword ? "Nascondi" : "Mostra"}
                                            >
                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CONTRACTS / SETTINGS (Right Column) */}
                    <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* HEADER & ACTIONS */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                                <FileText size={18} /> Gestione Contratti
                            </h3>
                            {currentUser?.role === 'MANAGER' && !isEditingContract && (
                                <button
                                    onClick={() => setIsEditingContract(true)}
                                    style={{ fontSize: '0.875rem', color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontWeight: '500' }}
                                >
                                    Modifica Impostazioni
                                </button>
                            )}
                            {isEditingContract && (
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={() => setIsEditingContract(false)} className={classes.secondaryButton} style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}>Annulla</button>
                                    <button onClick={handleSaveContract} className={classes.primaryButton} style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}>Salva</button>
                                </div>
                            )}
                        </div>

                        {/* 1. RENT SECTION */}
                        <div style={{
                            background: isEditingContract ? 'var(--color-surface-hover)' : 'var(--color-background)',
                            padding: '1rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)'
                        }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: '600', marginBottom: '1rem', textTransform: 'uppercase' }}>
                                Modalità Affitto
                            </div>

                            {isEditingContract ? (
                                /* EDIT MODE - RENT */
                                <div>
                                    <select
                                        value={tempProfile.contractType || ''}
                                        onChange={e => setTempProfile({ ...tempProfile, contractType: (e.target.value as any) || undefined })}
                                        style={{
                                            width: '100%',
                                            padding: '0.5rem',
                                            borderRadius: 'var(--radius-md)',
                                            border: '1px solid var(--color-border)',
                                            marginBottom: '1rem',
                                            color: '#000000',
                                            background: '#ffffff'
                                        }}
                                    >
                                        <option value="">Nessun Affitto</option>
                                        <option value="RENT_MONTHLY">Affitto Mensile</option>
                                        <option value="RENT_PACK">Pacchetto Presenze</option>
                                    </select>

                                    {tempProfile.contractType === 'RENT_MONTHLY' && (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Importo (€)</label>
                                                <input
                                                    type="number"
                                                    value={tempProfile.rentAmount || ''}
                                                    onChange={e => setTempProfile({ ...tempProfile, rentAmount: e.target.value as any })}
                                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)', color: '#000000', background: '#ffffff' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Rinnovo</label>
                                                <input
                                                    type="date"
                                                    value={tempProfile.rentRenewalDate || ''}
                                                    onChange={e => setTempProfile({ ...tempProfile, rentRenewalDate: e.target.value })}
                                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)', color: '#000000', background: '#ffffff' }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {tempProfile.contractType === 'RENT_PACK' && (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Importo (€)</label>
                                                <input
                                                    type="number"
                                                    value={tempProfile.rentAmount || ''}
                                                    onChange={e => setTempProfile({ ...tempProfile, rentAmount: e.target.value as any })}
                                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)', color: '#000000', background: '#ffffff' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Totale Pres.</label>
                                                <input
                                                    type="number"
                                                    value={tempProfile.rentPackPresences || ''}
                                                    onChange={e => setTempProfile({ ...tempProfile, rentPackPresences: e.target.value as any })}
                                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)', color: '#000000', background: '#ffffff' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Già Usate</label>
                                                <input
                                                    type="number"
                                                    value={tempProfile.rentUsedPresences || 0}
                                                    onChange={e => setTempProfile({ ...tempProfile, rentUsedPresences: e.target.value as any })}
                                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)', color: '#000000', background: '#ffffff' }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* VIEW MODE - RENT */
                                <div>
                                    {operator.profile?.contractType === 'RENT_MONTHLY' ? (
                                        <div>
                                            <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>€{operator.profile.rentAmount} <span style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>/ mese</span></div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Prossimo rinnovo: {operator.profile.rentRenewalDate ? new Date(operator.profile.rentRenewalDate).toLocaleDateString() : 'N/D'}</div>
                                        </div>
                                    ) : operator.profile?.contractType === 'RENT_PACK' ? (
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                                                    {operator.profile.rentUsedPresences || 0} <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 'normal' }}>/ {operator.profile.rentPackPresences || 0} pr.</span>
                                                </div>
                                                <button
                                                    onClick={handleAddPresence}
                                                    className={classes.primaryButton}
                                                    style={{
                                                        padding: '0.4rem 0.8rem',
                                                        fontSize: '0.75rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                >
                                                    <CheckCircle size={14} /> Segna Presenza
                                                </button>
                                            </div>
                                            <div style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>€{operator.profile.rentAmount} <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>(valore pacchetto)</span></div>

                                            <div style={{ width: '100%', height: '6px', background: 'var(--color-border)', borderRadius: '3px', marginTop: '0.75rem', overflow: 'hidden' }}>
                                                <div style={{
                                                    width: `${Math.min(100, ((operator.profile.rentUsedPresences || 0) / (operator.profile.rentPackPresences || 1)) * 100)}%`,
                                                    height: '100%',
                                                    background: 'var(--color-primary)'
                                                }} />
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', fontStyle: 'italic' }}>
                                            Nessun contratto di affitto attivo.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* 2. COMMISSION SECTION - SEPARATE BOX */}
                        <div style={{
                            background: isEditingContract ? 'var(--color-surface-hover)' : 'var(--color-background)',
                            padding: '1rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)'
                        }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: '600', marginBottom: '1rem', textTransform: 'uppercase' }}>
                                Commissione
                            </div>

                            {isEditingContract ? (
                                /* EDIT MODE - COMMISSION */
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <input
                                            type="checkbox"
                                            id="edit-commission-check"
                                            checked={(tempProfile.commissionRate || 0) > 0}
                                            onChange={e => setTempProfile({ ...tempProfile, commissionRate: e.target.checked ? 50 : 0 })}
                                            style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }}
                                        />
                                        <label htmlFor="edit-commission-check" style={{ fontSize: '0.9rem', fontWeight: '500' }}>Attiva Commissione sui Lavori</label>
                                    </div>

                                    {((tempProfile.commissionRate || 0) > 0) && (
                                        <div style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                                            <label style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Percentuale (%)</label>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <input
                                                    type="number"
                                                    value={tempProfile.commissionRate || ''}
                                                    onChange={(e) => setTempProfile({ ...tempProfile, commissionRate: e.target.value as any })}
                                                    style={{ width: '80px', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)', color: '#000000', background: '#ffffff' }}
                                                />
                                                <span style={{ fontSize: '0.875rem' }}>%</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* VIEW MODE - COMMISSION */
                                <div>
                                    {((operator.profile?.commissionRate || 0) > 0) ? (
                                        <div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                                                {operator.profile?.commissionRate}%
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>su ogni servizio completato</div>
                                        </div>
                                    ) : (
                                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', fontStyle: 'italic' }}>
                                            Nessuna commissione attiva.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>
                        <Calendar size={18} /> Appuntamenti Totali
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{totalAppointments}</div>
                </div>

                <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>
                        <Euro size={18} /> Fatturato Generato
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--color-success)' }}>
                        {showFinancials ? `€${totalEarnings.toLocaleString()}` : '••••'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Solo completati</div>
                </div>

                <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>
                        <Euro size={18} /> Commissione Stimata
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#FFD700' }}>
                        {showFinancials ? `€${estimatedCommission.toLocaleString()}` : '••••'}
                    </div>
                </div>
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Ultimi Appuntamenti</h2>
            <div className={classes.tableWrapper}>
                <table className={classes.table}>
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Cliente</th>
                            <th>Servizio</th>
                            <th>Stato</th>
                            <th>Prezzo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {appointments.length > 0 ? (
                            appointments.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()).slice(0, 10).map(apt => (
                                <tr key={apt.id}>
                                    <td>{new Date(apt.startTime).toLocaleDateString()} {new Date(apt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                    <td>{getClientName(apt.clientId)}</td>
                                    <td>{apt.title}</td>
                                    <td>
                                        <span style={{
                                            padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold',
                                            background: apt.status === 'COMPLETED' ? 'rgba(0,204,102,0.1)' : 'rgba(0,0,0,0.05)',
                                            color: apt.status === 'COMPLETED' ? 'green' : 'inherit'
                                        }}>
                                            {apt.status}
                                        </span>
                                    </td>
                                    <td>
                                        {showFinancials ? `€${apt.financials?.priceQuote || 0}` : '••••'}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>Nessun appuntamento</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
