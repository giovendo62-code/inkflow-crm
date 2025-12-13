import { useState, useEffect, useCallback } from 'react';
import { storage } from '../../lib/storage';
import { type Course, type Student } from '../../types';
import { GraduationCap, Plus, Users, Calendar, Euro, BookOpen } from 'lucide-react';
import classes from '../crm/ClientListPage.module.css';
import { AddCourseModal } from './AddCourseModal';
import { AddStudentModal } from './AddStudentModal';
import { StudentDetailsModal } from './StudentDetailsModal';
import { useAuth } from '../auth/AuthContext';

export function AcademyPage() {
    const { user } = useAuth();
    const [courses, setCourses] = useState<Course[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<string | 'all'>('all');

    // Modals
    const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
    const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    const loadData = useCallback(async () => {
        if (!user?.tenantId) return;
        try {
            const [allCourses, allStudents] = await Promise.all([
                storage.getCourses(user.tenantId),
                storage.getStudents(user.tenantId)
            ]);
            setCourses(allCourses);
            setStudents(allStudents);
        } catch (error) {
            console.error("Failed to load academy data:", error);
        }
    }, [user?.tenantId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const filteredStudents = selectedCourse === 'all'
        ? students
        : students.filter(s => s.courseId === selectedCourse);

    const getStudentCount = (courseId: string) => {
        return students.filter(s => s.courseId === courseId).length;
    };

    const getCourseName = (courseId: string) => {
        const course = courses.find(c => c.id === courseId);
        return course?.name || 'Corso sconosciuto';
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

    return (
        <div className={classes.container}>
            <div className={classes.header}>
                <h1 className={classes.title} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <GraduationCap size={32} />
                    Academy
                </h1>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
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

                <div style={{
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
                        €{students.reduce((sum, s) => sum + s.totalPaid, 0).toLocaleString()}
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
                                </div>

                                {course.description && (
                                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                                        {course.description}
                                    </p>
                                )}

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Calendar size={14} />
                                        {new Date(course.startDate).toLocaleDateString('it-IT')} - {new Date(course.endDate).toLocaleDateString('it-IT')}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Users size={14} />
                                        {getStudentCount(course.id)} corsisti
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Euro size={14} />
                                        €{course.price.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Students Filter */}
            <div style={{ marginBottom: '1rem' }}>
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

            {/* Students Table */}
            <div className={classes.tableWrapper}>
                <table className={classes.table}>
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Corso</th>
                            <th>Email</th>
                            <th>Telefono</th>
                            <th>Iscrizione</th>
                            <th>Pagato</th>
                            <th>Stato</th>
                            <th>Azioni</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStudents.length > 0 ? (
                            filteredStudents.map(student => (
                                <tr key={student.id} className={classes.row}>
                                    <td>
                                        <strong>{student.firstName} {student.lastName}</strong>
                                    </td>
                                    <td>{getCourseName(student.courseId)}</td>
                                    <td>{student.email}</td>
                                    <td>{student.phone}</td>
                                    <td>{new Date(student.enrollmentDate).toLocaleDateString('it-IT')}</td>
                                    <td>
                                        <strong style={{ color: 'var(--color-success)' }}>
                                            €{student.totalPaid.toLocaleString()}
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
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                                    {courses.length === 0
                                        ? 'Crea un corso per aggiungere corsisti'
                                        : 'Nessun corsista trovato. Aggiungi il primo corsista!'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modals */}
            <AddCourseModal
                isOpen={isCourseModalOpen}
                onClose={() => setIsCourseModalOpen(false)}
                onSuccess={loadData}
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
