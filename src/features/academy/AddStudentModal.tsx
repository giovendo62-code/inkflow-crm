import { useState } from 'react';
import { X } from 'lucide-react';
import { type Student, type Course } from '../../types';
import { storage } from '../../lib/storage';
import { useAuth } from '../auth/AuthContext';
import classes from '../crm/ClientListPage.module.css';

interface AddStudentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    courses: Course[];
}

export function AddStudentModal({ isOpen, onClose, onSuccess, courses }: AddStudentModalProps) {
    const { user } = useAuth();
    const [createdCredentials, setCreatedCredentials] = useState<{ email: string, password: string } | null>(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        fiscalCode: '',
        birthDate: '',
        street: '',
        city: '',
        zip: '',
        courseId: '',
        enrollmentDate: new Date().toISOString().split('T')[0],
        totalPaid: '',
        notes: ''
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.courseId) {
            alert('Seleziona un corso');
            return;
        }

        if (!user?.tenantId) {
            alert('Errore: Tenant ID non trovato');
            return;
        }

        const newStudent: Student = {
            id: `student-${Date.now()}`,
            tenantId: user.tenantId,
            courseId: formData.courseId,
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            fiscalCode: formData.fiscalCode,
            birthDate: formData.birthDate,
            street: formData.street,
            city: formData.city,
            zip: formData.zip,
            enrollmentDate: formData.enrollmentDate,
            status: 'ACTIVE',
            totalPaid: parseFloat(formData.totalPaid) || 0,
            notes: formData.notes,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        try {
            await storage.saveStudent(newStudent);
            onSuccess();
            // Don't close immediately, show credentials
            // onClose(); 
            // resetForm(); // Don't reset form yet, maybe just clear some sensitive fields if needed, but here we want to show success UI overlay

            // Set credentials to show overlay
            setCreatedCredentials({
                email: newStudent.email,
                password: "password123" // Same mock password
            });

        } catch (error) {
            console.error("Failed to save student:", error);
            alert("Errore salvataggio corsista");
        }
    };

    const resetForm = () => {
        setCreatedCredentials(null);
        setFormData({
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            fiscalCode: '',
            birthDate: '',
            street: '',
            city: '',
            zip: '',
            courseId: '',
            enrollmentDate: new Date().toISOString().split('T')[0],
            totalPaid: '',
            notes: ''
        });
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.7)',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '1rem',
                paddingTop: '3rem'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: 'var(--color-surface)',
                    borderRadius: 'var(--radius-lg)',
                    width: '90%',
                    maxWidth: '600px',
                    maxHeight: '90vh',
                    overflow: 'auto'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    position: 'sticky',
                    top: 0,
                    background: 'var(--color-surface)',
                    zIndex: 10
                }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Aggiungi Corsista</h2>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '0.5rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            background: 'transparent',
                            cursor: 'pointer'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Personal Info */}
                    <section>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>
                            Informazioni Personali
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>
                                    Nome *
                                </label>
                                <input
                                    type="text"
                                    className={classes.searchInput}
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>
                                    Cognome *
                                </label>
                                <input
                                    type="text"
                                    className={classes.searchInput}
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    className={classes.searchInput}
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>
                                    Telefono *
                                </label>
                                <input
                                    type="tel"
                                    className={classes.searchInput}
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>
                                    Codice Fiscale
                                </label>
                                <input
                                    type="text"
                                    className={classes.searchInput}
                                    value={formData.fiscalCode}
                                    onChange={(e) => setFormData({ ...formData, fiscalCode: e.target.value })}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>
                                    Data di Nascita
                                </label>
                                <input
                                    type="date"
                                    className={classes.searchInput}
                                    value={formData.birthDate}
                                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                                />
                            </div>
                        </div>
                    </section>

                    {/* Address */}
                    <section>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>
                            Indirizzo
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>
                                    Via
                                </label>
                                <input
                                    type="text"
                                    className={classes.searchInput}
                                    value={formData.street}
                                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>
                                    Città
                                </label>
                                <input
                                    type="text"
                                    className={classes.searchInput}
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>
                                    CAP
                                </label>
                                <input
                                    type="text"
                                    className={classes.searchInput}
                                    value={formData.zip}
                                    onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                                />
                            </div>
                        </div>
                    </section>

                    {/* Course Info */}
                    <section>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>
                            Informazioni Corso
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>
                                    Corso *
                                </label>
                                <select
                                    className={classes.searchInput}
                                    value={formData.courseId}
                                    onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                                    required
                                >
                                    <option value="">-- Seleziona Corso --</option>
                                    {courses.map(course => (
                                        <option key={course.id} value={course.id}>
                                            {course.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>
                                    Data Iscrizione *
                                </label>
                                <input
                                    type="date"
                                    className={classes.searchInput}
                                    value={formData.enrollmentDate}
                                    onChange={(e) => setFormData({ ...formData, enrollmentDate: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>
                                    Già Pagato (€)
                                </label>
                                <input
                                    type="number"
                                    className={classes.searchInput}
                                    value={formData.totalPaid}
                                    onChange={(e) => setFormData({ ...formData, totalPaid: e.target.value })}
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Notes */}
                    <section>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>
                            Note
                        </label>
                        <textarea
                            className={classes.searchInput}
                            rows={3}
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Note aggiuntive..."
                        />
                    </section>

                    <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '1rem' }}>
                        <button
                            type="button"
                            onClick={() => {
                                onClose();
                                resetForm();
                            }}
                            style={{
                                flex: 1,
                                padding: '0.875rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                background: 'transparent',
                                color: 'var(--color-text-secondary)',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                fontWeight: '600'
                            }}
                        >
                            Annulla
                        </button>
                        <button
                            type="submit"
                            style={{
                                flex: 1,
                                padding: '0.875rem',
                                borderRadius: 'var(--radius-md)',
                                border: 'none',
                                background: 'var(--color-primary)',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                fontWeight: '600'
                            }}
                        >
                            Aggiungi Corsista
                        </button>
                    </div>
                </form>

                {createdCredentials && (
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'var(--color-surface)',
                        padding: '2rem',
                        borderRadius: 'var(--radius-lg)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        zIndex: 20
                    }}>
                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(66, 133, 244, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ color: '#4285F4' }}>🎓</div>
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', textAlign: 'center' }}>Studente Iscritto!</h3>
                        <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', marginBottom: '2rem', maxWidth: '400px' }}>
                            Condividi queste credenziali provvisorie con lo studente per permettergli di accedere all'Academy.
                        </p>

                        <div style={{ background: 'var(--color-surface-hover)', padding: '1.5rem', borderRadius: 'var(--radius-md)', width: '100%', maxWidth: '400px', marginBottom: '2rem', border: '1px solid var(--color-border)' }}>
                            <div style={{ marginBottom: '1rem' }}>
                                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>EMAIL</span>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <code style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{createdCredentials.email}</code>
                                </div>
                            </div>
                            <div>
                                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>PASSWORD PROVVISORIA</span>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <code style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{createdCredentials.password}</code>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                onClose();
                                resetForm();
                            }}
                            className={classes.primaryButton}
                            style={{
                                width: '100%', maxWidth: '400px',
                                background: '#4285F4', color: 'white', border: 'none', padding: '1rem', borderRadius: 'var(--radius-md)', fontWeight: 'bold', cursor: 'pointer'
                            }}
                        >
                            Chiudi
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
