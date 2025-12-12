import { useState, useEffect } from 'react';
import { storage } from '../../lib/storage';
import { useAuth } from '../auth/AuthContext';
import { type Course, type Student, type Attendance, type CoursePayment } from '../../types';
import { Calendar, BookOpen, FileText, Euro, CheckCircle, XCircle, Download } from 'lucide-react';
import classes from '../crm/ClientListPage.module.css';

export function StudentDashboard() {
    const { user } = useAuth();
    const [student, setStudent] = useState<Student | null>(null);
    const [course, setCourse] = useState<Course | null>(null);
    const [attendances, setAttendances] = useState<Attendance[]>([]);
    const [payments, setPayments] = useState<CoursePayment[]>([]);

    useEffect(() => {
        if (user) {
            // Find student record for this user
            const students = storage.getStudents();
            const myStudent = students.find(s => s.email === user.email);

            if (myStudent) {
                setStudent(myStudent);

                // Load course details
                const courses = storage.getCourses();
                const myCourse = courses.find(c => c.id === myStudent.courseId);
                setCourse(myCourse || null);

                // Load attendances
                const allAttendances = storage.getAttendances();
                const myAttendances = allAttendances.filter(a => a.studentId === myStudent.id);
                setAttendances(myAttendances);

                // Load payments
                const allPayments = storage.getCoursePayments();
                const myPayments = allPayments.filter(p => p.studentId === myStudent.id);
                setPayments(myPayments);
            }
        }
    }, [user]);

    if (!student) {
        return (
            <div className={classes.container}>
                <div style={{
                    textAlign: 'center',
                    padding: '4rem 2rem',
                    background: 'var(--color-surface)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)'
                }}>
                    <BookOpen size={64} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                        Nessun Corso Attivo
                    </h2>
                    <p style={{ color: 'var(--color-text-secondary)' }}>
                        Non sei ancora iscritto a nessun corso. Contatta l'academy per iscriverti!
                    </p>
                </div>
            </div>
        );
    }

    const daysAttended = attendances.filter(a => a.present).length;

    const attendanceRate = attendances.length > 0
        ? (attendances.filter(a => a.present).length / attendances.length) * 100
        : 0;

    const remainingBalance = course ? course.price - student.totalPaid : 0;

    return (
        <div className={classes.container}>
            {/* Header */}
            <div className={classes.header}>
                <div>
                    <h1 className={classes.title} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <BookOpen size={32} />
                        Il Mio Corso
                    </h1>
                    {course && (
                        <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
                            {course.name}
                        </p>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
            }}>
                <div style={{
                    background: 'var(--color-surface)',
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)'
                }}>
                    <h3 style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={16} />
                        Giornate Frequentate
                    </h3>
                    <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                        {daysAttended}
                        {course && <span style={{ fontSize: '1rem', color: 'var(--color-text-muted)' }}> / {course.totalLessons || Math.ceil(course.totalHours / 4)} gg</span>}
                    </p>
                </div>

                <div style={{
                    background: 'var(--color-surface)',
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)'
                }}>
                    <h3 style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CheckCircle size={16} />
                        Tasso di Presenza
                    </h3>
                    <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: attendanceRate >= 80 ? 'var(--color-success)' : '#FFD700' }}>
                        {attendanceRate.toFixed(0)}%
                    </p>
                </div>

                <div style={{
                    background: 'var(--color-surface)',
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)'
                }}>
                    <h3 style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Euro size={16} />
                        Da Pagare
                    </h3>
                    <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: remainingBalance > 0 ? '#FFD700' : 'var(--color-success)' }}>
                        €{remainingBalance.toLocaleString()}
                    </p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* Course Details */}
                <div style={{
                    background: 'var(--color-surface)',
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)'
                }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <BookOpen size={20} />
                        Dettagli Corso
                    </h2>
                    {course ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div>
                                <label style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                                    Periodo
                                </label>
                                <p style={{ fontSize: '0.95rem' }}>
                                    {new Date(course.startDate).toLocaleDateString('it-IT')} - {new Date(course.endDate).toLocaleDateString('it-IT')}
                                </p>
                            </div>
                            {course.schedule && (
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                                        Orario
                                    </label>
                                    <p style={{ fontSize: '0.95rem' }}>{course.schedule}</p>
                                </div>
                            )}
                            <div>
                                <label style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                                    Durata Totale
                                </label>
                                <p style={{ fontSize: '0.95rem' }}>{course.totalHours} ore</p>
                            </div>
                            {course.description && (
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                                        Descrizione
                                    </label>
                                    <p style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>{course.description}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p style={{ color: 'var(--color-text-muted)' }}>Nessun corso trovato</p>
                    )}
                </div>

                {/* Program */}
                <div style={{
                    background: 'var(--color-surface)',
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)'
                }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={20} />
                        Programma
                    </h2>
                    {course?.program ? (
                        <div style={{ fontSize: '0.95rem', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>
                            {course.program}
                        </div>
                    ) : (
                        <p style={{ color: 'var(--color-text-muted)' }}>Programma non ancora disponibile</p>
                    )}
                </div>
            </div>

            {/* Attendance History */}
            <div style={{ marginTop: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={20} />
                    Registro Presenze
                </h2>
                <div className={classes.tableWrapper}>
                    <table className={classes.table}>
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Ore</th>
                                <th>Presenza</th>
                                <th>Note</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attendances.length > 0 ? (
                                attendances
                                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                    .map(attendance => (
                                        <tr key={attendance.id} className={classes.row}>
                                            <td>{new Date(attendance.date).toLocaleDateString('it-IT')}</td>
                                            <td>{attendance.hours}h</td>
                                            <td>
                                                {attendance.present ? (
                                                    <CheckCircle size={20} color="var(--color-success)" />
                                                ) : (
                                                    <XCircle size={20} color="var(--color-error)" />
                                                )}
                                            </td>
                                            <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                                                {attendance.notes || '-'}
                                            </td>
                                        </tr>
                                    ))
                            ) : (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                                        Nessuna presenza registrata ancora
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payments History */}
            <div style={{ marginTop: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Euro size={20} />
                    Storico Pagamenti
                </h2>
                <div className={classes.tableWrapper}>
                    <table className={classes.table}>
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Importo</th>
                                <th>Metodo</th>
                                <th>Note</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.length > 0 ? (
                                payments
                                    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
                                    .map(payment => (
                                        <tr key={payment.id} className={classes.row}>
                                            <td>{new Date(payment.paymentDate).toLocaleDateString('it-IT')}</td>
                                            <td>
                                                <strong style={{ color: 'var(--color-success)' }}>
                                                    €{payment.amount.toLocaleString()}
                                                </strong>
                                            </td>
                                            <td>{payment.paymentMethod || '-'}</td>
                                            <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                                                {payment.notes || '-'}
                                            </td>
                                        </tr>
                                    ))
                            ) : (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                                        Nessun pagamento registrato
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Course Materials */}
            {course?.attachments && course.attachments.length > 0 && (
                <div style={{ marginTop: '2rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Download size={20} />
                        Materiale Didattico
                    </h2>
                    <div style={{
                        background: 'var(--color-surface)',
                        padding: '1.5rem',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--color-border)'
                    }}>
                        <p style={{ color: 'var(--color-text-secondary)' }}>
                            {course.attachments.length} file disponibili per il download
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
