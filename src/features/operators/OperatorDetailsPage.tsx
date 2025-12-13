import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { storage } from '../../lib/storage';
import { type User, type Appointment } from '../../types';
import { useAuth } from '../auth/AuthContext';
import { ArrowLeft, Calendar, Euro, User as UserIcon, MessageCircle, Mail, MapPin } from 'lucide-react';
import classes from '../crm/ClientListPage.module.css';

export function OperatorDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();

    const [operator, setOperator] = useState<User | null>(null);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [clients, setClients] = useState<any[]>([]); // Using any[] to avoid importing Client type if not imported yet, ideally import it
    const [loading, setLoading] = useState(true);

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
                        </div>
                    </div>

                    <div style={{
                        background: 'var(--color-card)',
                        padding: '1.5rem',
                        borderRadius: 'var(--radius-md)',
                        minWidth: '200px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}>
                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Commissione</div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>{commissionRate}%</div>
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
                    <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--color-success)' }}>€{totalEarnings.toLocaleString()}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Solo completati</div>
                </div>

                <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>
                        <Euro size={18} /> Commissione Stimata
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#FFD700' }}>€{estimatedCommission.toLocaleString()}</div>
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
                                    <td>€{apt.financials?.priceQuote || 0}</td>
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
