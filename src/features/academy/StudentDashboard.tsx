import { useState, useEffect } from 'react';
import { storage } from '../../lib/storage';
import { useAuth } from '../auth/AuthContext';
import { type Course, type Student, type Attendance, type CoursePayment, type TeachingMaterial } from '../../types';
import { Calendar, BookOpen, FileText, Euro, CheckCircle, XCircle, Download, Lock, Video, Link as LinkIcon, File } from 'lucide-react';
import classes from '../crm/ClientListPage.module.css';

export function StudentDashboard() {
    const { user } = useAuth();
    const [student, setStudent] = useState<Student | null>(null);
    const [course, setCourse] = useState<Course | null>(null);
    const [attendances, setAttendances] = useState<Attendance[]>([]);
    const [payments, setPayments] = useState<CoursePayment[]>([]);
    const [materials, setMaterials] = useState<TeachingMaterial[]>([]);

    useEffect(() => {
        const loadStudentData = async () => {
            if (user) {
                try {
                    // Find student record for this user
                    const students = await storage.getStudents();
                    const myStudent = students.find(s => s.email === user.email);

                    if (myStudent) {
                        setStudent(myStudent);

                        // Load details in parallel
                        const [courses, allAttendances, allPayments] = await Promise.all([
                            storage.getCourses(),
                            storage.getAttendances(),
                            storage.getCoursePayments()
                        ]);

                        const myCourse = courses.find(c => c.id === myStudent.courseId);
                        setCourse(myCourse || null);

                        const myAttendances = allAttendances.filter(a => a.studentId === myStudent.id);
                        setAttendances(myAttendances);

                        const myPayments = allPayments.filter(p => p.studentId === myStudent.id);
                        setPayments(myPayments);

                        // Load Materials (both personal and course-wide)
                        const allMaterials = await storage.getMaterials(myStudent.tenantId);
                        const myMaterials = allMaterials.filter(m =>
                            (m.studentId === myStudent.id) ||
                            (!m.studentId && m.courseId === myStudent.courseId)
                        );
                        setMaterials(myMaterials);
                    }
                } catch (error) {
                    console.error("Error loading student dashboard:", error);
                }
            }
        };

        loadStudentData();
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

    const getMaterialIcon = (type: TeachingMaterial['type']) => {
        switch (type) {
            case 'PDF': return <FileText size={20} />;
            case 'VIDEO': return <Video size={20} />;
            case 'LINK': return <LinkIcon size={20} />;
            default: return <File size={20} />;
        }
    };

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
            <div style={{ marginTop: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Download size={20} />
                    Materiale Didattico
                </h2>

                {materials.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{
                            background: 'var(--color-surface)',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--color-border)',
                            overflow: 'hidden'
                        }}>
                            {materials.map((material, index) => {
                                const threshold = material.unlockThresholdDays || 0;
                                const isUnlocked = daysAttended >= threshold;

                                return (
                                    <div
                                        key={material.id}
                                        style={{
                                            padding: '1rem',
                                            borderBottom: index < materials.length - 1 ? '1px solid var(--color-border)' : 'none',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            opacity: isUnlocked ? 1 : 0.7,
                                            background: isUnlocked ? 'transparent' : 'rgba(0,0,0,0.02)'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{
                                                padding: '0.75rem',
                                                background: isUnlocked ? 'var(--color-surface-hover)' : 'var(--color-border)',
                                                borderRadius: '50%',
                                                color: isUnlocked ? 'var(--color-primary)' : 'var(--color-text-muted)'
                                            }}>
                                                {getMaterialIcon(material.type)}
                                            </div>
                                            <div>
                                                <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', color: isUnlocked ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
                                                    {material.title}
                                                </h4>
                                                {material.description && (
                                                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                                        {material.description}
                                                    </p>
                                                )}
                                                {!isUnlocked && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--color-error)' }}>
                                                        <Lock size={12} />
                                                        <span>Sblocco al raggiungimento della {threshold}° lezione (Attuali: {daysAttended})</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {isUnlocked ? (
                                            <a
                                                href={material.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    padding: '0.5rem 1rem',
                                                    background: 'var(--color-primary)',
                                                    color: 'white',
                                                    borderRadius: 'var(--radius-md)',
                                                    textDecoration: 'none',
                                                    fontSize: '0.9rem',
                                                    fontWeight: '600',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <Download size={16} />
                                                Apri
                                            </a>
                                        ) : (
                                            <div style={{ padding: '0.5rem' }}>
                                                <Lock size={20} color="var(--color-text-muted)" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div style={{
                        background: 'var(--color-surface)',
                        padding: '2rem',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--color-border)',
                        textAlign: 'center',
                        color: 'var(--color-text-muted)'
                    }}>
                        Nessun materiale didattico disponibile.
                    </div>
                )}
            </div>
        </div>
    );
}
