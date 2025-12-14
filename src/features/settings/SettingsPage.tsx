import { useState, useEffect } from 'react';
import { storage } from '../../lib/storage';
import { type Tenant } from '../../types';
import classes from '../crm/ClientListPage.module.css';
import { Save, Palette, Layout, Plus, Building2, User as UserIcon, Pencil } from 'lucide-react';
import QRCode from 'qrcode';
import { useAuth } from '../auth/AuthContext';

export function SettingsPage() {
    const { user } = useAuth();
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'general' | 'appearance'>('general');
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
    const [showFullQR, setShowFullQR] = useState(false);

    // Manager Profile State
    const [managerForm, setManagerForm] = useState({
        name: '',
        email: '',
        avatarUrl: '',
        phone: '',
        password: ''
    });

    useEffect(() => {
        if (user) {
            setManagerForm({
                name: user.name || '',
                email: user.email || '',
                avatarUrl: user.avatarUrl || '',
                phone: user.profile?.phone || '',
                password: (user.profile as any)?.password || ''
            });
        }
    }, [user]);

    const handleSaveManager = async () => {
        if (!user) return;
        try {
            const updatedUser = {
                ...user,
                name: managerForm.name,
                email: managerForm.email,
                avatarUrl: managerForm.avatarUrl,
                profile: {
                    ...user.profile,
                    phone: managerForm.phone,
                    password: managerForm.password
                }
            };
            await storage.saveUser(updatedUser);
            alert('Profilo manager aggiornato con successo!');
        } catch (e) {
            console.error(e);
            alert('Errore durante l\'aggiornamento del profilo.');
        }
    };

    useEffect(() => {
        const loadSettings = async () => {
            const allTenants = await storage.getTenants();
            if (allTenants.length > 0) {
                // Default to first or user's tenant if possible
                const currentTenant = allTenants.find(t => t.id === user?.tenantId) || allTenants[0];
                selectTenant(currentTenant);
            }
        };
        loadSettings();
    }, [user?.tenantId]);

    const selectTenant = (t: Tenant) => {
        if (!t.theme) {
            t.theme = {
                primaryColor: '#FF6B35',
                sidebarStyle: 'dark',
                menuPosition: 'left',
                colorMode: 'dark'
            };
        }
        setTenant(t);
        generateQR(t.id);
    };

    const generateQR = (tenantId: string) => {
        const publicLink = `${window.location.origin}/register/${tenantId}`;
        QRCode.toDataURL(publicLink, {
            width: 256,
            margin: 2,
            color: {
                dark: '#FF6B35',
                light: '#FFFFFF'
            }
        }).then(url => {
            setQrCodeUrl(url);
        }).catch(err => console.error(err));
    };

    const handleSave = async () => {
        if (!tenant) return;
        setLoading(true);

        try {
            // Update CSS variables
            if (tenant.theme?.primaryColor) {
                document.documentElement.style.setProperty('--color-primary', tenant.theme.primaryColor);
                const r = parseInt(tenant.theme.primaryColor.slice(1, 3), 16);
                const g = parseInt(tenant.theme.primaryColor.slice(3, 5), 16);
                const b = parseInt(tenant.theme.primaryColor.slice(5, 7), 16);

                const hoverColor = `rgb(${Math.min(r + 30, 255)}, ${Math.min(g + 30, 255)}, ${Math.min(b + 30, 255)})`;
                const darkColor = `rgb(${Math.max(r - 30, 0)}, ${Math.max(g - 30, 0)}, ${Math.max(b - 30, 0)})`;

                document.documentElement.style.setProperty('--color-primary-hover', hoverColor);
                document.documentElement.style.setProperty('--color-primary-dark', darkColor);
            }

            if (tenant.theme?.colorMode === 'light') {
                document.documentElement.style.setProperty('--color-background', '#F5F5F5');
                document.documentElement.style.setProperty('--color-surface', '#FFFFFF');
                document.documentElement.style.setProperty('--color-surface-hover', '#F0F0F0');
                document.documentElement.style.setProperty('--color-text-primary', '#1A1A1A');
                document.documentElement.style.setProperty('--color-text-secondary', '#666666');
                document.documentElement.style.setProperty('--color-text-muted', '#999999');
                document.documentElement.style.setProperty('--color-border', '#E0E0E0');
            } else {
                document.documentElement.style.setProperty('--color-background', '#0A0A0A');
                document.documentElement.style.setProperty('--color-surface', '#1A1A1A');
                document.documentElement.style.setProperty('--color-surface-hover', '#252525');
                document.documentElement.style.setProperty('--color-text-primary', '#FFFFFF');
                document.documentElement.style.setProperty('--color-text-secondary', '#A1A1A1');
                document.documentElement.style.setProperty('--color-text-muted', '#666666');
                document.documentElement.style.setProperty('--color-border', '#2A2A2A');
            }

            await storage.saveTenant(tenant);

            setTimeout(() => {
                setLoading(false);
                alert('Impostazioni salvate!');
            }, 500);
        } catch (error) {
            console.error("Failed to save settings:", error);
            setLoading(false);
            alert("Errore salvataggio impostazioni");
        }
    };

    if (!tenant) return <div>Loading...</div>;

    const publicLink = `${window.location.origin}/register/${tenant.id}`;

    const colorPresets = [
        { name: 'Arancio Caldo', color: '#FF6B35' },
        { name: 'Fucsia', color: '#FF00FF' },
        { name: 'Blu Elettrico', color: '#0066FF' },
        { name: 'Verde Smeraldo', color: '#00CC66' },
        { name: 'Viola Profondo', color: '#6633FF' },
        { name: 'Rosso Passione', color: '#FF3366' },
        { name: 'Turchese', color: '#00CED1' },
        { name: 'Oro', color: '#FFD700' }
    ];

    return (
        <div className={classes.container}>
            {/* Full Screen QR Overlay */}
            {showFullQR && qrCodeUrl && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.95)',
                        zIndex: 9999,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backdropFilter: 'blur(5px)'
                    }}
                    onClick={() => setShowFullQR(false)}
                >
                    <button
                        style={{
                            position: 'absolute',
                            top: '20px',
                            right: '20px',
                            background: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            color: 'black'
                        }}
                        onClick={() => setShowFullQR(false)}
                    >
                        ×
                    </button>
                    <img
                        src={qrCodeUrl}
                        alt="QR Code Fullscreen"
                        style={{
                            maxWidth: '90%',
                            maxHeight: '80vh',
                            borderRadius: '12px',
                            boxShadow: '0 0 20px rgba(255,107,53, 0.5)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    />
                    <p style={{ marginTop: '1rem', color: 'white', fontSize: '1.1rem' }}>
                        Tocca lo sfondo per chiudere
                    </p>
                </div>
            )}

            <div className={classes.header}>
                <h1 className={classes.title}>Impostazioni Studio</h1>
                <button className={classes.addBtn} onClick={handleSave} disabled={loading}>
                    <Save size={18} />
                    <span>{loading ? 'Salvataggio...' : 'Salva Modifiche'}</span>
                </button>
            </div>

            {/* Manager Profile Section */}
            <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ padding: '0.75rem', background: 'rgba(0, 102, 255, 0.1)', borderRadius: '50%', color: '#0066FF' }}>
                        <UserIcon size={24} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 'bold' }}>Profilo Manager</h2>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: 0 }}>Gestisci i tuoi dati personali</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', alignItems: 'start' }}>
                    {/* Immagine Profilo */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', padding: '1rem', background: 'var(--color-surface-hover)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                            {managerForm.avatarUrl ? (
                                <img src={managerForm.avatarUrl} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--color-surface)' }} />
                            ) : (
                                <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--color-border)' }}>
                                    <UserIcon size={48} color="var(--color-text-muted)" />
                                </div>
                            )}
                            <label style={{
                                position: 'absolute', bottom: 0, right: 0,
                                background: '#0066FF', borderRadius: '50%',
                                width: '32px', height: '32px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', border: '2px solid white'
                            }}>
                                <Pencil size={16} color="white" />
                                <input
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                setManagerForm(prev => ({ ...prev, avatarUrl: reader.result as string }));
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                />
                            </label>
                        </div>
                        <span style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--color-text-primary)' }}>{managerForm.name || 'Manager'}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{managerForm.email}</span>
                    </div>

                    {/* Form Fields */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className={classes.group}>
                            <label style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem', display: 'block' }}>Nome Completo</label>
                            <input
                                placeholder="Nome"
                                value={managerForm.name}
                                onChange={e => setManagerForm({ ...managerForm, name: e.target.value })}
                                className={classes.searchInput}
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div className={classes.group}>
                            <label style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem', display: 'block' }}>Email</label>
                            <input
                                placeholder="Email"
                                value={managerForm.email}
                                onChange={e => setManagerForm({ ...managerForm, email: e.target.value })}
                                className={classes.searchInput}
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div className={classes.group}>
                            <label style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem', display: 'block' }}>Telefono Mobile (per WhatsApp)</label>
                            <input
                                placeholder="+39 ..."
                                value={managerForm.phone}
                                onChange={e => setManagerForm({ ...managerForm, phone: e.target.value })}
                                className={classes.searchInput}
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div className={classes.group}>
                            <label style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem', display: 'block' }}>Nuova Password (opzionale)</label>
                            <input
                                placeholder="Lascia vuoto per non cambiare"
                                type="text"
                                value={managerForm.password}
                                onChange={e => setManagerForm({ ...managerForm, password: e.target.value })}
                                className={classes.searchInput}
                                style={{ width: '100%', fontFamily: 'monospace' }}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                            <button onClick={handleSaveManager} style={{ padding: '0.75rem 1.5rem', background: '#0066FF', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Save size={18} /> Aggiorna Profilo
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '2rem',
                borderBottom: '1px solid var(--color-border)'
            }}>
                <button
                    onClick={() => setActiveTab('general')}
                    style={{
                        padding: '1rem 1.5rem',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'general' ? '2px solid var(--color-primary)' : '2px solid transparent',
                        color: activeTab === 'general' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                        cursor: 'pointer',
                        fontWeight: activeTab === 'general' ? '600' : '400',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <Layout size={18} />
                    Generale
                </button>
                <button
                    onClick={() => setActiveTab('appearance')}
                    style={{
                        padding: '1rem 1.5rem',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'appearance' ? '2px solid var(--color-primary)' : '2px solid transparent',
                        color: activeTab === 'appearance' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                        cursor: 'pointer',
                        fontWeight: activeTab === 'appearance' ? '600' : '400',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <Palette size={18} />
                    Aspetto & Colori
                </button>
            </div>

            {activeTab === 'general' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                    <div className={classes.tableWrapper} style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Informazioni Studio</h2>

                        <div className={classes.group}>
                            <label className={classes.label} style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>Nome Studio</label>
                            <input
                                className={classes.searchInput}
                                style={{ width: '100%', padding: '0.75rem' }}
                                value={tenant.name}
                                onChange={e => setTenant({ ...tenant, name: e.target.value })}
                            />
                        </div>

                        <div className={classes.group}>
                            <label className={classes.label} style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>Logo Studio</label>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{
                                    border: '2px dashed var(--color-border)',
                                    borderRadius: 'var(--radius-md)',
                                    padding: '2rem',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    background: 'var(--color-surface-hover)'
                                }}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                    setTenant({ ...tenant, logo: reader.result as string });
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                        style={{
                                            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer'
                                        }}
                                    />
                                    <div style={{ pointerEvents: 'none' }}>
                                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📂</div>
                                        <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Clicca o trascina per caricare il logo</p>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>PNG, JPG, SVG (max 2MB)</p>
                                    </div>
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem', textAlign: 'center' }}>- OPPURE -</p>
                                    <input
                                        className={classes.searchInput}
                                        style={{ width: '100%', padding: '0.75rem' }}
                                        value={tenant.logo || ''}
                                        onChange={e => setTenant({ ...tenant, logo: e.target.value })}
                                        placeholder="Incolla URL immagine (opzionale)"
                                    />
                                </div>
                            </div>
                        </div>

                        {tenant.logo && (
                            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', textAlign: 'center' }}>
                                <p style={{ marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Anteprima Logo</p>
                                <img src={tenant.logo} alt="Studio Logo" style={{ maxHeight: '80px', margin: '0 auto' }} />
                            </div>
                        )}
                    </div>

                    <div className={classes.tableWrapper} style={{ padding: '2rem' }}>
                        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Registrazione Pubblica</h2>
                        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            Condividi questo link con i clienti per la registrazione automatica.
                        </p>

                        <div className={classes.group}>
                            <label className={classes.label} style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>Link Registrazione</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    className={classes.searchInput}
                                    style={{ width: '100%', padding: '0.75rem' }}
                                    value={publicLink}
                                    readOnly
                                />
                                <button className={classes.actionBtn} onClick={() => navigator.clipboard.writeText(publicLink)}>
                                    Copia
                                </button>
                            </div>
                        </div>

                        {qrCodeUrl && (
                            <div style={{
                                marginTop: '2rem',
                                padding: '1rem',
                                background: 'linear-gradient(135deg, var(--color-surface) 0%, var(--color-surface-hover) 100%)',
                                borderRadius: 'var(--radius-lg)',
                                border: '2px solid var(--color-border)',
                                textAlign: 'center'
                            }}>
                                <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '600' }}>
                                    📱 QR Code Form Clienti
                                </h3>
                                <p style={{ marginBottom: '1.5rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                                    Tocca per ingrandire
                                </p>
                                <div
                                    onClick={() => setShowFullQR(true)}
                                    style={{
                                        display: 'inline-block',
                                        padding: '1rem',
                                        background: 'white',
                                        borderRadius: 'var(--radius-md)',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                        cursor: 'zoom-in'
                                    }}
                                >
                                    <img
                                        src={qrCodeUrl}
                                        alt="QR Code Form Clienti"
                                        style={{ display: 'block', width: '256px', maxWidth: '100%', height: 'auto' }}
                                    />
                                </div>
                                <p style={{ marginTop: '1rem', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                                    Stampa o condividi questo QR code con i tuoi clienti
                                </p>
                            </div>
                        )}

                        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                            <a
                                href={`/register/${tenant.id}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}
                            >
                                Testa il Form Pubblico &rarr;
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'appearance' && (
                <div>
                    <div className={classes.tableWrapper} style={{ padding: '2rem', marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Palette size={20} />
                            Colore Primario
                        </h2>
                        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            Scegli il colore principale dell'interfaccia (pulsanti, link, grafici)
                        </p>

                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', marginBottom: '1rem', fontSize: '0.9rem', fontWeight: '600' }}>
                                Palette Predefinite
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
                                {colorPresets.map(preset => (
                                    <button
                                        key={preset.color}
                                        onClick={() => setTenant({
                                            ...tenant,
                                            theme: { ...tenant.theme!, primaryColor: preset.color }
                                        })}
                                        style={{
                                            padding: '1rem',
                                            borderRadius: 'var(--radius-md)',
                                            border: tenant.theme?.primaryColor === preset.color
                                                ? `2px solid ${preset.color}`
                                                : '1px solid var(--color-border)',
                                            background: 'var(--color-surface-hover)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }}
                                    >
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            backgroundColor: preset.color,
                                            border: '2px solid rgba(255,255,255,0.2)'
                                        }} />
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                            {preset.name}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '1rem', fontSize: '0.9rem', fontWeight: '600' }}>
                                Colore Personalizzato
                            </label>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <input
                                    type="color"
                                    value={tenant.theme?.primaryColor || '#FF6B35'}
                                    onChange={e => setTenant({
                                        ...tenant,
                                        theme: { ...tenant.theme!, primaryColor: e.target.value }
                                    })}
                                    style={{
                                        width: '80px',
                                        height: '80px',
                                        border: '2px solid var(--color-border)',
                                        borderRadius: 'var(--radius-md)',
                                        cursor: 'pointer'
                                    }}
                                />
                                <div>
                                    <p style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>Colore Selezionato</p>
                                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: tenant.theme?.primaryColor }}>
                                        {tenant.theme?.primaryColor}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={classes.tableWrapper} style={{ padding: '2rem', marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Modalità Colore</h2>
                        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            Scegli tra tema scuro o chiaro per l'intera interfaccia
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                            <button
                                onClick={() => setTenant({
                                    ...tenant,
                                    theme: { ...tenant.theme!, colorMode: 'dark' }
                                })}
                                style={{
                                    padding: '2rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: tenant.theme?.colorMode === 'dark'
                                        ? '2px solid var(--color-primary)'
                                        : '1px solid var(--color-border)',
                                    background: tenant.theme?.colorMode === 'dark'
                                        ? 'rgba(255, 107, 53, 0.1)'
                                        : 'var(--color-surface-hover)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '1rem'
                                }}
                            >
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: 'var(--radius-md)',
                                    background: 'linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%)',
                                    border: '2px solid #2A2A2A',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '2rem'
                                }}>
                                    🌙
                                </div>
                                <div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                                        Dark Mode
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                        Tema scuro (consigliato)
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => setTenant({
                                    ...tenant,
                                    theme: { ...tenant.theme!, colorMode: 'light' }
                                })}
                                style={{
                                    padding: '2rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: tenant.theme?.colorMode === 'light'
                                        ? '2px solid var(--color-primary)'
                                        : '1px solid var(--color-border)',
                                    background: tenant.theme?.colorMode === 'light'
                                        ? 'rgba(255, 107, 53, 0.1)'
                                        : 'var(--color-surface-hover)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '1rem'
                                }}
                            >
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: 'var(--radius-md)',
                                    background: 'linear-gradient(135deg, #FFFFFF 0%, #F5F5F5 100%)',
                                    border: '2px solid #E0E0E0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '2rem'
                                }}>
                                    ☀️
                                </div>
                                <div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                                        Light Mode
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                        Tema chiaro
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className={classes.tableWrapper} style={{ padding: '2rem', marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Stile Menu Laterale</h2>
                        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            Personalizza l'aspetto della barra laterale
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                            {[
                                { value: 'dark', label: 'Scuro', desc: 'Sfondo nero' },
                                { value: 'light', label: 'Chiaro', desc: 'Sfondo grigio' },
                                { value: 'colored', label: 'Colorato', desc: 'Colore primario' }
                            ].map(option => (
                                <button
                                    key={option.value}
                                    onClick={() => setTenant({
                                        ...tenant,
                                        theme: { ...tenant.theme!, sidebarStyle: option.value as any }
                                    })}
                                    style={{
                                        padding: '1.5rem',
                                        borderRadius: 'var(--radius-md)',
                                        border: tenant.theme?.sidebarStyle === option.value
                                            ? '2px solid var(--color-primary)'
                                            : '1px solid var(--color-border)',
                                        background: 'var(--color-surface-hover)',
                                        cursor: 'pointer',
                                        textAlign: 'center'
                                    }}
                                >
                                    <div style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                                        {option.label}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                        {option.desc}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={classes.tableWrapper} style={{ padding: '2rem' }}>
                        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Anteprima</h2>
                        <div style={{
                            padding: '2rem',
                            background: 'var(--color-background)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)'
                        }}>
                            <button style={{
                                padding: '0.75rem 1.5rem',
                                background: tenant.theme?.primaryColor,
                                color: 'white',
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                fontWeight: '600',
                                cursor: 'pointer',
                                marginRight: '1rem'
                            }}>
                                Pulsante Primario
                            </button>
                            <a href="#" style={{ color: tenant.theme?.primaryColor, textDecoration: 'underline' }}>
                                Link di esempio
                            </a>
                        </div>
                    </div>
                </div>
            )
            }
        </div >
    );
}
