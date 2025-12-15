import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { storage } from '../../lib/storage';
import { type User, type Appointment } from '../../types';
import { useAuth } from '../auth/AuthContext';
import { ArrowLeft, Calendar, Euro, User as UserIcon, MessageCircle, Mail, MapPin, Lock, Eye, EyeOff, FileText, CreditCard } from 'lucide-react';
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
    const [tempContract, setTempContract] = useState<{
        contractType: 'COMMISSION' | 'RENT_MONTHLY' | 'RENT_PACK';
        commissionRate: number;
        rentAmount: number;
        rentPackPresences: number;
        rentRenewalDate: string;
    }>({
        contractType: 'COMMISSION',
        commissionRate: 50,
        rentAmount: 0,
        rentPackPresences: 10,
        rentRenewalDate: ''
    });

    useEffect(() => {
        if (operator?.profile) {
            setTempContract({
                contractType: operator.profile.contractType || 'COMMISSION',
                commissionRate: operator.profile.commissionRate || 50,
                rentAmount: operator.profile.rentAmount || 0,
                rentPackPresences: operator.profile.rentPackPresences || 10,
                rentRenewalDate: operator.profile.rentRenewalDate || new Date().toISOString().split('T')[0]
            });
        }
    }, [operator]);

    const handleSaveContract = async () => {
        if (!operator || !currentUser?.tenantId) return;

        try {
            const updatedUser: User = {
                ...operator,
                profile: {
                    ...operator.profile,
                    contractType: tempContract.contractType,
                    commissionRate: tempContract.commissionRate,
                    rentAmount: tempContract.rentAmount,
                    rentPackPresences: tempContract.rentPackPresences,
                    rentRenewalDate: tempContract.rentRenewalDate,
                    rentPackStartDate: tempContract.contractType === 'RENT_PACK' ? new Date().toISOString() : undefined
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

    // Calculate Commission (mock logic, if operator has rate)
    const commissionRate = operator.profile?.commissionRate || 50;
    const estimatedCommission = (totalEarnings * commissionRate) / 100;

    const getClientName = (clientId: string) => {
        const client = clients.find(c => c.id === clientId);
        return client ? `${client.firstName} ${client.lastName}` : 'Sconosciuto';
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
                    alignItems: 'center',
                    gap: '2rem',
                    flexWrap: 'wrap'
                }}>
                    <div style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        border: `4px solid ${operator.profile?.color || 'var(--color-primary)'}`,
                        overflow: 'hidden',
                        background: 'var(--color-background)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {operator.avatarUrl ? (
                            <img src={operator.avatarUrl} alt={operator.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <UserIcon size={60} color="var(--color-text-secondary)" />
                        )}
                    </div>

                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                            <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>{operator.name}</h1>
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
                            {operator.profile?.address && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <MapPin size={16} /> {operator.profile.address}
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
                                        <button
                                            onClick={() => setIsEditingPassword(true)}
                                            style={{ fontSize: '0.75rem', color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                                        >
                                            Modifica
                                        </button>
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

                            {/* Contract Section (Visible to Manager or if Rent Contract active) */}
                            {(currentUser?.role === 'MANAGER' || (operator.profile?.contractType && operator.profile.contractType !== 'COMMISSION')) && (
                                <div style={{
                                    marginTop: '1rem',
                                    borderTop: '1px solid var(--color-border)',
                                    paddingTop: '1rem',
                                    width: '100%',
                                    maxWidth: '400px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ fontSize: '0.875rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <FileText size={14} /> Dati Contratto
                                        </span>
                                        {currentUser?.role === 'MANAGER' && (
                                            !isEditingContract ? (
                                                <button
                                                    onClick={() => setIsEditingContract(true)}
                                                    style={{ fontSize: '0.75rem', color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                                                >
                                                    Modifica
                                                </button>
                                            ) : (
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button
                                                        onClick={() => setIsEditingContract(false)}
                                                        style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}
                                                    >
                                                        Annulla
                                                    </button>
                                                    <button
                                                        onClick={handleSaveContract}
                                                        style={{ fontSize: '0.75rem', color: 'var(--color-success)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                                                    >
                                                        Salva
                                                    </button>
                                                </div>
                                            )
                                        )}
                                    </div>

                                    {isEditingContract && currentUser?.role === 'MANAGER' ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'var(--color-surface-hover)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block' }}>Tipo Contratto</label>
                                                <select
                                                    value={tempContract.contractType}
                                                    onChange={(e) => setTempContract({ ...tempContract, contractType: e.target.value as any })}
                                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                                                >
                                                    <option value="COMMISSION">Commissione %</option>
                                                    <option value="RENT_MONTHLY">Affitto Fisso Mensile</option>
                                                    <option value="RENT_PACK">Pacchetto Presenze</option>
                                                </select>
                                            </div>

                                            {tempContract.contractType === 'COMMISSION' && (
                                                <div>
                                                    <label style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block' }}>Commissione (%)</label>
                                                    <input
                                                        type="number"
                                                        value={tempContract.commissionRate}
                                                        onChange={(e) => setTempContract({ ...tempContract, commissionRate: Number(e.target.value) })}
                                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                                                    />
                                                </div>
                                            )}

                                            {tempContract.contractType === 'RENT_MONTHLY' && (
                                                <>
                                                    <div>
                                                        <label style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block' }}>Importo Mensile (€)</label>
                                                        <input
                                                            type="number"
                                                            value={tempContract.rentAmount}
                                                            onChange={(e) => setTempContract({ ...tempContract, rentAmount: Number(e.target.value) })}
                                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block' }}>Prossimo Rinnovo</label>
                                                        <input
                                                            type="date"
                                                            value={tempContract.rentRenewalDate}
                                                            onChange={(e) => setTempContract({ ...tempContract, rentRenewalDate: e.target.value })}
                                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                                                        />
                                                    </div>
                                                </>
                                            )}

                                            {tempContract.contractType === 'RENT_PACK' && (
                                                <>
                                                    <div>
                                                        <label style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block' }}>Importo Pacchetto (€)</label>
                                                        <input
                                                            type="number"
                                                            value={tempContract.rentAmount}
                                                            onChange={(e) => setTempContract({ ...tempContract, rentAmount: Number(e.target.value) })}
                                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block' }}>Numero Presenze Incluse</label>
                                                        <input
                                                            type="number"
                                                            value={tempContract.rentPackPresences}
                                                            onChange={(e) => setTempContract({ ...tempContract, rentPackPresences: Number(e.target.value) })}
                                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                                                        />
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                                            {(!operator.profile?.contractType || operator.profile?.contractType === 'COMMISSION') && (
                                                <div>Commissione: <strong>{operator.profile?.commissionRate || 50}%</strong></div>
                                            )}
                                            {operator.profile?.contractType === 'RENT_MONTHLY' && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                    <div style={{ fontWeight: '500', color: 'var(--color-text-primary)' }}>Affitto Mensile</div>
                                                    <div>Importo: €{operator.profile.rentAmount} / mese</div>
                                                    <div>Rinnovo: <strong>{operator.profile.rentRenewalDate ? new Date(operator.profile.rentRenewalDate).toLocaleDateString() : 'N/D'}</strong></div>
                                                </div>
                                            )}
                                            {operator.profile?.contractType === 'RENT_PACK' && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                    <div style={{ fontWeight: '500', color: 'var(--color-text-primary)' }}>Pacchetto Presenze</div>
                                                    <div>Utilizzato: <strong>{operator.profile.rentUsedPresences || 0}</strong> / {operator.profile.rentPackPresences || 0}</div>
                                                    <div>Valore Pack: €{operator.profile.rentAmount}</div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{
                        background: 'var(--color-card)',
                        padding: '1.5rem',
                        borderRadius: 'var(--radius-md)',
                        minWidth: '220px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                    }}>
                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CreditCard size={16} /> Contratto Attivo
                        </div>

                        {(!operator.profile?.contractType || operator.profile.contractType === 'COMMISSION') && (
                            <>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                                    {operator.profile?.commissionRate || 50}%
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Commissione su lavori</div>
                            </>
                        )}

                        {operator.profile?.contractType === 'RENT_MONTHLY' && (
                            <>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                                    €{operator.profile?.rentAmount || 0}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>/ mese</div>
                                {operator.profile?.rentRenewalDate && (
                                    <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)', fontSize: '0.8rem' }}>
                                        Scadenza: <strong>{new Date(operator.profile.rentRenewalDate).toLocaleDateString()}</strong>
                                    </div>
                                )}
                            </>
                        )}

                        {operator.profile?.contractType === 'RENT_PACK' && (
                            <>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                                    {operator.profile?.rentUsedPresences || 0} / {operator.profile?.rentPackPresences || 0}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Presenze Utilizzate</div>
                                {operator.profile?.rentAmount && (
                                    <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                        Valore Pacchetto: €{operator.profile.rentAmount}
                                    </div>
                                )}
                            </>
                        )}
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
