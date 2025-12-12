import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { storage } from '../../lib/storage';
import { type Appointment, type Client, type User } from '../../types';
import classes from '../crm/ClientListPage.module.css';

export function FinancialsPage() {
    const { user } = useAuth();
    const isManager = user?.role === 'MANAGER';

    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [users, setUsers] = useState<User[]>([]);

    const [totalEarnings, setTotalEarnings] = useState(0);
    const [pendingDeposits, setPendingDeposits] = useState(0);
    const [timePeriod, setTimePeriod] = useState<'this-month' | 'last-month' | 'this-year' | 'last-year' | 'all-time'>('this-month');

    // Helper to filter by date range
    const filterByPeriod = (appointments: Appointment[]) => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        return appointments.filter(apt => {
            const aptDate = new Date(apt.startTime);
            const aptYear = aptDate.getFullYear();
            const aptMonth = aptDate.getMonth();

            switch (timePeriod) {
                case 'this-month':
                    return aptYear === currentYear && aptMonth === currentMonth;
                case 'last-month':
                    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
                    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
                    return aptYear === lastMonthYear && aptMonth === lastMonth;
                case 'this-year':
                    return aptYear === currentYear;
                case 'last-year':
                    return aptYear === currentYear - 1;
                case 'all-time':
                default:
                    return true;
            }
        });
    };

    useEffect(() => {
        const allAppointments = storage.getAppointments();
        const allClients = storage.getClients();
        const allUsers = storage.getUsers();

        setClients(allClients);
        setUsers(allUsers);

        // Filter appointments based on role
        let filteredAppointments = allAppointments;
        if (!isManager && user) {
            filteredAppointments = allAppointments.filter(a => a.artistId === user.id);
        }

        // Apply time period filter
        const periodFilteredAppointments = filterByPeriod(filteredAppointments);
        setAppointments(periodFilteredAppointments);

        // Calculate totals
        const completed = periodFilteredAppointments.filter(a => a.status === 'COMPLETED');
        const earnings = completed.reduce((sum, a) => sum + (a.financials?.priceQuote || 0), 0);
        setTotalEarnings(earnings);

        const pending = periodFilteredAppointments.reduce((sum, a) => {
            if (!a.financials?.depositPaid && a.financials?.depositAmount) {
                return sum + a.financials.depositAmount;
            }
            return sum;
        }, 0);
        setPendingDeposits(pending);
    }, [user, isManager, timePeriod]);

    // Helper to get client name
    const getClientName = (clientId: string) => {
        const client = clients.find(c => c.id === clientId);
        return client ? `${client.firstName} ${client.lastName}` : 'Unknown';
    };

    // Helper to get artist name
    const getArtistName = (artistId: string) => {
        const artist = users.find(u => u.id === artistId);
        return artist?.name || 'Unknown';
    };

    // Helper to get period label
    const getPeriodLabel = () => {
        switch (timePeriod) {
            case 'this-month': return 'Questo Mese';
            case 'last-month': return 'Mese Scorso';
            case 'this-year': return 'Quest\'Anno';
            case 'last-year': return 'Anno Scorso';
            case 'all-time': return 'Tutti i Tempi';
        }
    };

    const handleClearFinancialData = () => {
        if (window.confirm('⚠️ ATTENZIONE: Questa azione cancellerà TUTTI i dati finanziari (preventivi e acconti) degli appuntamenti completati. Vuoi continuare?')) {
            const allAppointments = storage.getAppointments();
            const resetAppointments = allAppointments.map(apt => {
                if (apt.status === 'COMPLETED') {
                    return {
                        ...apt,
                        financials: {
                            priceQuote: 0,
                            depositAmount: 0,
                            depositPaid: false
                        }
                    };
                }
                return apt;
            });
            localStorage.setItem('inkflow_appointments', JSON.stringify(resetAppointments));
            window.location.reload();
        }
    };

    const handleClearMyData = () => {
        if (!user) return;

        if (window.confirm('⚠️ ATTENZIONE: Questa azione cancellerà i TUOI dati finanziari (preventivi e acconti) dai tuoi appuntamenti completati. Vuoi continuare?')) {
            const allAppointments = storage.getAppointments();
            const resetAppointments = allAppointments.map(apt => {
                if (apt.status === 'COMPLETED' && apt.artistId === user.id) {
                    return {
                        ...apt,
                        financials: {
                            priceQuote: 0,
                            depositAmount: 0,
                            depositPaid: false
                        }
                    };
                }
                return apt;
            });
            localStorage.setItem('inkflow_appointments', JSON.stringify(resetAppointments));
            window.location.reload();
        }
    };

    // Recent completed appointments (last 10)
    const recentCompleted = appointments
        .filter(a => a.status === 'COMPLETED')
        .sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime())
        .slice(0, 10);

    return (
        <div className={classes.container}>
            <div className={classes.header}>
                <h1 className={classes.title}>Financials - {getPeriodLabel()}</h1>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <select
                        value={timePeriod}
                        onChange={(e) => setTimePeriod(e.target.value as any)}
                        style={{
                            padding: '0.5rem',
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--color-surface)',
                            color: 'var(--color-text-primary)',
                            border: '1px solid var(--color-border)',
                            fontWeight: '600'
                        }}
                    >
                        <option value="this-month">📅 Questo Mese</option>
                        <option value="last-month">📅 Mese Scorso</option>
                        <option value="this-year">📆 Quest'Anno</option>
                        <option value="last-year">📆 Anno Scorso</option>
                        <option value="all-time">🌍 Tutti i Tempi</option>
                    </select>
                    <button
                        onClick={isManager ? handleClearFinancialData : handleClearMyData}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid #ff4444',
                            background: 'transparent',
                            color: '#ff4444',
                            cursor: 'pointer',
                            fontWeight: '600'
                        }}
                    >
                        🗑️ {isManager ? 'Cancella Tutti i Dati' : 'Cancella i Miei Dati'}
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
            }}>
                <div style={{
                    padding: '2rem',
                    background: 'var(--color-surface)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)'
                }}>
                    <h3 style={{
                        color: 'var(--color-text-secondary)',
                        marginBottom: '0.5rem',
                        fontSize: '0.9rem'
                    }}>
                        Total Earnings (Completed)
                    </h3>
                    <p style={{
                        fontSize: '2.5rem',
                        fontWeight: 'bold',
                        color: 'var(--color-success)'
                    }}>
                        €{totalEarnings.toFixed(2)}
                    </p>
                    <p style={{
                        fontSize: '0.8rem',
                        color: 'var(--color-text-muted)',
                        marginTop: '0.5rem'
                    }}>
                        {recentCompleted.length} completed appointment{recentCompleted.length !== 1 ? 's' : ''}
                    </p>
                </div>

                <div style={{
                    padding: '2rem',
                    background: 'var(--color-surface)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)'
                }}>
                    <h3 style={{
                        color: 'var(--color-text-secondary)',
                        marginBottom: '0.5rem',
                        fontSize: '0.9rem'
                    }}>
                        Pending Deposits
                    </h3>
                    <p style={{
                        fontSize: '2.5rem',
                        fontWeight: 'bold',
                        color: 'var(--color-primary)'
                    }}>
                        €{pendingDeposits.toFixed(2)}
                    </p>
                    <p style={{
                        fontSize: '0.8rem',
                        color: 'var(--color-text-muted)',
                        marginTop: '0.5rem'
                    }}>
                        Unpaid deposits
                    </p>
                </div>
            </div>

            {/* Recent Transactions Table */}
            <div style={{
                background: 'var(--color-surface)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
                border: '1px solid var(--color-border)'
            }}>
                <h3 style={{
                    marginBottom: '1rem',
                    fontSize: '1.1rem',
                    fontWeight: '600'
                }}>
                    Recent Completed Appointments
                </h3>

                {recentCompleted.length === 0 ? (
                    <p style={{
                        color: 'var(--color-text-muted)',
                        textAlign: 'center',
                        padding: '2rem'
                    }}>
                        No completed appointments yet. Mark some as "Completed" to see earnings here.
                    </p>
                ) : (
                    <div className={classes.tableWrapper}>
                        <table className={classes.table}>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Client</th>
                                    {isManager && <th>Artist</th>}
                                    <th>Service</th>
                                    <th>Quote</th>
                                    <th>Deposit</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentCompleted.map(apt => (
                                    <tr key={apt.id}>
                                        <td>{new Date(apt.startTime).toLocaleDateString('it-IT')}</td>
                                        <td style={{ fontWeight: '500' }}>{getClientName(apt.clientId)}</td>
                                        {isManager && <td>{getArtistName(apt.artistId)}</td>}
                                        <td>{apt.title || apt.serviceType || 'Tattoo'}</td>
                                        <td style={{
                                            fontWeight: '600',
                                            color: 'var(--color-success)'
                                        }}>
                                            €{(apt.financials?.priceQuote || 0).toFixed(2)}
                                        </td>
                                        <td>
                                            {apt.financials?.depositPaid ? (
                                                <span style={{ color: 'var(--color-success)' }}>✓ Paid</span>
                                            ) : (
                                                <span style={{ color: 'var(--color-warning)' }}>
                                                    €{(apt.financials?.depositAmount || 0).toFixed(2)} pending
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '999px',
                                                fontSize: '0.75rem',
                                                fontWeight: '600',
                                                background: 'rgba(0, 204, 102, 0.2)',
                                                color: '#00CC66'
                                            }}>
                                                {apt.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Artist Breakdown (Manager Only) */}
            {isManager && (
                <div style={{
                    background: 'var(--color-surface)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.5rem',
                    border: '1px solid var(--color-border)',
                    marginTop: '2rem'
                }}>
                    <h3 style={{
                        marginBottom: '1.5rem',
                        fontSize: '1.1rem',
                        fontWeight: '600'
                    }}>
                        Guadagni per Artista
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                        {users.filter(u => u.role === 'ARTIST').map(artist => {
                            const artistAppointments = appointments.filter(a => a.artistId === artist.id && a.status === 'COMPLETED');
                            const artistEarnings = artistAppointments.reduce((sum, a) => sum + (a.financials?.priceQuote || 0), 0);
                            const artistPendingDeposits = appointments
                                .filter(a => a.artistId === artist.id && !a.financials?.depositPaid && a.financials?.depositAmount)
                                .reduce((sum, a) => sum + (a.financials?.depositAmount || 0), 0);

                            return (
                                <div
                                    key={artist.id}
                                    style={{
                                        padding: '1.5rem',
                                        borderRadius: 'var(--radius-md)',
                                        border: '2px solid var(--color-border)',
                                        background: 'linear-gradient(135deg, var(--color-surface) 0%, var(--color-surface-hover) 100%)',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                >
                                    {/* Artist Color Accent */}
                                    <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '4px',
                                        height: '100%',
                                        background: artist.profile?.color || 'var(--color-primary)'
                                    }} />

                                    {/* Artist Info */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                        {artist.avatarUrl ? (
                                            <img
                                                src={artist.avatarUrl}
                                                alt={artist.name}
                                                style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid var(--color-border)' }}
                                            />
                                        ) : (
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '50%',
                                                background: artist.profile?.color || 'var(--color-primary)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontWeight: 'bold'
                                            }}>
                                                {artist.name.charAt(0)}
                                            </div>
                                        )}
                                        <div>
                                            <h4 style={{ fontWeight: '600', marginBottom: '0.15rem' }}>{artist.name}</h4>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                {artistAppointments.length} completed
                                            </p>
                                        </div>
                                    </div>

                                    {/* Earnings */}
                                    <div style={{ marginBottom: '0.75rem' }}>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                            Total Earnings
                                        </p>
                                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-success)' }}>
                                            €{artistEarnings.toFixed(2)}
                                        </p>
                                    </div>

                                    {/* Pending Deposits */}
                                    {artistPendingDeposits > 0 && (
                                        <div>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                                Pending Deposits
                                            </p>
                                            <p style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--color-warning)' }}>
                                                €{artistPendingDeposits.toFixed(2)}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Performance per Stile (Manager Only) */}
            {isManager && (
                <div style={{
                    background: 'var(--color-surface)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.5rem',
                    border: '1px solid var(--color-border)',
                    marginTop: '2rem'
                }}>
                    <h3 style={{
                        marginBottom: '1.5rem',
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        color: 'var(--color-text-primary)'
                    }}>
                        Performance per Stile Tatuaggio
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                        Guadagni basati sullo stile preferito dei clienti serviti (Appuntamenti Completati).
                    </p>

                    <div className={classes.tableWrapper}>
                        <table className={classes.table}>
                            <thead>
                                <tr>
                                    <th>Stile</th>
                                    <th>Appuntamenti Completati</th>
                                    <th>Guadagno Totale</th>
                                    <th>Media per Lavoro</th>
                                    <th>% sul Totale</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    // Calculate Style Stats
                                    const styleStats: Record<string, { count: number, revenue: number }> = {};
                                    const completedApts = appointments.filter(a => a.status === 'COMPLETED');
                                    const grandTotal = completedApts.reduce((sum, a) => sum + (a.financials?.priceQuote || 0), 0);

                                    completedApts.forEach(apt => {
                                        const client = clients.find(c => c.id === apt.clientId);
                                        const style = client?.preferredStyle || 'ALTRO / NON SPECIFICATO';

                                        if (!styleStats[style]) {
                                            styleStats[style] = { count: 0, revenue: 0 };
                                        }
                                        styleStats[style].count += 1;
                                        styleStats[style].revenue += (apt.financials?.priceQuote || 0);
                                    });

                                    // Sort by revenue desc
                                    const sortedStyles = Object.entries(styleStats)
                                        .sort(([, a], [, b]) => b.revenue - a.revenue);

                                    if (sortedStyles.length === 0) {
                                        return (
                                            <tr>
                                                <td colSpan={5} style={{ textAlign: 'center', padding: '1rem', color: 'var(--color-text-muted)' }}>
                                                    Nessun dato disponibile per il periodo selezionato.
                                                </td>
                                            </tr>
                                        );
                                    }

                                    return sortedStyles.map(([style, stats]) => (
                                        <tr key={style}>
                                            <td style={{ fontWeight: '600' }}>
                                                <span style={{
                                                    display: 'inline-block',
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '4px',
                                                    background: 'rgba(255, 255, 255, 0.05)',
                                                    border: '1px solid var(--color-border)',
                                                    fontSize: '0.8rem'
                                                }}>
                                                    {style.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>{stats.count}</td>
                                            <td style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>
                                                €{stats.revenue.toFixed(2)}
                                            </td>
                                            <td style={{ color: 'var(--color-text-secondary)' }}>
                                                €{(stats.revenue / stats.count).toFixed(2)}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div style={{ width: '60px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                                        <div style={{
                                                            width: `${grandTotal > 0 ? (stats.revenue / grandTotal) * 100 : 0}%`,
                                                            height: '100%',
                                                            background: 'var(--color-primary)'
                                                        }} />
                                                    </div>
                                                    <span style={{ fontSize: '0.75rem' }}>
                                                        {grandTotal > 0 ? ((stats.revenue / grandTotal) * 100).toFixed(1) : 0}%
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ));
                                })()}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
