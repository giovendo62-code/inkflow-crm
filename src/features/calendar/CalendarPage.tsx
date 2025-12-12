import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer, type View, Views, type Event as CalendarEvent } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './CalendarTheme.css';

import { useAuth } from '../auth/AuthContext';
import { storage } from '../../lib/storage';
import { type Appointment, type User } from '../../types';
import { AppointmentDetailsModal } from './AppointmentDetailsModal';
import { NewAppointmentModal } from './NewAppointmentModal';

const locales = {
    'en-US': enUS,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

export function CalendarPage() {
    const { user } = useAuth();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [view, setView] = useState<View>(Views.MONTH);
    const [artists, setArtists] = useState<User[]>([]);
    const [selectedArtistId, setSelectedArtistId] = useState<string>('all');
    const [artistViewFilter, setArtistViewFilter] = useState<'mine' | 'all'>('mine'); // For artists

    // Modals State
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [newAppointmentModalOpen, setNewAppointmentModalOpen] = useState(false);
    const [selectedSlotDate, setSelectedSlotDate] = useState<Date | undefined>(undefined);

    useEffect(() => {
        // Load artists for filter
        const allUsers = storage.getUsers();
        const artistUsers = allUsers.filter(u => u.role === 'ARTIST');
        setArtists(artistUsers);
    }, [user]);

    const loadAppointments = () => {
        const allAppointments = storage.getAppointments();

        if (user?.role === 'MANAGER') {
            if (selectedArtistId === 'all') {
                setAppointments(allAppointments);
            } else {
                setAppointments(allAppointments.filter(a => a.artistId === selectedArtistId));
            }
        } else if (user?.role === 'ARTIST') {
            // Artist view filter
            if (artistViewFilter === 'mine') {
                setAppointments(allAppointments.filter(a => a.artistId === user.id));
            } else if (artistViewFilter === 'all') {
                setAppointments(allAppointments); // Show all
            } else {
                // Specific artist selected
                setAppointments(allAppointments.filter(a => a.artistId === artistViewFilter));
            }
        }
    };

    useEffect(() => {
        loadAppointments();
    }, [user, selectedArtistId, artistViewFilter]);

    // Transform to Events
    interface CustomEvent extends CalendarEvent {
        resource: Appointment;
    }

    const events: CustomEvent[] = appointments.map(apt => ({
        title: apt.title,
        start: new Date(apt.startTime),
        end: new Date(apt.endTime),
        resource: apt,
    }));

    // Get artist color helper
    const getArtistColor = (artistId: string) => {
        if (user?.id === artistId) return user.profile?.color || '#FF6B35';
        const artist = artists.find(a => a.id === artistId);
        if (artist) return artist.profile?.color || '#FF6B35';
        const allUsers = storage.getUsers();
        const foundUser = allUsers.find(u => u.id === artistId);
        return foundUser?.profile?.color || '#FF6B35';
    };

    const handleEventClick = (event: CustomEvent) => {
        const appointment = event.resource;
        if (appointment) {
            setSelectedAppointment(appointment);
            setDetailsModalOpen(true);
        }
    };

    const handleSelectSlot = ({ start }: { start: Date }) => {
        setSelectedSlotDate(start);
        setNewAppointmentModalOpen(true);
    };

    const handleAppointmentSaved = () => {
        loadAppointments(); // Refresh calendar
    };

    return (
        <div style={{ padding: '2rem', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>Calendar</h1>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {user?.role === 'MANAGER' && (
                        <select
                            value={selectedArtistId}
                            onChange={(e) => setSelectedArtistId(e.target.value)}
                            style={{
                                padding: '0.5rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                backgroundColor: 'var(--color-surface)',
                                color: 'var(--color-text-primary)'
                            }}
                        >
                            <option value="all">All Artists</option>
                            {artists.map(a => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                        </select>
                    )}
                    {user?.role === 'ARTIST' && (
                        <select
                            value={artistViewFilter}
                            onChange={(e) => setArtistViewFilter(e.target.value as any)}
                            style={{
                                padding: '0.5rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                backgroundColor: 'var(--color-surface)',
                                color: 'var(--color-text-primary)',
                                fontWeight: '600'
                            }}
                        >
                            <option value="mine">📅 I Miei Appuntamenti</option>
                            <option value="all">🌍 Tutti gli Appuntamenti</option>
                            <option disabled>─────────</option>
                            {artists.filter(a => a.id !== user.id).map(artist => (
                                <option key={artist.id} value={artist.id}>
                                    👤 {artist.name}
                                </option>
                            ))}
                        </select>
                    )}
                    <button
                        onClick={() => {
                            setSelectedSlotDate(new Date());
                            setNewAppointmentModalOpen(true);
                        }}
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: 'var(--color-primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        + New Appointment
                    </button>
                </div>
            </div>

            <div style={{ height: 'calc(100vh - 200px)', backgroundColor: 'var(--color-surface)', padding: '1rem', borderRadius: 'var(--radius-lg)' }}>
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }}
                    view={view}
                    onView={setView}
                    views={[Views.MONTH, Views.WEEK, Views.DAY]}
                    selectable
                    onSelectEvent={handleEventClick}
                    onSelectSlot={handleSelectSlot}
                    eventPropGetter={(event) => {
                        const apt = (event as CustomEvent).resource;
                        return {
                            style: {
                                backgroundColor: getArtistColor(apt.artistId),
                                border: 'none',
                                borderRadius: '4px',
                                color: 'white'
                            }
                        }
                    }}
                />
            </div>

            <AppointmentDetailsModal
                isOpen={detailsModalOpen}
                onClose={() => setDetailsModalOpen(false)}
                appointment={selectedAppointment}
                onSave={handleAppointmentSaved}
            />

            <NewAppointmentModal
                isOpen={newAppointmentModalOpen}
                onClose={() => setNewAppointmentModalOpen(false)}
                onSave={handleAppointmentSaved}
                initialDate={selectedSlotDate}
            />
        </div>
    );
}
