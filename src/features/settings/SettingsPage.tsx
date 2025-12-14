import { useState, useEffect } from 'react';
import { storage } from '../../lib/storage';
import { type Tenant } from '../../types';
import classes from '../crm/ClientListPage.module.css';
import { Save, Palette, Layout, Plus, Building2 } from 'lucide-react';
import QRCode from 'qrcode';
import { useAuth } from '../auth/AuthContext';
import { v4 as uuidv4 } from 'uuid';

export function SettingsPage() {
    const { user } = useAuth();
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'general' | 'appearance'>('general');
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
    const [isCreating, setIsCreating] = useState(false);
    const [newTenantName, setNewTenantName] = useState('');

    useEffect(() => {
        const loadSettings = async () => {
            const allTenants = await storage.getTenants();
            setTenants(allTenants);

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

    const handleCreateTenant = async () => {
        if (!newTenantName.trim()) return;
        setLoading(true);
        try {
            const newTenant: Tenant = {
                id: `studio-${Date.now()}`,
                name: newTenantName,
                // createdAt removed as it's not in the type
                theme: {
                    primaryColor: '#FF6B35',
                    sidebarStyle: 'dark',
                    menuPosition: 'left',
                    colorMode: 'dark'
                }
            };
            await storage.saveTenant(newTenant);
            setTenants([...tenants, newTenant]);
            selectTenant(newTenant);
            setIsCreating(false);
            setNewTenantName('');
            alert('Nuovo studio creato! Ora puoi configurarlo.');
        } catch (error) {
            console.error(error);
            alert('Errore creazione studio');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!tenant) return;
        setLoading(true);

        try {
            // Update CSS variables
            if (tenant.theme?.primaryColor) {
                document.documentElement.style.setProperty('--color-primary', tenant.theme.primaryColor);
                // Calculate hover and dark variants
                const r = parseInt(tenant.theme.primaryColor.slice(1, 3), 16);
                const g = parseInt(tenant.theme.primaryColor.slice(3, 5), 16);
                const b = parseInt(tenant.theme.primaryColor.slice(5, 7), 16);

                const hoverColor = `rgb(${Math.min(r + 30, 255)}, ${Math.min(g + 30, 255)}, ${Math.min(b + 30, 255)})`;
                const darkColor = `rgb(${Math.max(r - 30, 0)}, ${Math.max(g - 30, 0)}, ${Math.max(b - 30, 0)})`;

                document.documentElement.style.setProperty('--color-primary-hover', hoverColor);
                document.documentElement.style.setProperty('--color-primary-dark', darkColor);
            }

            // Apply color mode
            if (tenant.theme?.colorMode === 'light') {
                document.documentElement.style.setProperty('--color-background', '#F5F5F5');
                document.documentElement.style.setProperty('--color-surface', '#FFFFFF');
                document.documentElement.style.setProperty('--color-surface-hover', '#F0F0F0');
                document.documentElement.style.setProperty('--color-text-primary', '#1A1A1A');
                document.documentElement.style.setProperty('--color-text-secondary', '#666666');
                document.documentElement.style.setProperty('--color-text-muted', '#999999');
                document.documentElement.style.setProperty('--color-border', '#E0E0E0');
            } else {
                // Dark mode (default)
                document.documentElement.style.setProperty('--color-background', '#0A0A0A');
                document.documentElement.style.setProperty('--color-surface', '#1A1A1A');
                document.documentElement.style.setProperty('--color-surface-hover', '#252525');
                document.documentElement.style.setProperty('--color-text-primary', '#FFFFFF');
                document.documentElement.style.setProperty('--color-text-secondary', '#A1A1A1');
                document.documentElement.style.setProperty('--color-text-muted', '#666666');
                document.documentElement.style.setProperty('--color-border', '#2A2A2A');
            }

            // Persist to storage
            await storage.saveTenant(tenant);

            setTimeout(() => {
                setLoading(false);
                alert('Impostazioni salvate! Ricarica la pagina per vedere tutte le modifiche.');
            }, 500);
        } catch (error) {
            console.error("Failed to save settings:", error);
            setLoading(false);
            alert("Errore salvataggio impostazioni");
        }
    };

    if (!tenant) return <div>Loading...</div>;

    const publicLink = `${window.location.origin}/register/${tenant.id}`;

    // Predefined color palette
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
            <div className={classes.header}>
                <h1 className={classes.title}>Impostazioni Studio</h1>
                <button className={classes.addBtn} onClick={handleSave} disabled={loading}>
                    <Save size={18} />
                    <span>{loading ? 'Salvataggio...' : 'Salva Modifiche'}</span>
                </button>
            </div>

            {/* Tenant Switcher / Creator */}
            <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: '1rem', padding: '1.5rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <div style={{ padding: '0.75rem', background: 'var(--color-primary)', borderRadius: '50%', color: 'white' }}>
                    <Building2 size={24} />
                </div>
                <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Studio Corrente</p>
                    <select
                        value={tenant.id}
                        onChange={(e) => {
                            const t = tenants.find(t => t.id === e.target.value);
                            if (t) selectTenant(t);
                        }}
                        style={{
                            fontSize: '1.2rem',
                            fontWeight: 'bold',
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--color-text-primary)',
                            cursor: 'pointer',
                            outline: 'none',
                            width: '100%'
                        }}
                    >
                        {tenants.map(t => <option key={t.id} value={t.id} style={{ color: 'black' }}>{t.name}</option>)}
                    </select>
                </div>
                <button onClick={() => setIsCreating(true)} style={{ background: 'var(--color-surface-hover)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', cursor: 'pointer', display: 'flex', gap: '0.5rem', alignItems: 'center', fontWeight: '500' }}>
                    <Plus size={16} /> Nuovo Studio
                </button>
            </div>

            {isCreating && (
                <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'var(--color-surface-hover)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--color-primary)' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Crea Nuovo Studio</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                        <input
                            placeholder="Nome del nuovo studio..."
                            value={newTenantName}
                            onChange={(e) => setNewTenantName(e.target.value)}
                            style={{ flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text-primary)' }}
                        />
                        <button onClick={handleCreateTenant} style={{ background: 'var(--color-primary)', color: 'white', border: 'none', padding: '0 1.5rem', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: '600' }}>Crea Studio</button>
                        <button onClick={() => setIsCreating(false)} style={{ background: 'transparent', border: '1px solid var(--color-border)', padding: '0 1.5rem', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>Annulla</button>
                    </div>
                </div>
            )}

            {/* Tabs */}
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

            {/* General Tab */}
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
                                {/* File Upload Button */}
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
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            opacity: 0,
                                            cursor: 'pointer'
                                        }}
                                    />
                                    <div style={{ pointerEvents: 'none' }}>
                                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📂</div>
                                        <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Clicca o trascina per caricare il logo</p>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>PNG, JPG, SVG (max 2MB)</p>
                                    </div>
                                </div>

                                {/* Or URL Input */}
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

                        {/* QR Code */}
                        {qrCodeUrl && (
                            <div style={{
                                marginTop: '2rem',
                                padding: '1rem', // Reduced padding for mobile
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
                                    onClick={() => window.open(qrCodeUrl, '_blank')}
                                    style={{
                                        display: 'inline-block',
                                        padding: '1rem', // Reduced padding
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
            )
            }

            {/* Appearance Tab */}
            {
                activeTab === 'appearance' && (
                    <div>
                        <div className={classes.tableWrapper} style={{ padding: '2rem', marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Palette size={20} />
                                Colore Primario
                            </h2>
                            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                                Scegli il colore principale dell'interfaccia (pulsanti, link, grafici)
                            </p>

                            {/* Color Presets */}
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

                            {/* Custom Color Picker */}
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

                        {/* Color Mode */}
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

                        {/* Sidebar Style */}
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

                        {/* Preview */}
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
