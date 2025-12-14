import { useState, useEffect } from 'react';
import { X, Euro, Plus, Calendar, Clock, CheckCircle, XCircle, FileText, Video, Link as LinkIcon, Trash2, Lock, Unlock, Eye, EyeOff } from 'lucide-react';
import { type Student, type Course, type CoursePayment, type Attendance, type TeachingMaterial } from '../../types';
import { storage } from '../../lib/storage';
import classes from '../crm/ClientListPage.module.css';

interface StudentDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: Student | null;
    course: Course | null;
    onSave: (student: Student) => void;
    onDelete?: (studentId: string) => void;
}

export function StudentDetailsModal({ isOpen, onClose, student, course, onSave, onDelete }: StudentDetailsModalProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState<Student | null>(null);
    const [activeTab, setActiveTab] = useState<'PAYMENTS' | 'ATTENDANCE' | 'MATERIALS'>('PAYMENTS');

    // Payments State
    const [payments, setPayments] = useState<CoursePayment[]>([]);
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [newPayment, setNewPayment] = useState({
        amount: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'CASH' as const,
        notes: ''
    });

    // Attendance State
    const [attendances, setAttendances] = useState<Attendance[]>([]);
    const [showAttendanceForm, setShowAttendanceForm] = useState(false);
    const [newAttendance, setNewAttendance] = useState({
        date: new Date().toISOString().split('T')[0],
        hours: 4,
        present: true,
        notes: ''
    });

    // Materials State
    const [materials, setMaterials] = useState<TeachingMaterial[]>([]);
    const [showMaterialForm, setShowMaterialForm] = useState(false);
    const [newMaterial, setNewMaterial] = useState<{
        title: string;
        url: string;
        type: 'PDF' | 'VIDEO' | 'LINK' | 'IMAGE';
        unlockThresholdDays: number;
        description: string;
    }>({
        title: '',
        url: '',
        type: 'PDF',
        unlockThresholdDays: 0,
        description: ''
    });

    useEffect(() => {
        if (student) {
            setFormData(student);
            setIsEditing(false);

            const loadDetails = async () => {
                try {
                    const [allPayments, allAttendances, allMaterials] = await Promise.all([
                        storage.getCoursePayments(),
                        storage.getAttendances(),
                        storage.getMaterials()
                    ]);
                    setPayments(allPayments.filter(p => p.studentId === student.id));
                    setAttendances(allAttendances.filter(a => a.studentId === student.id));
                    setMaterials(allMaterials.filter(m => m.studentId === student.id));
                } catch (e) {
                    console.error("Error loading student details", e);
                }
            };
            loadDetails();
        }
    }, [student]);

    if (!isOpen || !student || !formData) return null;

    const handleSave = () => {
        if (formData) {
            const updatedStudent = {
                ...formData,
                updatedAt: new Date().toISOString()
            };
            onSave(updatedStudent);
            setIsEditing(false);
        }
    };

    const handleAddMaterial = async () => {
        if (!newMaterial.title || !newMaterial.url) {
            alert('Inserisci titolo e URL/File');
            return;
        }

        const material: TeachingMaterial = {
            id: self.crypto.randomUUID(),
            tenantId: 'studio-1',
            studentId: student.id,
            courseId: student.courseId,
            title: newMaterial.title,
            description: newMaterial.description,
            url: newMaterial.url,
            type: newMaterial.type,
            unlockThresholdDays: newMaterial.unlockThresholdDays,
            createdAt: new Date().toISOString()
        };

        try {
            await storage.saveMaterial(material);

            // Refresh
            const allMaterials = await storage.getMaterials();
            setMaterials(allMaterials.filter(m => m.studentId === student.id));

            setNewMaterial({
                title: '',
                url: '',
                type: 'PDF',
                unlockThresholdDays: 0,
                description: ''
            });
            setShowMaterialForm(false);
        } catch (error) {
            console.error(error);
            alert("Errore salvataggio materiale");
        }
    };

    const handleDeleteMaterial = async (id: string) => {
        if (confirm('Eliminare questo materiale?')) {
            try {
                await storage.deleteMaterial(id);
                setMaterials(materials.filter(m => m.id !== id));
            } catch (error) {
                console.error(error);
                alert("Errore eliminazione materiale");
            }
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                alert('File troppo grande (Max 2MB)');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewMaterial(prev => ({ ...prev, url: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddPayment = async () => {
        if (!newPayment.amount || parseFloat(newPayment.amount) <= 0) {
            alert('Inserisci un importo valido');
            return;
        }

        const payment: CoursePayment = {
            id: self.crypto.randomUUID(),
            tenantId: 'studio-1',
            studentId: student.id,
            courseId: student.courseId,
            amount: parseFloat(newPayment.amount),
            paymentDate: newPayment.paymentDate,
            paymentMethod: newPayment.paymentMethod,
            notes: newPayment.notes,
            createdAt: new Date().toISOString()
        };

        try {
            await storage.saveCoursePayment(payment);

            // Update student total paid
            const newTotalPaid = formData.totalPaid + payment.amount;
            const updatedStudent = {
                ...formData,
                totalPaid: newTotalPaid,
                updatedAt: new Date().toISOString()
            };

            setFormData(updatedStudent);
            onSave(updatedStudent);

            // Refresh payments list
            const allPayments = await storage.getCoursePayments();
            setPayments(allPayments.filter(p => p.studentId === student.id));

            // Reset form
            setNewPayment({
                amount: '',
                paymentDate: new Date().toISOString().split('T')[0],
                paymentMethod: 'CASH',
                notes: ''
            });
            setShowPaymentForm(false);
        } catch (error) {
            console.error(error);
            alert("Errore salvataggio pagamento");
        }
    };

    const handleAddAttendance = async () => {
        if (newAttendance.hours <= 0) {
            alert('Inserisci un numero di ore valido');
            return;
        }

        const attendance: Attendance = {
            id: self.crypto.randomUUID(),
            tenantId: 'studio-1',
            studentId: student.id,
            courseId: student.courseId,
            date: newAttendance.date,
            present: newAttendance.present,
            hours: newAttendance.hours,
            notes: newAttendance.notes,
            createdAt: new Date().toISOString()
        };

        try {
            await storage.saveAttendance(attendance);

            // Refresh list
            const allAttendances = await storage.getAttendances();
            setAttendances(allAttendances.filter(a => a.studentId === student.id));

            setShowAttendanceForm(false);
            setNewAttendance({
                date: new Date().toISOString().split('T')[0],
                hours: 4,
                present: true,
                notes: ''
            });
        } catch (error) {
            console.error(error);
            alert("Errore salvataggio presenza");
        }
    };

    const remainingAmount = course ? course.price - formData.totalPaid : 0;

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
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '1rem'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: 'var(--color-surface)',
                    borderRadius: 'var(--radius-lg)',
                    width: '100%',
                    maxWidth: '900px',
                    maxHeight: '90vh',
                    overflow: 'auto'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
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
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>
                        {formData.firstName} {formData.lastName}
                    </h2>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {!isEditing ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(true)}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--color-primary)',
                                        background: 'var(--color-primary)',
                                        color: 'white',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        fontWeight: '500'
                                    }}
                                >
                                    Modifica
                                </button>
                                <button
                                    type="button"
                                    onClick={async (e) => {
                                        e.preventDefault();
                                        e.stopPropagation();

                                        const confirmed = confirm(`Sei sicuro di voler eliminare ${formData.firstName} ${formData.lastName}?\n\nQuesta azione NON può essere annullata!`);

                                        if (confirmed) {
                                            console.log('Eliminazione corsista:', student.id);

                                            try {
                                                // Delete using storage helper
                                                await storage.deleteStudent(student.id);

                                                console.log('Chiudo modal e ricarico');
                                                onClose();

                                                if (onDelete) {
                                                    onDelete(student.id);
                                                }
                                            } catch (error) {
                                                console.error(error);
                                                alert("Errore eliminazione studente");
                                            }
                                        }
                                    }}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid #ff4444',
                                        background: '#ff4444',
                                        color: 'white',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        fontWeight: '500'
                                    }}
                                >
                                    Elimina
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => {
                                        setFormData(student);
                                        setIsEditing(false);
                                    }}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--color-border)',
                                        background: 'transparent',
                                        color: 'var(--color-text-secondary)',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    Annulla
                                </button>
                                <button
                                    onClick={handleSave}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--color-success)',
                                        background: 'var(--color-success)',
                                        color: 'white',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        fontWeight: '500'
                                    }}
                                >
                                    Salva
                                </button>
                            </>
                        )}
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
                </div>

                {/* Content */}
                <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    {/* Left Column - Student Info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* Personal Info */}
                        <section>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>
                                Informazioni Personali
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                        Nome
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            className={classes.searchInput}
                                            value={formData.firstName}
                                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                        />
                                    ) : (
                                        <p>{formData.firstName}</p>
                                    )}
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                        Cognome
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            className={classes.searchInput}
                                            value={formData.lastName}
                                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                        />
                                    ) : (
                                        <p>{formData.lastName}</p>
                                    )}
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                        Email
                                    </label>
                                    <p style={{ fontSize: '0.95rem' }}>{formData.email}</p>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                        Telefono
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="tel"
                                            className={classes.searchInput}
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    ) : (
                                        <p>{formData.phone}</p>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Course Info */}
                        <section>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>
                                Informazioni Corso
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'block' }}>
                                        Corso
                                    </label>
                                    <p style={{ fontSize: '0.95rem', fontWeight: '600' }}>
                                        {course?.name || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'block' }}>
                                        Data Iscrizione
                                    </label>
                                    <p style={{ fontSize: '0.95rem' }}>
                                        {new Date(formData.enrollmentDate).toLocaleDateString('it-IT')}
                                    </p>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'block' }}>
                                        Stato
                                    </label>
                                    <span style={{
                                        display: 'inline-block',
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '999px',
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        background: formData.status === 'ACTIVE' ? 'rgba(0, 204, 102, 0.2)' : 'rgba(255, 68, 68, 0.2)',
                                        color: formData.status === 'ACTIVE' ? '#00CC66' : '#ff4444'
                                    }}>
                                        {formData.status}
                                    </span>
                                </div>
                            </div>
                        </section>

                        {/* Access Credentials */}
                        <section>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Lock size={18} />
                                Credenziali Accesso
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--color-surface-hover)', padding: '1rem', borderRadius: '8px' }}>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                                        Email Accesso
                                    </label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <code style={{ fontSize: '0.95rem', background: 'var(--color-surface)', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--color-border)', flex: 1 }}>
                                            {formData.email}
                                        </code>
                                    </div>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                                        Password
                                    </label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <code style={{ fontSize: '0.95rem', background: 'var(--color-surface)', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--color-border)', flex: 1, fontFamily: 'monospace' }}>
                                            {showPassword ? "password123" : "•••••••••••"}
                                        </code>
                                        <button
                                            onClick={() => setShowPassword(!showPassword)}
                                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}
                                            title={showPassword ? "Nascondi" : "Mostra"}
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                                        * Password predefinita per nuovi account.
                                    </p>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Column - Tabs */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* Tabs Navigation */}
                        <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)' }}>
                            <button
                                type="button"
                                onClick={() => setActiveTab('PAYMENTS')}
                                style={{
                                    flex: 1,
                                    padding: '1rem',
                                    border: 'none',
                                    background: 'transparent',
                                    borderBottom: activeTab === 'PAYMENTS' ? '2px solid var(--color-primary)' : '2px solid transparent',
                                    color: activeTab === 'PAYMENTS' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                                    fontWeight: activeTab === 'PAYMENTS' ? '600' : '400',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                    <Euro size={18} />
                                    Pagamenti
                                </div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('ATTENDANCE')}
                                style={{
                                    flex: 1,
                                    padding: '1rem',
                                    border: 'none',
                                    background: 'transparent',
                                    borderBottom: activeTab === 'ATTENDANCE' ? '2px solid var(--color-primary)' : '2px solid transparent',
                                    color: activeTab === 'ATTENDANCE' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                                    fontWeight: activeTab === 'ATTENDANCE' ? '600' : '400',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                    <Clock size={18} />
                                    Presenze
                                </div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('MATERIALS')}
                                style={{
                                    flex: 1,
                                    padding: '1rem',
                                    border: 'none',
                                    background: 'transparent',
                                    borderBottom: activeTab === 'MATERIALS' ? '2px solid var(--color-primary)' : '2px solid transparent',
                                    color: activeTab === 'MATERIALS' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                                    fontWeight: activeTab === 'MATERIALS' ? '600' : '400',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                    <FileText size={18} />
                                    Materiali
                                </div>
                            </button>
                        </div>

                        {activeTab === 'PAYMENTS' ? (
                            <>
                                {/* Payment Summary */}
                                <section style={{
                                    padding: '1.5rem',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    borderRadius: 'var(--radius-lg)',
                                    color: 'white'
                                }}>
                                    <h3 style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '1rem' }}>
                                        Situazione Pagamenti
                                    </h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                        <div>
                                            <p style={{ fontSize: '0.75rem', opacity: 0.8 }}>Totale</p>
                                            <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                                €{course?.price.toLocaleString() || 0}
                                            </p>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '0.75rem', opacity: 0.8 }}>Pagato</p>
                                            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4ade80' }}>
                                                €{formData.totalPaid.toLocaleString()}
                                            </p>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '0.75rem', opacity: 0.8 }}>Rimanente</p>
                                            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: remainingAmount > 0 ? '#fbbf24' : '#4ade80' }}>
                                                €{remainingAmount.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div style={{
                                        width: '100%',
                                        height: '8px',
                                        background: 'rgba(255,255,255,0.2)',
                                        borderRadius: '999px',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            width: `${course ? (formData.totalPaid / course.price) * 100 : 0}% `,
                                            height: '100%',
                                            background: '#4ade80',
                                            transition: 'width 0.3s'
                                        }} />
                                    </div>
                                </section>

                                {/* Add Payment Button */}
                                {!showPaymentForm ? (
                                    <button
                                        type="button"
                                        onClick={() => setShowPaymentForm(true)}
                                        style={{
                                            padding: '0.875rem',
                                            borderRadius: 'var(--radius-md)',
                                            border: '2px dashed var(--color-border)',
                                            background: 'transparent',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem',
                                            fontWeight: '600',
                                            color: 'var(--color-primary)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem'
                                        }}
                                    >
                                        <Plus size={20} />
                                        Registra Pagamento
                                    </button>
                                ) : (
                                    <div style={{
                                        padding: '1rem',
                                        background: 'var(--color-surface-hover)',
                                        borderRadius: 'var(--radius-md)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.75rem'
                                    }}>
                                        <h4 style={{ fontSize: '0.9rem', fontWeight: '600' }}>Nuovo Pagamento</h4>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                                                    Importo (€) *
                                                </label>
                                                <input
                                                    type="number"
                                                    className={classes.searchInput}
                                                    value={newPayment.amount}
                                                    onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                                                    placeholder="500"
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                                                    Data
                                                </label>
                                                <input
                                                    type="date"
                                                    className={classes.searchInput}
                                                    value={newPayment.paymentDate}
                                                    onChange={(e) => setNewPayment({ ...newPayment, paymentDate: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                                                Metodo
                                            </label>
                                            <select
                                                className={classes.searchInput}
                                                value={newPayment.paymentMethod}
                                                onChange={(e) => setNewPayment({ ...newPayment, paymentMethod: e.target.value as any })}
                                            >
                                                <option value="CASH">Contanti</option>
                                                <option value="CARD">Carta</option>
                                                <option value="BANK_TRANSFER">Bonifico</option>
                                                <option value="OTHER">Altro</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                                                Note
                                            </label>
                                            <input
                                                type="text"
                                                className={classes.searchInput}
                                                value={newPayment.notes}
                                                onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
                                                placeholder="es. Acconto, Saldo..."
                                            />
                                        </div>

                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                type="button"
                                                onClick={() => setShowPaymentForm(false)}
                                                style={{
                                                    flex: 1,
                                                    padding: '0.5rem',
                                                    borderRadius: 'var(--radius-md)',
                                                    border: '1px solid var(--color-border)',
                                                    background: 'transparent',
                                                    cursor: 'pointer',
                                                    fontSize: '0.85rem'
                                                }}
                                            >
                                                Annulla
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleAddPayment}
                                                style={{
                                                    flex: 1,
                                                    padding: '0.5rem',
                                                    borderRadius: 'var(--radius-md)',
                                                    border: 'none',
                                                    background: 'var(--color-success)',
                                                    color: 'white',
                                                    cursor: 'pointer',
                                                    fontSize: '0.85rem',
                                                    fontWeight: '600'
                                                }}
                                            >
                                                Aggiungi
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Payments List */}
                                <section>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Calendar size={18} />
                                        Storico Pagamenti
                                    </h3>
                                    {payments.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {payments
                                                .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
                                                .map(payment => (
                                                    <div
                                                        key={payment.id}
                                                        style={{
                                                            padding: '0.75rem',
                                                            background: 'var(--color-surface-hover)',
                                                            borderRadius: 'var(--radius-md)',
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center'
                                                        }}
                                                    >
                                                        <div>
                                                            <p style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                                                                €{payment.amount.toLocaleString()}
                                                            </p>
                                                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                                                {new Date(payment.paymentDate).toLocaleDateString('it-IT')} • {payment.paymentMethod}
                                                            </p>
                                                            {payment.notes && (
                                                                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                                                                    {payment.notes}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <Euro size={20} color="var(--color-success)" />
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    ) : (
                                        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem', fontSize: '0.9rem' }}>
                                            Nessun pagamento registrato
                                        </p>
                                    )}
                                </section>
                            </>
                        ) : activeTab === 'ATTENDANCE' ? (
                            <>
                                {/* Attendance Content */}
                                {/* Summary */}
                                <section style={{
                                    padding: '1.5rem',
                                    background: 'linear-gradient(135deg, #FF6B35 0%, #F97316 100%)',
                                    borderRadius: 'var(--radius-lg)',
                                    color: 'white'
                                }}>
                                    <h3 style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '1rem' }}>
                                        Riepilogo Presenze
                                    </h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div>
                                            <p style={{ fontSize: '0.75rem', opacity: 0.8 }}>Giornate Presente</p>
                                            <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                                {attendances.filter(a => a.present).length}
                                            </p>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '0.75rem', opacity: 0.8 }}>Giornate Totali</p>
                                            <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                                {course?.totalLessons || (course?.totalHours ? Math.ceil(course.totalHours / 4) : '-')}
                                            </p>
                                        </div>
                                    </div>
                                    {/* Progress Bar */}
                                    <div style={{
                                        width: '100%',
                                        height: '8px',
                                        background: 'rgba(255,255,255,0.2)',
                                        borderRadius: '999px',
                                        marginTop: '1rem',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            width: `${course ? (attendances.filter(a => a.present).length / (course.totalLessons || Math.max(1, Math.ceil(course.totalHours / 4)))) * 100 : 0}% `,
                                            height: '100%',
                                            background: 'white',
                                            transition: 'width 0.3s'
                                        }} />
                                    </div>
                                </section>

                                {/* Add Attendance Button */}
                                {!showAttendanceForm ? (
                                    <button
                                        type="button"
                                        onClick={() => setShowAttendanceForm(true)}
                                        style={{
                                            padding: '0.875rem',
                                            borderRadius: 'var(--radius-md)',
                                            border: '2px dashed var(--color-border)',
                                            background: 'transparent',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem',
                                            fontWeight: '600',
                                            color: 'var(--color-primary)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem'
                                        }}
                                    >
                                        <Plus size={20} />
                                        Registra Presenza
                                    </button>
                                ) : (
                                    <div style={{
                                        padding: '1rem',
                                        background: 'var(--color-surface-hover)',
                                        borderRadius: 'var(--radius-md)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.75rem'
                                    }}>
                                        <h4 style={{ fontSize: '0.9rem', fontWeight: '600' }}>Nuova Presenza</h4>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                                                    Data
                                                </label>
                                                <input
                                                    type="date"
                                                    className={classes.searchInput}
                                                    value={newAttendance.date}
                                                    onChange={(e) => setNewAttendance({ ...newAttendance, date: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                                                    Ore
                                                </label>
                                                <input
                                                    type="number"
                                                    className={classes.searchInput}
                                                    value={newAttendance.hours}
                                                    onChange={(e) => setNewAttendance({ ...newAttendance, hours: parseFloat(e.target.value) })}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={newAttendance.present}
                                                    onChange={(e) => setNewAttendance({ ...newAttendance, present: e.target.checked })}
                                                />
                                                <span style={{ fontSize: '0.9rem' }}>Presente</span>
                                            </label>
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                                                Note
                                            </label>
                                            <input
                                                type="text"
                                                className={classes.searchInput}
                                                value={newAttendance.notes}
                                                onChange={(e) => setNewAttendance({ ...newAttendance, notes: e.target.value })}
                                                placeholder="es. Argomento trattato..."
                                            />
                                        </div>

                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                type="button"
                                                onClick={() => setShowAttendanceForm(false)}
                                                style={{
                                                    flex: 1,
                                                    padding: '0.5rem',
                                                    borderRadius: 'var(--radius-md)',
                                                    border: '1px solid var(--color-border)',
                                                    background: 'transparent',
                                                    cursor: 'pointer',
                                                    fontSize: '0.85rem'
                                                }}
                                            >
                                                Annulla
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleAddAttendance}
                                                style={{
                                                    flex: 1,
                                                    padding: '0.5rem',
                                                    borderRadius: 'var(--radius-md)',
                                                    border: 'none',
                                                    background: 'var(--color-success)',
                                                    color: 'white',
                                                    cursor: 'pointer',
                                                    fontSize: '0.85rem',
                                                    fontWeight: '600'
                                                }}
                                            >
                                                Salva
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Attendance List */}
                                <section>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Clock size={18} />
                                        Storico Presenze
                                    </h3>
                                    {attendances.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {attendances
                                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                                .map(attendance => (
                                                    <div
                                                        key={attendance.id}
                                                        style={{
                                                            padding: '0.75rem',
                                                            background: 'var(--color-surface-hover)',
                                                            borderRadius: 'var(--radius-md)',
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            borderLeft: attendance.present ? '4px solid #4ade80' : '4px solid #ff4444'
                                                        }}
                                                    >
                                                        <div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                                                <p style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                                                                    {new Date(attendance.date).toLocaleDateString('it-IT')}
                                                                </p>
                                                                <span style={{ fontSize: '0.75rem', padding: '0.1rem 0.5rem', borderRadius: '4px', background: 'rgba(0,0,0,0.1)' }}>
                                                                    {attendance.hours} ore
                                                                </span>
                                                            </div>
                                                            {attendance.notes && (
                                                                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                                                                    {attendance.notes}
                                                                </p>
                                                            )}
                                                        </div>
                                                        {attendance.present ? (
                                                            <CheckCircle size={20} color="#4ade80" />
                                                        ) : (
                                                            <XCircle size={20} color="#ff4444" />
                                                        )}
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    ) : (
                                        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem', fontSize: '0.9rem' }}>
                                            Nessuna presenza registrata
                                        </p>
                                    )}
                                </section>
                            </>
                        ) : (
                            <>
                                {/* Material Content */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Materiale Didattico</h3>
                                    <button
                                        type="button"
                                        onClick={() => setShowMaterialForm(true)}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            background: 'var(--color-primary)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: 'var(--radius-md)',
                                            fontSize: '0.85rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }}
                                    >
                                        <Plus size={16} /> Carica
                                    </button>
                                </div>

                                {showMaterialForm && (
                                    <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--color-surface-hover)', borderRadius: 'var(--radius-md)' }}>
                                        <h4 style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>Nuovo Materiale</h4>
                                        <div style={{ display: 'grid', gap: '1rem' }}>
                                            <input
                                                placeholder="Titolo Documento"
                                                value={newMaterial.title}
                                                onChange={e => setNewMaterial({ ...newMaterial, title: e.target.value })}
                                                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                                            />
                                            {newMaterial.type === 'LINK' ? (
                                                <input
                                                    placeholder="URL o Link al file"
                                                    value={newMaterial.url}
                                                    onChange={e => setNewMaterial({ ...newMaterial, url: e.target.value })}
                                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                                                />
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                    <input
                                                        type="file"
                                                        onChange={handleFileChange}
                                                        accept={newMaterial.type === 'PDF' ? '.pdf' : newMaterial.type === 'VIDEO' ? '.mp4,.mov' : '*/*'}
                                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'white' }}
                                                    />
                                                    {newMaterial.url && (
                                                        <p style={{ fontSize: '0.75rem', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                            <CheckCircle size={12} /> File caricato pronto per il salvataggio
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                                <div>
                                                    <label style={{ fontSize: '0.75rem' }}>Tipo</label>
                                                    <select
                                                        value={newMaterial.type}
                                                        onChange={e => setNewMaterial({ ...newMaterial, type: e.target.value as any })}
                                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                                                    >
                                                        <option value="PDF">PDF</option>
                                                        <option value="VIDEO">Video</option>
                                                        <option value="LINK">Link Esterno</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}>
                                                        <Lock size={12} /> Sblocca dopo (giorni presenza)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={newMaterial.unlockThresholdDays}
                                                        onChange={e => setNewMaterial({ ...newMaterial, unlockThresholdDays: parseInt(e.target.value) || 0 })}
                                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                                                    />
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                                <button onClick={() => setShowMaterialForm(false)} style={{ flex: 1, padding: '0.5rem', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: '4px' }}>Annulla</button>
                                                <button onClick={handleAddMaterial} style={{ flex: 1, padding: '0.5rem', background: 'var(--color-success)', color: 'white', border: 'none', borderRadius: '4px' }}>Salva</button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {materials.length === 0 ? (
                                        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>Nessun materiale caricato.</p>
                                    ) : materials.map(item => (
                                        <div key={item.id} style={{ padding: '0.75rem', background: 'var(--color-surface-hover)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{ padding: '0.5rem', background: 'var(--color-surface)', borderRadius: '8px', color: 'var(--color-text-primary)' }}>
                                                    {item.type === 'PDF' && <FileText size={20} />}
                                                    {item.type === 'VIDEO' && <Video size={20} />}
                                                    {item.type === 'LINK' && <LinkIcon size={20} />}
                                                </div>
                                                <div>
                                                    <p style={{ fontWeight: '500', fontSize: '0.9rem' }}>{item.title}</p>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                                        {item.unlockThresholdDays > 0 ? (
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--color-warning)' }}>
                                                                <Lock size={12} /> Sblocco a {item.unlockThresholdDays} gg
                                                            </span>
                                                        ) : (
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--color-success)' }}>
                                                                <Unlock size={12} /> Visibile subito
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteMaterial(item.id)}
                                                style={{ padding: '0.4rem', color: 'var(--color-error)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
