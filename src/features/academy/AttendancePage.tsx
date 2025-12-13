import { useState, useEffect } from 'react';
import { storage } from '../../lib/storage';
import { useAuth } from '../auth/AuthContext';
import { type Student, type Course, type Attendance } from '../../types';
import { Calendar, CheckCircle, XCircle } from 'lucide-react';
import classes from '../crm/ClientListPage.module.css';

export function AttendancePage() {
    const { user } = useAuth();
    const [student, setStudent] = useState<Student | null>(null);
    const [course, setCourse] = useState<Course | null>(null);
    const [attendances, setAttendances] = useState<Attendance[]>([]);

    useEffect(() => {
        const loadAttendanceData = async () => {
            if (user) {
                try {
                    const [students, courses, allAttendances] = await Promise.all([
                        storage.getStudents(),
                        storage.getCourses(),
                        storage.getAttendances()
                    ]);

                    const myStudent = students.find(s => s.email === user.email);

                    if (myStudent) {
                        setStudent(myStudent);

                        const myCourse = courses.find(c => c.id === myStudent.courseId);
                        setCourse(myCourse || null);

                        const myAttendances = allAttendances.filter(a => a.studentId === myStudent.id);
                        setAttendances(myAttendances);
                    }
                } catch (error) {
                    console.error("Failed to load attendance data:", error);
                }
            }
        };
        loadAttendanceData();
    }, [user]);

    if (!student || !course) {
        return (
            <div className={classes.container}>
                <div style={{
                    textAlign: 'center',
                    padding: '4rem 2rem',
                    background: 'var(--color-surface)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)'
                }}>
                    <Calendar size={64} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                        Nessun Corso Attivo
                    </h2>
                    <p style={{ color: 'var(--color-text-secondary)' }}>
                        Non sei ancora iscritto a nessun corso
                    </p>
                </div>
            </div>
        );
    }

    const totalDays = attendances.length;
    const presentDays = attendances.filter(a => a.present).length;
    const absentDays = totalDays - presentDays;
    const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

    return (
        <div className={classes.container}>
            <div className={classes.header}>
                <h1 className={classes.title} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={32} />
                    Calendario Presenze
                </h1>
            </div>

            {/* Stats Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
            }}>
                <div style={{
                    background: 'var(--color-surface)',
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)'
                }}>
                    <h3 style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                        Giorni Totali
                    </h3>
                    <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                        {totalDays}
                    </p>
                </div>

                <div style={{
                    background: 'var(--color-surface)',
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)'
                }}>
                    <h3 style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CheckCircle size={16} color="var(--color-success)" />
                        Presenze
                    </h3>
                    <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-success)' }}>
                        {presentDays}
                    </p>
                </div>

                <div style={{
                    background: 'var(--color-surface)',
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)'
                }}>
                    <h3 style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <XCircle size={16} color="var(--color-error)" />
                        Assenze
                    </h3>
                    <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-error)' }}>
                        {absentDays}
                    </p>
                </div>

                <div style={{
                    background: 'var(--color-surface)',
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)'
                }}>
                    <h3 style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                        Tasso di Presenza
                    </h3>
                    <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: attendanceRate >= 80 ? 'var(--color-success)' : '#FFD700' }}>
                        {attendanceRate.toFixed(0)}%
                    </p>
                </div>
            </div>

            {/* Progress to Goal */}
            <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '2rem',
                borderRadius: 'var(--radius-lg)',
                color: 'white',
                marginBottom: '2rem'
            }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', opacity: 0.9 }}>
                    Progresso Corso
                </h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                        {presentDays} giorni completati
                    </span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', opacity: 0.8 }}>
                        Obiettivo: {course.totalLessons || Math.ceil(course.totalHours / 4)} giorni
                    </span>
                </div>
                <div style={{
                    width: '100%',
                    height: '12px',
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '999px',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        width: `${Math.min(100, (presentDays / (course.totalLessons || Math.max(1, Math.ceil(course.totalHours / 4)))) * 100)}%`,
                        height: '100%',
                        background: '#4ade80',
                        transition: 'width 0.3s'
                    }} />
                </div>
            </div>

            {/* Attendance Table */}
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
                                        <td>
                                            <strong>{new Date(attendance.date).toLocaleDateString('it-IT', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}</strong>
                                        </td>
                                        <td>{attendance.hours}h</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                {attendance.present ? (
                                                    <>
                                                        <CheckCircle size={24} color="var(--color-success)" />
                                                        <span style={{ color: 'var(--color-success)', fontWeight: '600' }}>Presente</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <XCircle size={24} color="var(--color-error)" />
                                                        <span style={{ color: 'var(--color-error)', fontWeight: '600' }}>Assente</span>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ color: 'var(--color-text-secondary)' }}>
                                            {attendance.notes || '-'}
                                        </td>
                                    </tr>
                                ))
                        ) : (
                            <tr>
                                <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                                    <Calendar size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                                    <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                                        Nessuna presenza registrata ancora
                                    </p>
                                    <p style={{ fontSize: '0.9rem' }}>
                                        Le tue presenze appariranno qui quando il manager le registrerà
                                    </p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
