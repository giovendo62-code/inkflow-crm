import { useState, useEffect, useCallback } from 'react';
import { storage } from '../../lib/storage';
import { type Course, type Student, type TeachingMaterial } from '../../types';
import { GraduationCap, Plus, Users, Euro, BookOpen, Trash2, Pencil, Eye, EyeOff, Download } from 'lucide-react';
import classes from '../crm/ClientListPage.module.css';
import { AddCourseModal } from './AddCourseModal';
import { AddStudentModal } from './AddStudentModal';
import { StudentDetailsModal } from './StudentDetailsModal';
import { TeachingMaterialsSection } from './TeachingMaterialsSection';
import { useAuth } from '../auth/AuthContext';
import { usePrivacy } from '../context/PrivacyContext';

export function AcademyPage() {
    const { user } = useAuth();
    const { showFinancials, toggleFinancials } = usePrivacy();
    const [courses, setCourses] = useState<Course[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [materials, setMaterials] = useState<TeachingMaterial[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<string | 'all'>('all');

    // Modals
    const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
    const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);

    const [attendances, setAttendances] = useState<any[]>([]);
    const [onlyActive, setOnlyActive] = useState(true);

    const handleEditCourse = (course: Course, event: React.MouseEvent) => {
        event.stopPropagation();
        setEditingCourse(course);
        setIsCourseModalOpen(true);
    };

    const loadData = useCallback(async () => {
        if (!user?.tenantId) return;
        try {
            const [allCourses, allStudents, allAttendances, allMaterials] = await Promise.all([
                storage.getCourses(user.tenantId),
                storage.getStudents(user.tenantId),
                storage.getAttendances(user.tenantId),
                storage.getMaterials(user.tenantId)
            ]);
            setCourses(allCourses);
            setStudents(allStudents);
            setAttendances(allAttendances);
            setMaterials(allMaterials);
        } catch (error: any) {
            console.error("Failed to load academy data:", error);
        }
    }, [user?.tenantId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const filteredStudents = students
        .filter(s => selectedCourse === 'all' || s.courseId === selectedCourse)
        .filter(s => !onlyActive || s.status === 'ACTIVE');

    const getStudentCount = (courseId: string) => {
        return students.filter(s => s.courseId === courseId).length;
    };

    const getCourseName = (courseId: string) => {
        const course = courses.find(c => c.id === courseId);
        return course?.name || 'Corso sconosciuto';
    };

    const getStudentProgress = (studentId: string, courseId: string) => {
        const course = courses.find(c => c.id === courseId);
        if (!course) return { percent: 0, label: 'N/A' };

        const totalLessons = course.totalLessons || Math.max(1, Math.ceil(course.totalHours / 4));
        const studentAttendances = attendances.filter(a => a.studentId === studentId && a.present).length;

        const percent = Math.min(100, Math.round((studentAttendances / totalLessons) * 100));
        return { percent, label: `${studentAttendances}/${totalLessons} gg` };
    };

    const handleViewStudent = (student: Student) => {
        setSelectedStudent(student);
        setIsDetailsModalOpen(true);
    };

    const handleSaveStudent = async (updatedStudent: Student) => {
        try {
            await storage.saveStudent(updatedStudent);
            loadData();
        } catch (error) {
            console.error("Failed to save student:", error);
            alert("Errore salvataggio studente");
        }
    };

    const handleDeleteCourse = async (courseId: string, event: React.MouseEvent) => {
        event.stopPropagation();
        if (!window.confirm('Sei sicuro di voler eliminare questo corso? Gli studenti rimarranno ma saranno scollegati.')) return;

        try {
            await storage.deleteCourse(courseId);
            loadData();
        } catch (error) {
            console.error("Error deleting course:", error);
            alert("Impossibile eliminare il corso.");
        }
    };

    return (
        <div className={classes.container}>
            <div className={classes.header}>
                <h1 className={classes.title} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <GraduationCap size={32} />
                    Academy
                </h1>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
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
                            marginRight: '0.5rem',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                        }}
                        title={showFinancials ? "Nascondi importi" : "Mostra importi"}
                    >
                        {showFinancials ? <Eye size={24} /> : <EyeOff size={24} />}
                    </button>
                    <button
                        className={classes.addBtn}
                        style={{ background: 'rgba(66, 133, 244, 0.2)', border: '1px solid #4285F4' }}
                        onClick={() => setIsCourseModalOpen(true)}
                    >
                        <Plus size={20} />
                        <span>Nuovo Corso</span>
                    </button>
                    <button
                        className={classes.addBtn}
                        onClick={() => setIsStudentModalOpen(true)}
                    >
                        <Plus size={20} />
                        <span>Aggiungi Corsista</span>
                    </button>
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
                        <BookOpen size={16} />
                        Corsi Attivi
                    </h3>
                    <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                        {courses.filter(c => c.status === 'ACTIVE').length}
                    </p>
                </div>

                <div style={{
                    background: 'var(--color-surface)',
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)'
                }}>
                    <h3 style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Users size={16} />
                        Corsisti Totali
                    </h3>
                    <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-success)' }}>
                        {students.filter(s => s.status === 'ACTIVE').length}
                    </p>
                </div>

                <div className={classes.desktopOnly} style={{
                    background: 'var(--color-surface)',
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)'
                }}>
                    <h3 style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Euro size={16} />
                        Incassi Totali
                    </h3>
                    <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#FFD700' }}>
                        {showFinancials ? `€${students.reduce((sum, s) => sum + s.totalPaid, 0).toLocaleString()}` : '••••'}
                    </p>
                </div>
            </div>

            {/* Courses List */}
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <BookOpen size={20} />
                    Corsi
                </h2>

                {courses.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '3rem',
                        background: 'var(--color-surface)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--color-border)'
                    }}>
                        <GraduationCap size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                        <p style={{ fontSize: '1.1rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                            Nessun corso ancora creato
                        </p>
                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                            Clicca su "Nuovo Corso" per iniziare
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1rem' }}>
                        {courses.map(course => (
                            <div
                                key={course.id}
                                style={{
                                    background: 'var(--color-surface)',
                                    padding: '1.5rem',
                                    borderRadius: 'var(--radius-lg)',
                                    border: '2px solid var(--color-border)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>{course.name}</h3>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '999px',
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            background: course.status === 'ACTIVE' ? 'rgba(0, 204, 102, 0.2)' :
                                                course.status === 'COMPLETED' ? 'rgba(66, 133, 244, 0.2)' :
                                                    'rgba(255, 107, 53, 0.2)',
                                            color: course.status === 'ACTIVE' ? '#00CC66' :
                                                course.status === 'COMPLETED' ? '#4285F4' :
                                                    '#FF6B35'
                                        }}>
                                            {course.status}
                                        </span>
                                        <button
                                            onClick={(e) => handleEditCourse(course, e)}
                                            style={{
                                                background: 'var(--color-surface-hover)',
                                                border: '1px solid var(--color-border)',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                color: 'var(--color-text-secondary)',
                                                padding: '4px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                width: '28px',
                                                height: '28px'
                                            }}
                                            title="Modifica corso"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <button
                                            onClick={(e) => handleDeleteCourse(course.id, e)}
                                            style={{
                                                background: 'var(--color-surface-hover)',
                                                border: '1px solid var(--color-border)',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                color: '#ff4444',
                                                padding: '4px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                width: '28px',
                                                height: '28px'
                                            }}
                                            title="Elimina corso"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                {course.description && (
                                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                                        {course.description}
                                    </p>
                                )}

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <BookOpen size={14} />
                                        {course.totalLessons || 0} lezioni previste
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Users size={14} />
                                        {getStudentCount(course.id)} corsisti
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Euro size={14} />
                                        <Euro size={14} />
                                        {showFinancials ? course.price?.toLocaleString() : '••••'}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Download size={14} />
                                        {materials.filter(m => m.courseId === course.id).length} materiali
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Teaching Materials Section */}
            <TeachingMaterialsSection
                courses={courses}
                materials={materials}
                onUpdate={loadData}
            />

            {/* Students Filter */}
            <div style={{ marginBottom: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'flex-end' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>
                        Filtra Corsisti per Corso
                    </label>
                    <select
                        className={classes.searchInput}
                        value={selectedCourse}
                        onChange={(e) => setSelectedCourse(e.target.value)}
                        style={{ maxWidth: '300px' }}
                    >
                        <option value="all">Tutti i corsi</option>
                        {courses.map(course => (
                            <option key={course.id} value={course.id}>{course.name}</option>
                        ))}
                    </select>
                </div>

                <div style={{ marginBottom: '5px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none' }}>
                        <input
                            type="checkbox"
                            checked={onlyActive}
                            onChange={(e) => setOnlyActive(e.target.checked)}
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '1rem' }}>Mostra solo Attivi</span>
                    </label>
                </div>
            </div>

            {/* Students List - Responsive */}
            <div className={classes.desktopOnly}>
                <div className={classes.tableWrapper}>
                    <table className={classes.table}>
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Corso</th>
                                <th>Progresso</th>
                                <th>Iscrizione</th>
                                <th>Pagato</th>
                                <th>Stato</th>
                                <th>Azioni</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.length > 0 ? (
                                filteredStudents.map(student => {
                                    const progress = getStudentProgress(student.id, student.courseId);
                                    return (
                                        <tr key={student.id} className={classes.row}>
                                            <td>
                                                <strong>{student.firstName} {student.lastName}</strong>
                                            </td>
                                            <td style={{ fontSize: '0.9rem' }}>{getCourseName(student.courseId)}</td>
                                            <td style={{ width: '150px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                                                    <span>{progress.percent}%</span>
                                                    <span style={{ color: 'var(--color-text-muted)' }}>{progress.label}</span>
                                                </div>
                                                <div style={{ width: '100%', height: '6px', background: 'var(--color-border)', borderRadius: '999px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${progress.percent}%`, height: '100%', background: 'var(--color-primary)' }} />
                                                </div>
                                            </td>
                                            <td style={{ fontSize: '0.9rem' }}>{new Date(student.enrollmentDate).toLocaleDateString('it-IT')}</td>
                                            <td>
                                                <strong style={{ color: 'var(--color-success)' }}>
                                                    {showFinancials ? `€${student.totalPaid.toLocaleString()}` : '••••'}
                                                </strong>
                                            </td>
                                            <td>
                                                <span style={{
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '999px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '600',
                                                    background: student.status === 'ACTIVE' ? 'rgba(0, 204, 102, 0.2)' :
                                                        student.status === 'COMPLETED' ? 'rgba(66, 133, 244, 0.2)' :
                                                            'rgba(255, 68, 68, 0.2)',
                                                    color: student.status === 'ACTIVE' ? '#00CC66' :
                                                        student.status === 'COMPLETED' ? '#4285F4' :
                                                            '#ff4444'
                                                }}>
                                                    {student.status}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    className={classes.actionBtn}
                                                    onClick={() => handleViewStudent(student)}
                                                >
                                                    Gestisci
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })
                            ) : (
                                <tr>
                                    <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                                        {courses.length === 0
                                            ? 'Crea un corso per aggiungere corsisti'
                                            : 'Nessun corsista trovato.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile View - Cards */}
            <div className={classes.mobileOnly} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredStudents.length > 0 ? (
                    filteredStudents.map(student => {
                        const progress = getStudentProgress(student.id, student.courseId);
                        return (
                            <div key={student.id} style={{
                                background: 'var(--color-surface)',
                                padding: '1rem',
                                borderRadius: 'var(--radius-lg)',
                                border: '1px solid var(--color-border)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.75rem'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>{student.firstName} {student.lastName}</h3>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{getCourseName(student.courseId)}</p>
                                    </div>
                                    <span style={{
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '999px',
                                        fontSize: '0.7rem',
                                        fontWeight: '600',
                                        background: student.status === 'ACTIVE' ? 'rgba(0, 204, 102, 0.2)' : 'rgba(255, 68, 68, 0.2)',
                                        color: student.status === 'ACTIVE' ? '#00CC66' : '#ff4444'
                                    }}>
                                        {student.status}
                                    </span>
                                </div>

                                <div style={{ fontSize: '0.85rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <span>Progresso</span>
                                        <span>{progress.percent}%</span>
                                    </div>
                                    <div style={{ width: '100%', height: '4px', background: 'var(--color-border)', borderRadius: '999px', overflow: 'hidden' }}>
                                        <div style={{ width: `${progress.percent}%`, height: '100%', background: 'var(--color-primary)' }} />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                                    <span style={{ color: 'var(--color-text-muted)' }}>Pagato: <strong style={{ color: 'var(--color-success)' }}>{showFinancials ? `€${student.totalPaid.toLocaleString()}` : '••••'}</strong></span>
                                    <button
                                        className={classes.actionBtn}
                                        onClick={() => handleViewStudent(student)}
                                        style={{ padding: '0.5rem', background: 'var(--color-primary)', color: 'white', borderRadius: 'var(--radius-md)', textDecoration: 'none' }}
                                    >
                                        Gestisci
                                    </button>
                                </div>
                            </div>
                        )
                    })
                ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                        Nessun corsista trovato
                    </div>
                )}
            </div>

            {/* Mobile Total Earnings - Bottom */}
            <div className={classes.mobileOnly} style={{ marginTop: '2rem', marginBottom: '2rem' }}>
                <div style={{
                    background: 'var(--color-surface)',
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)',
                    textAlign: 'center'
                }}>
                    <h3 style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <Euro size={20} />
                        Incassi Totali Academy
                    </h3>
                    <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#FFD700' }}>
                        {showFinancials ? `€${students.reduce((sum, s) => sum + s.totalPaid, 0).toLocaleString()}` : '••••'}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                        {courses.filter(c => c.status === 'ACTIVE').length} corsi attivi
                    </p>
                </div>
            </div>

            {/* Modals */}
            <AddCourseModal
                isOpen={isCourseModalOpen}
                onClose={() => {
                    setIsCourseModalOpen(false);
                    setEditingCourse(null);
                }}
                onSuccess={loadData}
                courseToEdit={editingCourse}
            />

            <AddStudentModal
                isOpen={isStudentModalOpen}
                onClose={() => setIsStudentModalOpen(false)}
                onSuccess={loadData}
                courses={courses}
            />

            <StudentDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                student={selectedStudent}
                course={selectedStudent ? courses.find(c => c.id === selectedStudent.courseId) || null : null}
                onSave={handleSaveStudent}
                onDelete={() => loadData()}
            />
        </div>
    );
}
