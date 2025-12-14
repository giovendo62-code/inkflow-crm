import { useState } from 'react';
import { X } from 'lucide-react';
import { type Course } from '../../types';
import { storage } from '../../lib/storage';
import classes from '../crm/ClientListPage.module.css';

interface AddCourseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function AddCourseModal({ isOpen, onClose, onSuccess }: AddCourseModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        totalHours: '',
        price: '',
        schedule: '',
        program: '',
        maxStudents: '',
        status: 'PLANNED' as const
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const newCourse: Course = {
            id: `course-${Date.now()}`,
            tenantId: 'studio-1',
            name: formData.name,
            description: formData.description,
            startDate: formData.startDate,
            endDate: formData.endDate,
            totalHours: parseInt(formData.totalHours),
            price: parseFloat(formData.price),
            instructorId: 'user-manager', // Current user
            schedule: formData.schedule,
            program: formData.program,
            maxStudents: formData.maxStudents ? parseInt(formData.maxStudents) : undefined,
            status: formData.status,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        try {
            await storage.saveCourse(newCourse);
            onSuccess();
            onClose();
            resetForm();
        } catch (error) {
            console.error("Failed to save course:", error);
            alert("Errore salvataggio corso");
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            startDate: '',
            endDate: '',
            totalHours: '',
            price: '',
            schedule: '',
            program: '',
            maxStudents: '',
            status: 'PLANNED'
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
                    width: '100%',
                    maxWidth: '500px',
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
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Nuovo Corso</h2>
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

                <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>
                            Nome Corso *
                        </label>
                        <input
                            type="text"
                            className={classes.formInput}
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="es. Corso Base Tatuaggio 2024"
                            required
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>
                            Descrizione
                        </label>
                        <textarea
                            className={classes.formInput}
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Breve descrizione del corso"
                        />
                    </div>

                    <div className={classes.formGrid}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>
                                Data Inizio *
                            </label>
                            <input
                                type="date"
                                className={classes.formInput}
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>
                                Data Fine *
                            </label>
                            <input
                                type="date"
                                className={classes.formInput}
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className={classes.formGrid}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>
                                Giorni di Corso *
                            </label>
                            <input
                                type="number"
                                className={classes.formInput}
                                value={formData.totalHours}
                                onChange={(e) => setFormData({ ...formData, totalHours: e.target.value })}
                                placeholder="es. 5"
                                required
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>
                                Prezzo (€) *
                            </label>
                            <input
                                type="number"
                                className={classes.formInput}
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                placeholder="2500"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>
                            Orario
                        </label>
                        <input
                            type="text"
                            className={classes.formInput}
                            value={formData.schedule}
                            onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                            placeholder="es. Lunedì e Mercoledì 14:00-18:00"
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>
                            Posti Disponibili
                        </label>
                        <input
                            type="number"
                            className={classes.formInput}
                            value={formData.maxStudents}
                            onChange={(e) => setFormData({ ...formData, maxStudents: e.target.value })}
                            placeholder="10"
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>
                            Programma
                        </label>
                        <textarea
                            className={classes.formInput}
                            rows={6}
                            value={formData.program}
                            onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                            placeholder="Inserisci il programma dettagliato del corso..."
                        />
                    </div>

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
                            Crea Corso
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
