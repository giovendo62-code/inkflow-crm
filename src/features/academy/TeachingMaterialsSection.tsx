import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { storage } from '../../lib/storage';
import { type TeachingMaterial, type Course } from '../../types';
import { FileText, Image, Link as LinkIcon, Download, Trash2, Plus, Lock, Unlock, Upload, CheckCircle, Folder, ArrowLeft } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface Props {
    courses: Course[];
    materials: TeachingMaterial[];
    onUpdate: () => void;
}

export function TeachingMaterialsSection({ courses, materials, onUpdate }: Props) {
    const { user } = useAuth();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // Folder View State
    const [view, setView] = useState<'folders' | 'details'>('folders');
    const [currentCourseId, setCurrentCourseId] = useState<string | null>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            processFile(e.target.files[0]);
        }
    };

    const processFile = (file: File) => {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            alert("Il file è troppo grande (Max 5MB)");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setNewMaterial(prev => ({
                ...prev,
                url: reader.result as string,
                title: prev.title || file.name // Auto-fill title if empty
            }));
        };
        reader.readAsDataURL(file);
    };

    // Form State
    const [newMaterial, setNewMaterial] = useState<{
        title: string;
        type: 'PDF' | 'IMAGE' | 'LINK';
        url: string;
        courseId: string;
        unlockThreshold: number;
    }>({
        title: '',
        type: 'PDF',
        url: '',
        courseId: '',
        unlockThreshold: 0
    });

    const handleAddMaterial = async () => {
        if (!user?.tenantId || !newMaterial.courseId || !newMaterial.title) return;

        const material: TeachingMaterial = {
            id: uuidv4(),
            tenantId: user.tenantId,
            courseId: newMaterial.courseId,
            title: newMaterial.title,
            type: newMaterial.type as any,
            url: newMaterial.url,
            unlockThresholdDays: newMaterial.unlockThreshold,
            createdAt: new Date().toISOString()
        };

        try {
            await storage.saveMaterial(material);
            onUpdate(); // Refresh parent data
            setIsAddModalOpen(false);
            setNewMaterial({ title: '', type: 'PDF', url: '', courseId: '', unlockThreshold: 0 });
        } catch (error) {
            console.error("Error saving material", error);
            alert("Errore salvataggio materiale");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Eliminare questo materiale?")) return;
        try {
            await storage.deleteMaterial(id);
            onUpdate(); // Refresh parent data
        } catch (e) {
            console.error(e);
        }
    };

    const getCourseName = (id: string) => courses.find(c => c.id === id)?.name || 'Corso sconosciuto';

    // Group materials by course
    const getMaterialsForCourse = (cId: string) => materials.filter(m => m.courseId === cId);

    const openFolder = (cId: string) => {
        setCurrentCourseId(cId);
        setView('details');
    };

    const handleOpenAddModal = () => {
        // If inside a folder, pre-select that course
        if (currentCourseId) {
            const course = courses.find(c => c.id === currentCourseId);
            const threshold = course ? Math.max(0, (course.totalLessons || 0) - 1) : 0;
            setNewMaterial(prev => ({ ...prev, courseId: currentCourseId, unlockThreshold: threshold }));
        }
        setIsAddModalOpen(true);
    };

    const displayedMaterials = currentCourseId
        ? materials.filter(m => m.courseId === currentCourseId)
        : materials;

    return (
        <div style={{ marginTop: '3rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-text-primary)' }}>
                        <div style={{ padding: '0.5rem', background: 'rgba(66, 133, 244, 0.1)', borderRadius: '8px', color: 'var(--color-primary)' }}>
                            <FileText size={20} />
                        </div>
                        {view === 'folders' ? 'Materiali Didattici' : `Materiali: ${getCourseName(currentCourseId || '')}`}
                    </h2>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem', marginLeft: '3.25rem' }}>
                        {view === 'folders'
                            ? 'Gestisci le risorse organizzate per corso'
                            : `${displayedMaterials.length} file in questo corso`
                        }
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    {view === 'details' && (
                        <button
                            onClick={() => setView('folders')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.75rem 1.25rem',
                                background: 'var(--color-surface)',
                                color: 'var(--color-text-primary)',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                fontWeight: '500'
                            }}
                        >
                            <ArrowLeft size={18} />
                            Indietro
                        </button>
                    )}

                    <button
                        onClick={handleOpenAddModal}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1.25rem',
                            background: 'var(--color-primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            fontWeight: '500',
                            boxShadow: '0 2px 4px rgba(66, 133, 244, 0.2)',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <Plus size={18} />
                        Nuovo Materiale
                    </button>
                </div>
            </div>

            {view === 'folders' ? (
                // FOLDERS VIEW
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                    {courses.map(course => {
                        const count = getMaterialsForCourse(course.id).length;
                        return (
                            <div
                                key={course.id}
                                onClick={() => openFolder(course.id)}
                                style={{
                                    background: 'var(--color-surface)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-lg)',
                                    padding: '1.5rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '1rem',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ padding: '0.75rem', background: 'rgba(255, 193, 7, 0.1)', borderRadius: '12px', color: '#FBC02D' }}>
                                        <Folder size={32} fill="#FBC02D" fillOpacity={0.2} />
                                    </div>
                                    <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--color-text-secondary)' }}>
                                        {count} file
                                    </span>
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.25rem' }}>{course.name}</h3>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {course.description || 'Nessuna descrizione'}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                // FILES VIEW (DETAILS)
                displayedMaterials.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '4rem 2rem',
                        background: 'var(--color-surface)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px dashed var(--color-border)'
                    }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            background: 'var(--color-surface-hover)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem',
                            color: 'var(--color-text-muted)'
                        }}>
                            <FileText size={32} />
                        </div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>Nessun materiale in questo corso</h3>
                        <p style={{ color: 'var(--color-text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
                            Clicca su "Nuovo Materiale" per aggiungere dispense a questo corso.
                        </p>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '1.5rem'
                    }}>
                        {displayedMaterials.map(mat => (
                            <div key={mat.id} style={{
                                background: 'var(--color-surface)',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-lg)',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                position: 'relative',
                                transition: 'all 0.2s',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                            }}>
                                <div style={{ padding: '1.5rem', flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                                        <div style={{
                                            minWidth: '48px',
                                            height: '48px',
                                            borderRadius: '12px',
                                            background: mat.type === 'PDF' ? 'rgba(255, 68, 68, 0.1)' :
                                                mat.type === 'IMAGE' ? 'rgba(66, 133, 244, 0.1)' :
                                                    'rgba(15, 157, 88, 0.1)',
                                            color: mat.type === 'PDF' ? '#ff4444' :
                                                mat.type === 'IMAGE' ? '#4285f4' :
                                                    '#0f9d58',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            {mat.type === 'PDF' && <FileText size={24} />}
                                            {mat.type === 'IMAGE' && <Image size={24} />}
                                            {mat.type === 'LINK' && <LinkIcon size={24} />}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <h3 style={{
                                                fontSize: '1rem',
                                                fontWeight: '600',
                                                marginBottom: '0.25rem',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }} title={mat.title}>
                                                {mat.title}
                                            </h3>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                                                {getCourseName(mat.courseId)}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(mat.id)}
                                            style={{
                                                padding: '0.5rem',
                                                color: 'var(--color-text-muted)',
                                                background: 'transparent',
                                                border: 'none',
                                                cursor: 'pointer',
                                                transition: 'color 0.2s',
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.color = 'var(--color-error)'}
                                            onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
                                            title="Elimina"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>

                                    <div style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        padding: '0.35rem 0.75rem',
                                        borderRadius: '999px',
                                        background: 'var(--color-background)',
                                        border: '1px solid var(--color-border)',
                                        fontSize: '0.75rem',
                                        color: 'var(--color-text-secondary)',
                                        fontWeight: '500'
                                    }}>
                                        {mat.unlockThresholdDays > 0 ? (
                                            <>
                                                <Lock size={12} />
                                                <span>Sblocco dopo {mat.unlockThresholdDays} lezione{mat.unlockThresholdDays !== 1 && 'i'}</span>
                                            </>
                                        ) : (
                                            <>
                                                <Unlock size={12} color="var(--color-success)" />
                                                <span style={{ color: 'var(--color-success)' }}>Visibile subito</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <a
                                    href={mat.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        padding: '1rem',
                                        background: 'var(--color-surface-hover)',
                                        borderTop: '1px solid var(--color-border)',
                                        color: 'var(--color-primary)',
                                        textDecoration: 'none',
                                        fontWeight: '500',
                                        fontSize: '0.9rem',
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(66, 133, 244, 0.05)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'var(--color-surface-hover)'}
                                >
                                    <Download size={16} />
                                    {mat.type === 'LINK' ? 'Apri Link' : 'Scarica Risorsa'}
                                </a>
                            </div>
                        ))}
                    </div>
                )
            )}

            {/* Add Modal */}
            {isAddModalOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }} onClick={() => setIsAddModalOpen(false)}>
                    <div style={{
                        background: 'var(--color-surface)',
                        padding: '2rem',
                        borderRadius: 'var(--radius-lg)',
                        width: '90%',
                        maxWidth: '500px'
                    }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginBottom: '1.5rem' }}>Nuovo Materiale Didattico</h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Titolo</label>
                                <input
                                    value={newMaterial.title}
                                    onChange={e => setNewMaterial({ ...newMaterial, title: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text-primary)' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Corso</label>
                                <select
                                    value={newMaterial.courseId}
                                    onChange={e => {
                                        const cId = e.target.value;
                                        const course = courses.find(c => c.id === cId);
                                        const threshold = course ? Math.max(0, (course.totalLessons || 0) - 1) : 0;
                                        setNewMaterial({ ...newMaterial, courseId: cId, unlockThreshold: threshold });
                                    }}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text-primary)' }}
                                >
                                    <option value="">Seleziona Corso</option>
                                    {courses.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Tipo</label>
                                <select
                                    value={newMaterial.type}
                                    onChange={e => setNewMaterial({ ...newMaterial, type: e.target.value as any })}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text-primary)' }}
                                >
                                    <option value="PDF">PDF / Documento</option>
                                    <option value="IMAGE">Immagine</option>
                                    <option value="LINK">Link Esterno</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>File o URL</label>

                                {newMaterial.type === 'LINK' ? (
                                    <input
                                        value={newMaterial.url}
                                        onChange={e => setNewMaterial({ ...newMaterial, url: e.target.value })}
                                        placeholder="https://..."
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text-primary)' }}
                                    />
                                ) : (
                                    <div
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        onClick={() => document.getElementById('file-upload')?.click()}
                                        style={{
                                            border: `2px dashed ${isDragging ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                            borderRadius: 'var(--radius-md)',
                                            padding: '2rem',
                                            textAlign: 'center',
                                            background: isDragging ? 'rgba(66, 133, 244, 0.1)' : 'var(--color-background)',
                                            transition: 'all 0.2s',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {!newMaterial.url ? (
                                            <>
                                                <Upload size={32} style={{ marginBottom: '1rem', color: 'var(--color-text-secondary)' }} />
                                                <p style={{ marginBottom: '0.5rem', fontWeight: '500' }}>
                                                    Trascina qui il file o clicca per caricare
                                                </p>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                                    PDF, Immagini (Max 5MB)
                                                </p>
                                                <input
                                                    type="file"
                                                    onChange={handleFileSelect}
                                                    accept={newMaterial.type === 'PDF' ? '.pdf' : 'image/*'}
                                                    style={{ display: 'none' }}
                                                    id="file-upload"
                                                />
                                            </>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                                <CheckCircle size={32} color="var(--color-success)" />
                                                <p style={{ color: 'var(--color-success)', fontWeight: '500' }}>File caricato con successo!</p>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setNewMaterial({ ...newMaterial, url: '' });
                                                    }}
                                                    style={{
                                                        marginTop: '0.5rem',
                                                        background: 'transparent',
                                                        border: 'none',
                                                        color: 'var(--color-error)',
                                                        fontSize: '0.875rem',
                                                        cursor: 'pointer',
                                                        textDecoration: 'underline'
                                                    }}
                                                >
                                                    Rimuovi file
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Sblocca dopo N Lezioni (Penultimo = Totale - 1)</label>
                                <input
                                    type="number"
                                    value={newMaterial.unlockThreshold}
                                    onChange={e => setNewMaterial({ ...newMaterial, unlockThreshold: Number(e.target.value) })}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text-primary)' }}
                                />
                            </div>

                            <button
                                onClick={handleAddMaterial}
                                style={{
                                    marginTop: '1rem',
                                    padding: '0.75rem',
                                    background: 'var(--color-primary)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: 'var(--radius-md)',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Salva Materiale
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
