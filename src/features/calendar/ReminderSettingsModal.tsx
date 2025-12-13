import { useState } from 'react';
import { X, MessageCircle, Mail, Bell } from 'lucide-react';
import { type Appointment } from '../../types';
import classes from '../crm/ClientListPage.module.css';

interface ReminderSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    appointment: Appointment | null;
    onSave: (reminders: { whatsapp: boolean; sms: boolean; email: boolean }) => void;
}

export function ReminderSettingsModal({ isOpen, onClose, appointment, onSave }: ReminderSettingsModalProps) {
    const [reminders, setReminders] = useState<{ whatsapp: boolean; sms: boolean; email: boolean }>({
        whatsapp: appointment?.reminders?.whatsapp || false,
        sms: appointment?.reminders?.sms || false,
        email: appointment?.reminders?.email || true
    });

    const handleSave = () => {
        onSave(reminders);
        onClose();
    };

    if (!isOpen || !appointment) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 100, padding: '2rem'
        }}>
            <div style={{
                backgroundColor: 'var(--color-surface)', padding: '2rem', borderRadius: 'var(--radius-lg)',
                width: '100%', maxWidth: '500px', border: '1px solid var(--color-border)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Promemoria Appuntamento</h2>
                    <button onClick={onClose}><X size={24} /></button>
                </div>

                <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255, 107, 53, 0.1)', borderRadius: 'var(--radius-md)' }}>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                        <strong>Appuntamento:</strong> {appointment.title}
                    </p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                        {new Date(appointment.startTime).toLocaleString('it-IT', {
                            dateStyle: 'full',
                            timeStyle: 'short'
                        })}
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                    {/* WhatsApp */}
                    <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        border: reminders.whatsapp ? '2px solid #25D366' : '1px solid var(--color-border)',
                        background: reminders.whatsapp ? 'rgba(37, 211, 102, 0.1)' : 'var(--color-surface-hover)',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}>
                        <input
                            type="checkbox"
                            checked={reminders.whatsapp}
                            onChange={e => setReminders({ ...reminders, whatsapp: e.target.checked })}
                            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                        />
                        <MessageCircle size={24} style={{ color: '#25D366' }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>WhatsApp</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                Invia promemoria via WhatsApp 24h prima
                            </div>
                        </div>
                    </label>

                    {/* SMS */}
                    <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        border: reminders.sms ? '2px solid #4285F4' : '1px solid var(--color-border)',
                        background: reminders.sms ? 'rgba(66, 133, 244, 0.1)' : 'var(--color-surface-hover)',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}>
                        <input
                            type="checkbox"
                            checked={reminders.sms}
                            onChange={e => setReminders({ ...reminders, sms: e.target.checked })}
                            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                        />
                        <Bell size={24} style={{ color: '#4285F4' }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>SMS</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                Invia SMS di promemoria 2h prima
                            </div>
                        </div>
                    </label>

                    {/* Email */}
                    <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        border: reminders.email ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                        background: reminders.email ? 'rgba(255, 107, 53, 0.1)' : 'var(--color-surface-hover)',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}>
                        <input
                            type="checkbox"
                            checked={reminders.email}
                            onChange={e => setReminders({ ...reminders, email: e.target.checked })}
                            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                        />
                        <Mail size={24} style={{ color: 'var(--color-primary)' }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Email</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                Invia email di conferma e promemoria
                            </div>
                        </div>
                    </label>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={onClose}
                        style={{
                            flex: 1,
                            padding: '0.75rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            background: 'transparent',
                            color: 'var(--color-text-primary)',
                            cursor: 'pointer'
                        }}
                    >
                        Annulla
                    </button>
                    <button
                        onClick={handleSave}
                        className={classes.addBtn}
                        style={{ flex: 1, justifyContent: 'center' }}
                    >
                        Salva Promemoria
                    </button>
                </div>
            </div>
        </div>
    );
}
