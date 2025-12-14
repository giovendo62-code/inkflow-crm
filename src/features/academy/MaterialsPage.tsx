import { useState, useEffect } from 'react';
import { storage } from '../../lib/storage';
import { useAuth } from '../auth/AuthContext';
import { type Student, type Course, type TeachingMaterial } from '../../types';
import { FileText, BookOpen, Download, Lock, Unlock, Video, Link as LinkIcon, CheckCircle } from 'lucide-react';
import classes from '../crm/ClientListPage.module.css';

export function MaterialsPage() {
    const { user } = useAuth();
    const [student, setStudent] = useState<Student | null>(null);
    const [course, setCourse] = useState<Course | null>(null);
    const [materials, setMaterials] = useState<TeachingMaterial[]>([]);
    const [daysPresent, setDaysPresent] = useState(0);

    useEffect(() => {
        const loadMaterialData = async () => {
            if (user?.tenantId) {
                try {
                    const students = await storage.getStudents(user.tenantId);
                    const myStudent = students.find(s => s.email === user.email);

                    if (myStudent) {
                        setStudent(myStudent);

                        const [courses, attendances, allMaterials] = await Promise.all([
                            storage.getCourses(user.tenantId),
                            storage.getAttendances(user.tenantId),
                            storage.getMaterials(user.tenantId)
                        ]);

                        // Course
                        const myCourse = courses.find(c => c.id === myStudent.courseId);
                        setCourse(myCourse || null);

                        // Attendances for unlock logic
                        const presentCount = attendances.filter(a => a.studentId === myStudent.id && a.present).length;
                        setDaysPresent(presentCount);

                        // Materials (Personal + Course Global)
                        const myMaterials = allMaterials.filter(m =>
                            m.studentId === myStudent.id ||
                            (!m.studentId && m.courseId === myStudent.courseId)
                        );
                        setMaterials(myMaterials);
                    }
                } catch (error) {
                    console.error("Failed to load materials page data:", error);
                }
            }
        };
        loadMaterialData();
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
                    <FileText size={64} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
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

    return (
        <div className={classes.container}>
            <div className={classes.header}>
                <h1 className={classes.title} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={32} />
                    I Miei Materiali
                </h1>
            </div>

            {/* Course Info Card */}
            <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '2rem',
                borderRadius: 'var(--radius-lg)',
                color: 'white',
                marginBottom: '2rem'
            }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                    {course.name}
                </h2>
                {course.description && (
                    <p style={{ fontSize: '1rem', opacity: 0.9, marginBottom: '1rem' }}>
                        {course.description}
                    </p>
                )}
                <div style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem', opacity: 0.9 }}>
                    <div>
                        📅 {new Date(course.startDate).toLocaleDateString('it-IT')} - {new Date(course.endDate).toLocaleDateString('it-IT')}
                    </div>
                    {course.schedule && (
                        <div>
                            🕐 {course.schedule}
                        </div>
                    )}
                    <div>
                        ⏱️ {course.totalHours} ore totali
                    </div>
                </div>
            </div>

            {/* Unlockable Materials Section */}
            <div style={{
                marginBottom: '2rem'
            }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <BookOpen size={24} /> Materiali Didattici
                </h2>

                {materials.length === 0 ? (
                    <div style={{ padding: '2rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', textAlign: 'center', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
                        Nessun materiale assegnato.
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {materials.map(mat => {
                            const isUnlocked = daysPresent >= mat.unlockThresholdDays;
                            const daysMissing = mat.unlockThresholdDays - daysPresent;

                            return (
                                <div key={mat.id} style={{
                                    padding: '1.5rem',
                                    background: 'var(--color-surface)',
                                    borderRadius: 'var(--radius-lg)',
                                    border: '1px solid var(--color-border)',
                                    opacity: isUnlocked ? 1 : 0.7,
                                    display: 'flex',
                                    gap: '1.5rem',
                                    alignItems: 'center',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    {!isUnlocked && (
                                        <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '4px',
                                            height: '100%',
                                            background: 'var(--color-text-muted)'
                                        }} />
                                    )}
                                    {isUnlocked && (
                                        <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '4px',
                                            height: '100%',
                                            background: 'var(--color-success)'
                                        }} />
                                    )}

                                    <div style={{
                                        width: '50px',
                                        height: '50px',
                                        borderRadius: '12px',
                                        background: isUnlocked ? 'var(--color-bg-secondary)' : '#f3f4f6',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: isUnlocked ? 'var(--color-primary)' : 'var(--color-text-muted)'
                                    }}>
                                        {mat.type === 'PDF' && <FileText size={24} />}
                                        {mat.type === 'VIDEO' && <Video size={24} />}
                                        {mat.type === 'LINK' && <LinkIcon size={24} />}
                                    </div>

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <h3 style={{
                                            fontSize: '1.1rem',
                                            fontWeight: '600',
                                            marginBottom: '0.25rem',
                                            color: isUnlocked ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                        }}>
                                            {mat.title}
                                        </h3>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                            {isUnlocked ? (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-success)' }}>
                                                    <Unlock size={14} /> Disponibile
                                                </span>
                                            ) : (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <Lock size={14} /> Sbloccato tra {daysMissing} giorni di presenza
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {isUnlocked ? (
                                        <a
                                            href={mat.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            style={{
                                                padding: '0.75rem 1.5rem',
                                                background: 'var(--color-primary)',
                                                color: 'white',
                                                borderRadius: 'var(--radius-md)',
                                                textDecoration: 'none',
                                                fontSize: '0.9rem',
                                                fontWeight: '500',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem'
                                            }}
                                        >
                                            Apri <p style={{ fontSize: '1.2rem', margin: 0 }}>→</p>
                                        </a>
                                    ) : (
                                        <div style={{
                                            padding: '0.75rem 1.5rem',
                                            background: '#f3f4f6',
                                            color: '#9ca3af',
                                            borderRadius: 'var(--radius-md)',
                                            fontSize: '0.9rem',
                                            fontWeight: '500',
                                            cursor: 'not-allowed',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }}>
                                            Bloccato <Lock size={16} />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Program */}
            <div style={{
                background: 'var(--color-surface)',
                padding: '2rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                marginBottom: '2rem'
            }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <BookOpen size={24} />
                    Programma del Corso
                </h3>
                {course.program ? (
                    <div style={{
                        fontSize: '1rem',
                        lineHeight: '1.8',
                        whiteSpace: 'pre-wrap',
                        color: 'var(--color-text-primary)'
                    }}>
                        {course.program}
                    </div>
                ) : (
                    <div style={{
                        textAlign: 'center',
                        padding: '3rem',
                        color: 'var(--color-text-muted)'
                    }}>
                        <BookOpen size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                        <p>Il programma del corso non è ancora disponibile</p>
                        <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                            Contatta il manager per maggiori informazioni
                        </p>
                    </div>
                )}
            </div>

            {/* Materials */}
            <div style={{
                background: 'var(--color-surface)',
                padding: '2rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)'
            }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Download size={24} />
                    Materiale Didattico
                </h3>
                {course.attachments && course.attachments.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                        {course.attachments.map((attachment, index) => (
                            <div
                                key={index}
                                style={{
                                    padding: '1.5rem',
                                    background: 'var(--color-surface-hover)',
                                    borderRadius: 'var(--radius-md)',
                                    border: '2px solid var(--color-border)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '1rem'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--color-border)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                <FileText size={48} color="var(--color-primary)" />
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                                        Materiale {index + 1}
                                    </p>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                        Clicca per visualizzare
                                    </p>
                                </div>
                                <button
                                    style={{
                                        padding: '0.5rem 1rem',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--color-primary)',
                                        background: 'var(--color-primary)',
                                        color: 'white',
                                        cursor: 'pointer',
                                        fontSize: '0.85rem',
                                        fontWeight: '600',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    <Download size={16} />
                                    Scarica
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{
                        textAlign: 'center',
                        padding: '3rem',
                        color: 'var(--color-text-muted)'
                    }}>
                        <Download size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                        <p>Nessun materiale didattico disponibile al momento</p>
                        <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                            I materiali saranno caricati dal manager durante il corso
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
