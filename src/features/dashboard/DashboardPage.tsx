import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { usePrivacy } from '../context/PrivacyContext';
import { storage } from '../../lib/storage';
import { type Appointment, type Client, type TattooStyle, type Tenant } from '../../types';
import { Calendar as CalendarIcon, User as UserIcon, MessageCircle, Bell, Eye, EyeOff, DollarSign, CreditCard, Wallet, CheckCircle } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { StudentDashboard } from '../academy/StudentDashboard';
import { AppointmentDetailsModal } from '../calendar/AppointmentDetailsModal';
import classes from '../crm/ClientListPage.module.css';

export function DashboardPage() {
    const { user, refreshUser } = useAuth();
    const { showFinancials, toggleFinancials } = usePrivacy();
    const isManager = user?.role === 'MANAGER';
    const isStudent = user?.role === 'STUDENT';

    // If user is a student, show student dashboard
    if (isStudent) {
        return <StudentDashboard />;
    }

    const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
    const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
    const [clients, setClients] = useState<Client[]>([]);

    // Manager Stats State
    const [loading, setLoading] = useState(true);
    // stats state for manager dashboard summary
    const [stats, setStats] = useState({
        todayAppointments: 0,
        totalClients: 0,
        monthlyEarnings: 0,
        pendingDeposits: 0,
    });

    // Manager Charts State
    const [monthlyStats, setMonthlyStats] = useState<{ month: string, revenue: number, appointments: number }[]>([]);
    const [yearlyTotals, setYearlyTotals] = useState({ revenue: 0, appointments: 0, currentMonthRevenue: 0 });
    const [styleStats, setStyleStats] = useState<{ name: string, value: number, color: string }[]>([]);

    const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);

    useEffect(() => {
        const loadDashboardData = async () => {
            if (!user?.tenantId) return;

            try {
                setLoading(true);

                // Load Tenant Info
                const tenants = await storage.getTenants();
                const myTenant = tenants.find(t => t.id === user.tenantId) || tenants[0];
                if (myTenant) setCurrentTenant(myTenant);

                const [allAppointments, allClients] = await Promise.all([
                    storage.getAppointments(user.tenantId),
                    storage.getClients(user.tenantId)
                ]);

                // ... resto del codice invariato fino ai return ...


                setClients(allClients); // Update clients state for getClientName

                // Filter for today
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const todayApts = allAppointments.filter(apt => {
                    const aptDate = new Date(apt.startTime);
                    aptDate.setHours(0, 0, 0, 0);
                    return aptDate.getTime() === today.getTime();
                });

                // Calculate stats based on role
                if (user?.role === 'ARTIST') {
                    // Artist sees only their own appointments
                    const myApts = todayApts.filter(a => a.artistId === user.id);
                    setTodayAppointments(myApts);

                    // Monthly earnings (completed only)
                    const currentMonth = today.getMonth();
                    const monthlyEarnings = allAppointments
                        .filter(a =>
                            a.artistId === user.id &&
                            a.status === 'COMPLETED' &&
                            new Date(a.startTime).getMonth() === currentMonth
                        )
                        .reduce((sum, a) => sum + (a.financials?.priceQuote || 0), 0);

                    setStats({
                        todayAppointments: myApts.length,
                        totalClients: 0,
                        monthlyEarnings: monthlyEarnings,
                        pendingDeposits: 0
                    });

                    // Upcoming for Artist
                    const startNext = new Date();
                    startNext.setDate(startNext.getDate() + 1);
                    startNext.setHours(0, 0, 0, 0);

                    const endNext = new Date();
                    endNext.setDate(endNext.getDate() + 8);
                    endNext.setHours(23, 59, 59, 999);

                    const upc = allAppointments.filter(apt => {
                        const d = new Date(apt.startTime);
                        return d >= startNext && d <= endNext && apt.status !== 'CANCELLED' && apt.artistId === user.id;
                    }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
                    setUpcomingAppointments(upc);

                } else { // Manager role
                    // Manager sees all
                    setTodayAppointments(todayApts);

                    // Calculate totals
                    const currentMonth = today.getMonth();
                    const monthlyRevenue = allAppointments
                        .filter(a =>
                            a.status === 'COMPLETED' &&
                            new Date(a.startTime).getMonth() === currentMonth
                        )
                        .reduce((sum, a) => sum + (a.financials?.priceQuote || 0), 0);

                    const pending = allAppointments
                        .filter(a => !a.financials?.depositPaid && a.financials?.depositAmount)
                        .reduce((sum, a) => sum + (a.financials?.depositAmount || 0), 0);

                    setStats({
                        todayAppointments: todayApts.length,
                        totalClients: allClients.length,
                        monthlyEarnings: monthlyRevenue,
                        pendingDeposits: pending
                    });

                    // Upcoming Appointments Logic (Next 7 days)
                    const startNext = new Date();
                    startNext.setDate(startNext.getDate() + 1);
                    startNext.setHours(0, 0, 0, 0);

                    const endNext = new Date();
                    endNext.setDate(endNext.getDate() + 8);
                    endNext.setHours(23, 59, 59, 999);

                    const upc = allAppointments.filter(apt => {
                        const d = new Date(apt.startTime);
                        // Filter by artist if needed (Manager sees all usually, or filter by user? Manager sees ALL)
                        return d >= startNext && d <= endNext && apt.status !== 'CANCELLED';
                    }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
                    setUpcomingAppointments(upc);

                    // Manager specific stats (monthly, yearly, style) - Re-implementing the original manager logic here
                    const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
                    const currentYear = new Date().getFullYear();
                    const currentMonthIdx = new Date().getMonth();

                    const statsArr = months.map((m, idx) => ({ month: m, revenue: 0, appointments: 0 }));

                    let yRev = 0;
                    let yApts = 0;
                    let mRev = 0;

                    allAppointments.forEach(a => {
                        if (a.status !== 'CANCELLED') {
                            const d = new Date(a.startTime);
                            if (d.getFullYear() === currentYear) {
                                const mIdx = d.getMonth();
                                const price = a.financials?.priceQuote || 0;

                                statsArr[mIdx].revenue += price;
                                statsArr[mIdx].appointments += 1;

                                yRev += price;
                                yApts += 1;

                                if (mIdx === currentMonthIdx) {
                                    mRev += price;
                                }
                            }
                        }
                    });

                    setMonthlyStats(statsArr);
                    setYearlyTotals({ revenue: yRev, appointments: yApts, currentMonthRevenue: mRev });

                    // Calculate Style Stats based on Clients
                    const styleCounts: Record<string, number> = {};
                    allClients.forEach(c => {
                        if (c.preferredStyle) {
                            styleCounts[c.preferredStyle] = (styleCounts[c.preferredStyle] || 0) + 1;
                        }
                    });

                    const COLORS = ['#FF6B35', '#00CC66', '#4285F4', '#FFBB28', '#FF8042'];
                    const styleData = Object.entries(styleCounts)
                        .map(([name, value], index) => ({
                            name: name.replace('_', ' '),
                            value,
                            color: COLORS[index % COLORS.length]
                        }))
                        .sort((a, b) => b.value - a.value)
                        .slice(0, 5);

                    if (Object.keys(styleCounts).length === 0) {
                        // Fallback if no data
                        setStyleStats([{ name: 'No Data', value: 1, color: '#333' }]);
                    } else {
                        setStyleStats(styleData);
                    }
                }
            } catch (error) {
                console.error("Error loading dashboard:", error);
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, [user, isManager]);

    const getClientName = (clientId: string) => {
        const client = clients.find(c => c.id === clientId);
        return client ? `${client.firstName} ${client.lastName}` : 'Unknown';
    };

    // Modals State for Dashboard
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

    const handleAppointmentClick = (apt: Appointment) => {
        setSelectedAppointment(apt);
        setDetailsModalOpen(true);
    };

    // Helper for Artist Check-in
    const handleRentalCheckIn = async () => {
        if (!user) return;
        if (!window.confirm("Confermi di voler segnare una presenza per oggi?")) return;

        try {
            const currentUsed = user.profile?.rentUsedPresences || 0;
            const total = user.profile?.rentPackPresences || 0;

            if (currentUsed >= total) {
                alert("Hai esaurito le presenze del pacchetto!");
                return;
            }

            const updatedUser = {
                ...user,
                profile: {
                    ...user.profile,
                    rentUsedPresences: currentUsed + 1
                }
            };

            await storage.saveUser(updatedUser);
            await refreshUser();
            // alert("Presenza segnata!"); // Optional feedback
        } catch (err) {
            console.error(err);
            alert("Errore durante l'aggiornamento.");
        }
    };

    // ARTIST VIEW: Today's appointments
    if (!isManager) {
        return (
            <div>
                <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', lineHeight: '1.2' }}>
                    Benvenuto a {currentTenant?.name || 'InkFlow Studio'},<br />
                    <span style={{ color: 'var(--color-primary)' }}>{user?.name}</span>
                </h1>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
                    I tuoi appuntamenti di oggi
                </p>

                {/* Today's Stats */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '1rem',
                    marginBottom: '2rem'
                }}>
                    {/* Contract Status Card (Rent Mode) */}
                    {(user?.profile?.contractType === 'RENT_MONTHLY' || user?.profile?.contractType === 'RENT_PACK') && (
                        (() => {
                            let statusColor = 'var(--color-border)';
                            let bgColor = 'var(--color-surface)';
                            let statusText = '';
                            let mainValue = '';
                            let subText = '';
                            let showButton = false;

                            if (user.profile.contractType === 'RENT_MONTHLY') {
                                const renewalDate = user.profile.rentRenewalDate ? new Date(user.profile.rentRenewalDate) : null;
                                if (renewalDate) {
                                    const daysLeft = Math.ceil((renewalDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

                                    if (daysLeft < 0) {
                                        statusColor = 'var(--color-error)';
                                        statusText = 'Scaduto';
                                        mainValue = `${Math.abs(daysLeft)} Giorni`;
                                        subText = `Scaduto dal ${renewalDate.toLocaleDateString()}`;
                                    } else {
                                        mainValue = `${daysLeft} Giorni`;
                                        subText = `al rinnovo (${renewalDate.toLocaleDateString()})`;
                                        if (daysLeft <= 5) {
                                            statusColor = '#FFD700'; // Warning
                                            statusText = 'In Scadenza';
                                        } else {
                                            statusColor = 'var(--color-success)'; // Green for active
                                            statusText = 'Attivo';
                                        }
                                    }
                                } else {
                                    mainValue = 'N/A';
                                    subText = 'Data mancante';
                                }
                            } else {
                                // RENT_PACK
                                const total = user.profile.rentPackPresences || 0;
                                const used = user.profile.rentUsedPresences || 0;
                                const remaining = total - used;
                                mainValue = `${remaining}`;
                                subText = 'Ingressi Rimanenti';
                                showButton = remaining > 0;

                                if (remaining <= 0) {
                                    statusColor = 'var(--color-error)';
                                    statusText = 'Esaurito';
                                } else if (remaining <= 2) {
                                    statusColor = '#FFD700';
                                    statusText = 'In esaurimento';
                                } else {
                                    statusText = `${used} utilizzati su ${total}`;
                                }
                            }

                            return (
                                <div style={{
                                    background: bgColor,
                                    padding: '1.5rem',
                                    borderRadius: 'var(--radius-lg)',
                                    border: `1px solid ${statusColor === 'var(--color-border)' ? statusColor : statusColor}`,
                                    boxShadow: statusColor !== 'var(--color-border)' ? `0 0 10px ${statusColor}20` : 'none',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between'
                                }}>
                                    {statusColor !== 'var(--color-border)' && (
                                        <div style={{
                                            position: 'absolute',
                                            top: 0, left: 0, width: '4px', height: '100%',
                                            background: statusColor
                                        }} />
                                    )}
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <Wallet size={20} color={statusColor !== 'var(--color-border)' ? statusColor : 'currentColor'} />
                                                Stato Contratto
                                            </div>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: statusColor !== 'var(--color-border)' ? statusColor : 'var(--color-text-muted)' }}>
                                                {statusText}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '2rem', fontWeight: 'bold', lineHeight: '1.2', marginBottom: '0.25rem' }}>
                                            {mainValue}
                                        </div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                            {subText}
                                        </div>
                                    </div>

                                    {showButton && (
                                        <button
                                            onClick={handleRentalCheckIn}
                                            style={{
                                                marginTop: '1rem',
                                                width: '100%',
                                                padding: '0.75rem',
                                                borderRadius: 'var(--radius-md)',
                                                background: 'var(--color-primary)',
                                                color: 'white',
                                                border: 'none',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '0.5rem'
                                            }}
                                        >
                                            <CheckCircle size={18} /> Segna Presenza
                                        </button>
                                    )}
                                </div>
                            );
                        })()
                    )}
                    <div style={{
                        background: 'var(--color-surface)',
                        padding: '1.5rem',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--color-border)'
                    }}>
                        <h3 style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                            Appuntamenti Oggi
                        </h3>
                        <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                            {todayAppointments.length}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                            {new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                    </div>

                    <div style={{
                        background: 'var(--color-surface)',
                        padding: '1.5rem',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--color-border)'
                    }}>
                        <h3 style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                            Prossimo Appuntamento
                        </h3>
                        {todayAppointments.length > 0 ? (
                            <div onClick={() => handleAppointmentClick(todayAppointments[0])} style={{ cursor: 'pointer' }}>
                                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-success)' }}>
                                    {new Date(todayAppointments[0].startTime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                                    {getClientName(todayAppointments[0].clientId)}
                                </p>
                            </div>
                        ) : (
                            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-text-muted)' }}>
                                Nessuno
                            </p>
                        )}
                    </div>
                </div>

                {/* Today's Appointments List */}
                <div style={{
                    background: 'var(--color-surface)',
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)'
                }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CalendarIcon size={20} />
                        Agenda di Oggi
                    </h3>

                    {todayAppointments.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '3rem',
                            color: 'var(--color-text-muted)'
                        }}>
                            <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>🎉 Nessun appuntamento oggi!</p>
                            <p style={{ fontSize: '0.9rem' }}>Goditi la giornata libera.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {todayAppointments.map(apt => {
                                const startTime = new Date(apt.startTime);
                                const endTime = new Date(apt.endTime);
                                const isPast = endTime < new Date();

                                return (
                                    <div
                                        key={apt.id}
                                        onClick={() => handleAppointmentClick(apt)}
                                        style={{
                                            padding: '1.25rem',
                                            borderRadius: 'var(--radius-md)',
                                            border: '2px solid var(--color-border)',
                                            background: isPast ? 'var(--color-surface-hover)' : 'linear-gradient(135deg, var(--color-surface) 0%, var(--color-surface-hover) 100%)',
                                            opacity: isPast ? 0.6 : 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '1rem',
                                            cursor: 'pointer',
                                            transition: 'transform 0.1s',
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                    >
                                        <div style={{
                                            minWidth: '80px',
                                            textAlign: 'center',
                                            padding: '0.75rem',
                                            borderRadius: 'var(--radius-md)',
                                            background: user?.profile?.color || 'var(--color-primary)',
                                            color: 'white'
                                        }}>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                                {startTime.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>
                                                {Math.round((endTime.getTime() - startTime.getTime()) / 60000)} min
                                            </div>
                                        </div>

                                        <div style={{ flex: 1 }}>
                                            <h4 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                                                {apt.title || 'Appuntamento'}
                                            </h4>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                <UserIcon size={14} color="var(--color-text-muted)" />
                                                <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                                                    {getClientName(apt.clientId)}
                                                </span>
                                            </div>
                                            {apt.notes && (
                                                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                                                    {apt.notes.length > 80 ? apt.notes.substring(0, 80) + '...' : apt.notes}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <span style={{
                                                padding: '0.5rem 1rem',
                                                borderRadius: '999px',
                                                fontSize: '0.75rem',
                                                fontWeight: '600',
                                                background: apt.status === 'COMPLETED' ? 'rgba(0, 204, 102, 0.2)' :
                                                    apt.status === 'CANCELLED' ? 'rgba(255, 68, 68, 0.2)' :
                                                        'rgba(66, 133, 244, 0.2)',
                                                color: apt.status === 'COMPLETED' ? '#00CC66' :
                                                    apt.status === 'CANCELLED' ? '#ff4444' :
                                                        '#4285F4'
                                            }}>
                                                {apt.status}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Upcoming Weekly Reminders Section */}
                <div style={{
                    marginTop: '2rem',
                    background: 'var(--color-surface)',
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)'
                }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Bell size={20} className="text-blue-500" />
                        Promemoria Settimana Prossima
                    </h3>

                    {upcomingAppointments.length === 0 ? (
                        <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '1rem' }}>Nessun appuntamento in arrivo nei prossimi 7 giorni.</p>
                    ) : (
                        <>
                            {/* Desktop View */}
                            <div className={classes.desktopOnly} style={{ display: 'grid', gap: '1rem' }}>
                                {upcomingAppointments.map(apt => {
                                    const client = clients.find(c => c.id === apt.clientId);
                                    const aptDate = new Date(apt.startTime);
                                    const dateStr = aptDate.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' });
                                    const timeStr = aptDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

                                    return (
                                        <div key={apt.id} style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '1rem',
                                            background: 'var(--color-surface-hover)',
                                            borderRadius: 'var(--radius-md)',
                                            border: '1px solid var(--color-border)',
                                            flexWrap: 'wrap', gap: '1rem'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{
                                                    background: 'var(--color-primary)', color: 'white',
                                                    padding: '0.5rem', borderRadius: 'var(--radius-md)',
                                                    textAlign: 'center', minWidth: '60px'
                                                }}>
                                                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{dateStr}</div>
                                                    <div style={{ fontSize: '1.1rem' }}>{timeStr}</div>
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '600' }}>{client ? `${client.firstName} ${client.lastName}` : 'Cliente sconosciuto'}</div>
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{apt.title}</div>
                                                </div>
                                            </div>

                                            {client && (
                                                <button
                                                    onClick={() => {
                                                        const phone = client.phone.replace(/[^0-9]/g, '');
                                                        const formattedPhone = phone.startsWith('3') && phone.length === 10 ? `39${phone}` : phone;
                                                        const text = `Ciao ${client.firstName}, ti scriviamo per ricordarti il tuo appuntamento presso il nostro studio.\n📅 Data: ${dateStr}\n⏰ Orario: ${timeStr}\n${apt.notes ? `\n${apt.notes}` : ''}\n\n❗ Questo messaggio richiede una conferma. Ti chiediamo di rispondere per confermare la tua presenza.\nIn assenza di risposta, l’appuntamento potrebbe essere cancellato per permettere ad altri clienti di prenotarsi.\n\n—\n${currentTenant?.name || 'InkFlow Studio'}\n📍 ${currentTenant?.address || ''}\n📲 ${currentTenant?.whatsapp || ''}`;
                                                        window.open(`https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(text)}`, '_blank');
                                                    }}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                        padding: '0.5rem 1rem',
                                                        background: '#25D366', color: 'white',
                                                        border: 'none', borderRadius: '999px',
                                                        fontWeight: '600', cursor: 'pointer',
                                                        fontSize: '0.9rem'
                                                    }}
                                                >
                                                    <MessageCircle size={16} />
                                                    Invia Reminder
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Mobile View */}
                            <div className={classes.mobileOnly} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {upcomingAppointments.map(apt => {
                                    const client = clients.find(c => c.id === apt.clientId);
                                    const aptDate = new Date(apt.startTime);
                                    const dateStr = aptDate.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' });
                                    const timeStr = aptDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

                                    return (
                                        <div key={apt.id} style={{
                                            background: 'var(--color-surface)',
                                            padding: '1rem',
                                            borderRadius: 'var(--radius-lg)',
                                            border: '1px solid var(--color-border)',
                                            display: 'flex', flexDirection: 'column', gap: '1rem'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{
                                                    background: 'var(--color-primary)', color: 'white',
                                                    padding: '0.5rem', borderRadius: 'var(--radius-md)',
                                                    textAlign: 'center', minWidth: '60px'
                                                }}>
                                                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{dateStr}</div>
                                                    <div style={{ fontSize: '1.1rem' }}>{timeStr}</div>
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>{client ? `${client.firstName} ${client.lastName}` : 'Sconosciuto'}</div>
                                                    <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{apt.title}</div>
                                                </div>
                                            </div>

                                            {client && (
                                                <button
                                                    onClick={() => {
                                                        const phone = client.phone.replace(/[^0-9]/g, '');
                                                        const formattedPhone = phone.startsWith('3') && phone.length === 10 ? `39${phone}` : phone;
                                                        const text = `Ciao ${client.firstName}, ti scriviamo per ricordarti il tuo appuntamento presso il nostro studio.\n📅 Data: ${dateStr}\n⏰ Orario: ${timeStr}\n${apt.notes ? `\n${apt.notes}` : ''}\n\n❗ Questo messaggio richiede una conferma. Ti chiediamo di rispondere per confermare la tua presenza.\nIn assenza di risposta, l’appuntamento potrebbe essere cancellato per permettere ad altri clienti di prenotarsi.\n\n—\n${currentTenant?.name || 'InkFlow Studio'}\n📍 ${currentTenant?.address || ''}\n📲 ${currentTenant?.whatsapp || ''}`;
                                                        window.open(`https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(text)}`, '_blank');
                                                    }}
                                                    style={{
                                                        width: '100%',
                                                        padding: '0.8rem',
                                                        background: '#25D366', color: 'white',
                                                        border: 'none', borderRadius: 'var(--radius-md)',
                                                        fontWeight: '600', cursor: 'pointer',
                                                        fontSize: '1rem',
                                                        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem'
                                                    }}
                                                >
                                                    <MessageCircle size={20} />
                                                    Invia Reminder WhatsApp
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>

                <AppointmentDetailsModal
                    isOpen={detailsModalOpen}
                    onClose={() => setDetailsModalOpen(false)}
                    appointment={selectedAppointment}
                    onSave={() => { /* Reload not critical for dashboard view but could be added */ }}
                />
            </div>
        );
    }

    // ...

    // MANAGER VIEW
    const monthlyData = monthlyStats;
    const { revenue: yearlyRevenue, appointments: totalAppointments, currentMonthRevenue } = yearlyTotals;

    return (
        <div style={{ paddingBottom: '2rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', lineHeight: '1.2' }}>
                        Benvenuto a {currentTenant?.name || 'InkFlow Studio'},<br />
                        <span style={{ color: 'var(--color-primary)' }}>{user?.name}</span>
                    </h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>
                        Panoramica Studio
                    </p>
                </div>
                <button
                    onClick={toggleFinancials}
                    style={{
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        color: 'var(--color-text-secondary)',
                        padding: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}
                    title={showFinancials ? "Nascondi importi" : "Mostra importi"}
                >
                    {showFinancials ? <Eye size={24} /> : <EyeOff size={24} />}
                </button>
            </div>

            {/* 1. Promemoria Giornaliero (Daily Reminder) */}
            <div style={{
                marginBottom: '2rem',
                background: 'var(--color-surface)',
                padding: '1.5rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)'
            }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CalendarIcon size={20} className="text-primary" />
                    Promemoria Giornaliero (Oggi)
                </h3>

                {todayAppointments.length === 0 ? (
                    <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '1rem' }}>Nessun appuntamento per oggi. Goditi la giornata!</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {todayAppointments.map(apt => {
                            const client = clients.find(c => c.id === apt.clientId);
                            const startTime = new Date(apt.startTime);
                            const timeStr = startTime.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

                            return (
                                <div key={apt.id} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '1rem',
                                    background: 'var(--color-surface-hover)',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--color-border)',
                                    flexWrap: 'wrap', gap: '1rem'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{
                                            background: 'var(--color-primary)', color: 'white',
                                            padding: '0.5rem', borderRadius: 'var(--radius-md)',
                                            textAlign: 'center', minWidth: '60px'
                                        }}>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{timeStr}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '600', fontSize: '1.05rem' }}>{client ? `${client.firstName} ${client.lastName}` : 'Cliente sconosciuto'}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{apt.title}</div>
                                        </div>
                                    </div>

                                    {client && (
                                        <button
                                            onClick={() => {
                                                const phone = client.phone.replace(/[^0-9]/g, '');
                                                const formattedPhone = phone.startsWith('3') && phone.length === 10 ? `39${phone}` : phone;
                                                const text = `Ciao ${client.firstName}, promemoria per il tuo appuntamento di OGGI alle ${timeStr}.\n📍 ${currentTenant?.name || 'InkFlow Studio'}`;
                                                window.open(`https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(text)}`, '_blank');
                                            }}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                padding: '0.5rem 1rem',
                                                background: '#25D366', color: 'white',
                                                border: 'none', borderRadius: '999px',
                                                fontWeight: '600', cursor: 'pointer',
                                                fontSize: '0.9rem',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            <MessageCircle size={16} />
                                            WhatsApp
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* 2. Promemoria Settimanale (Weekly Reminder) */}
            <div style={{
                marginBottom: '2rem',
                background: 'var(--color-surface)',
                padding: '1.5rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)'
            }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Bell size={20} color="#4285F4" />
                    Promemoria Settimana Prossima
                </h3>

                {upcomingAppointments.length === 0 ? (
                    <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '1rem' }}>Nessun appuntamento in arrivo nei prossimi 7 giorni.</p>
                ) : (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {upcomingAppointments.map(apt => {
                            const client = clients.find(c => c.id === apt.clientId);
                            const aptDate = new Date(apt.startTime);
                            const dateStr = aptDate.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' });
                            const timeStr = aptDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

                            return (
                                <div key={apt.id} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '1rem',
                                    background: 'var(--color-surface-hover)',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--color-border)',
                                    flexWrap: 'wrap', gap: '1rem'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{
                                            background: 'var(--color-secondary)', color: 'white',
                                            padding: '0.5rem', borderRadius: 'var(--radius-md)',
                                            textAlign: 'center', minWidth: '60px',
                                            backgroundColor: user?.role === 'MANAGER' ? '#666' : 'var(--color-primary)'
                                        }}>
                                            <div style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{dateStr}</div>
                                            <div style={{ fontSize: '1.1rem' }}>{timeStr}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '600' }}>{client ? `${client.firstName} ${client.lastName}` : 'Cliente sconosciuto'}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{apt.title}</div>
                                        </div>
                                    </div>

                                    {client && (
                                        <button
                                            onClick={() => {
                                                const phone = client.phone.replace(/[^0-9]/g, '');
                                                const formattedPhone = phone.startsWith('3') && phone.length === 10 ? `39${phone}` : phone;
                                                const text = `Ciao ${client.firstName}, ti scriviamo per ricordarti il tuo appuntamento presso il nostro studio.\n📅 Data: ${dateStr}\n⏰ Orario: ${timeStr}\n${apt.notes ? `\n${apt.notes}` : ''}\n\n❗ Questo messaggio richiede una conferma.\n\n—\n${currentTenant?.name || 'InkFlow Studio'}`;
                                                window.open(`https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(text)}`, '_blank');
                                            }}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                padding: '0.5rem 1rem',
                                                background: '#25D366', color: 'white',
                                                border: 'none', borderRadius: '999px',
                                                fontWeight: '600', cursor: 'pointer',
                                                fontSize: '0.9rem',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            <MessageCircle size={16} />
                                            WhatsApp
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* 3 & 4. Charts: Styles & Revenue */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem'
            }}>
                {/* 3. Stili Più Richiesti */}
                <div style={{
                    background: 'var(--color-surface)',
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)',
                    minHeight: '400px',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1.5rem' }}>
                        Stili Più Richiesti
                    </h3>
                    <div style={{ flex: 1, minHeight: 0 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={styleStats}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {styleStats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                                    itemStyle={{ color: 'var(--color-text-primary)' }}
                                />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 4. Andamento Fatturato */}
                <div style={{
                    background: 'var(--color-surface)',
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)',
                    minHeight: '400px',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1.5rem' }}>
                        Andamento Fatturato
                    </h3>
                    <div style={{ flex: 1, minHeight: 0 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                                <XAxis dataKey="month" stroke="var(--color-text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--color-text-secondary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => showFinancials ? `€${value}` : '••••'} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '8px' }}
                                    itemStyle={{ color: 'var(--color-text-primary)' }}
                                    formatter={(value: number) => [showFinancials ? `€${value}` : '••••', 'Fatturato']}
                                />
                                <Bar dataKey="revenue" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* 5, 6, 7. Stats Cards: Monthly, Annual, Total Apts */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1rem'
            }}>
                <div style={{
                    background: 'var(--color-surface)',
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <div style={{ padding: '0.5rem', background: 'rgba(66, 133, 244, 0.1)', borderRadius: '8px', color: '#4285F4' }}>
                            <DollarSign size={20} />
                        </div>
                        <h3 style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                            Fatturato Mensile
                        </h3>
                    </div>
                    <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                        {showFinancials ? `€${currentMonthRevenue.toLocaleString()}` : '••••'}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', textTransform: 'capitalize' }}>
                        {new Date().toLocaleString('it-IT', { month: 'long', year: 'numeric' })}
                    </p>
                </div>

                <div style={{
                    background: 'var(--color-surface)',
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <div style={{ padding: '0.5rem', background: 'rgba(255, 187, 40, 0.1)', borderRadius: '8px', color: '#FFBB28' }}>
                            <DollarSign size={20} />
                        </div>
                        <h3 style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                            Fatturato Annuale
                        </h3>
                    </div>
                    <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#FFBB28' }}>
                        {showFinancials ? `€${yearlyRevenue.toLocaleString()}` : '••••'}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                        Totale {new Date().getFullYear()}
                    </p>
                </div>

                <div style={{
                    background: 'var(--color-surface)',
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <div style={{ padding: '0.5rem', background: 'rgba(15, 157, 88, 0.1)', borderRadius: '8px', color: '#0F9D58' }}>
                            <CalendarIcon size={20} />
                        </div>
                        <h3 style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                            Appuntamenti Totali
                        </h3>
                    </div>
                    <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#0F9D58' }}>
                        {totalAppointments}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                        Nell'anno corrente
                    </p>
                </div>
            </div>
        </div>
    );
}
