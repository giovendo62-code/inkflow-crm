import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import classes from './PublicClientForm.module.css';
import { v4 as uuidv4 } from 'uuid';
import { storage } from '../../lib/storage';
import { type Client, type TattooStyle, type Tenant } from '../../types';
import { Building2, ShieldCheck, PenTool } from 'lucide-react';
import { getPrivacyText, getConsentText } from '../../lib/legalText';
import { sendWelcomeEmail } from '../../lib/email';
import { SignaturePadModal } from '../../components/SignaturePadModal';

export function PublicClientForm() {
    const { tenantId } = useParams<{ tenantId: string }>();

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [tenant, setTenant] = useState<Tenant | null>(null);

    // Signature State
    const [signatureModalOpen, setSignatureModalOpen] = useState(false);
    const [privacySignature, setPrivacySignature] = useState<string>('');
    const [consentSignature, setConsentSignature] = useState<string>('');
    const [currentSignatureType, setCurrentSignatureType] = useState<'PRIVACY' | 'CONSENT' | null>(null);

    // Document Preview State
    const [viewDoc, setViewDoc] = useState<'PRIVACY' | 'CONSENT' | null>(null);
    const openDocModal = (type: 'PRIVACY' | 'CONSENT') => setViewDoc(type);

    useEffect(() => {
        const loadTenant = async () => {
            try {
                // Load tenant info
                const tenants = await storage.getTenants();
                const currentTenant = tenants.find(t => t.id === tenantId) || tenants[0];
                setTenant(currentTenant);
            } catch (error) {
                console.error("Failed to load tenant:", error);
            }
        };
        loadTenant();
    }, [tenantId]);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        fiscalCode: '',
        birthDate: '',
        birthPlace: '',
        street: '',
        city: '',
        zip: '',
        municipality: '',
        email: '',
        phone: '',
        styles: [] as TattooStyle[],
        privacyAccepted: false,
        informedConsentAccepted: false
    });

    const availableStyles: TattooStyle[] = [
        'REALISTICO',
        'MICRO_REALISTICO',
        'MINIMAL',
        'GEOMETRICO',
        'TRADIZIONALE',
        'GIAPPONESE',
        'BLACKWORK',
        'WATERCOLOR',
        'TRIBAL',
        'OLD_SCHOOL',
        'NEW_SCHOOL',
        'LETTERING',
        'ALTRO'
    ];

    const handleInitialSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.privacyAccepted || !formData.informedConsentAccepted) {
            return alert('Devi accettare sia la Privacy che il Consenso Informato.');
        }

        // Check if both signatures are present
        if (!privacySignature || !consentSignature) {
            return alert('Devi firmare sia la Privacy che il Consenso Informato prima di procedere.');
        }

        finalizeRegistration();
    };

    const handleSignRequest = (type: 'PRIVACY' | 'CONSENT') => {
        setCurrentSignatureType(type);
        setSignatureModalOpen(true);
    };

    const handleSignatureSave = (signatureData: string) => {
        if (currentSignatureType === 'PRIVACY') {
            setPrivacySignature(signatureData);
            setFormData({ ...formData, privacyAccepted: true });
        } else if (currentSignatureType === 'CONSENT') {
            setConsentSignature(signatureData);
            setFormData({ ...formData, informedConsentAccepted: true });
        }
        setSignatureModalOpen(false);
        setCurrentSignatureType(null);
    };

    const finalizeRegistration = async () => {
        setLoading(true);

        // Detect device type
        const getDeviceType = () => {
            const ua = navigator.userAgent;
            if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
                return 'tablet';
            }
            if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
                return 'mobile';
            }
            return 'desktop';
        };

        const newClient: Client = {
            id: uuidv4(),
            tenantId: tenantId || 'studio-1',
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            fiscalCode: formData.fiscalCode,
            birthDate: formData.birthDate,
            birthPlace: formData.birthPlace,
            address: {
                street: formData.street,
                city: formData.city,
                zip: formData.zip,
                municipality: formData.municipality,
                country: 'Italia'
            },
            preferences: {
                styles: formData.styles
            },
            consents: {
                privacy: formData.privacyAccepted,
                informedConsent: formData.informedConsentAccepted,
                privacyDate: new Date().toISOString(),
                informedConsentDate: new Date().toISOString(),
                privacySignature: privacySignature,
                informedConsentSignature: consentSignature,
                signatureTimestamp: new Date().toISOString(),
                signatureDevice: getDeviceType(),
                signatureIp: 'N/A' // IP detection would require backend
            },
            // Update root level flags as well
            privacyPolicyAccepted: formData.privacyAccepted,
            privacyPolicyDate: new Date().toISOString(),
            informedConsentAccepted: formData.informedConsentAccepted,
            informedConsentDate: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            inBroadcast: false
        };

        try {
            await storage.saveClient(newClient);

            // INVIO EMAIL BENVENUTO
            await sendWelcomeEmail(newClient);

            setTimeout(() => {
                setLoading(false);
                setSuccess(true);
            }, 500);
        } catch (error) {
            console.error("Registration failed:", error);
            setLoading(false);
            alert("Errore durante la registrazione. Riprova.");
        }
    };

    const toggleStyle = (style: TattooStyle) => {
        if (formData.styles.includes(style)) {
            setFormData({ ...formData, styles: formData.styles.filter(s => s !== style) });
        } else {
            setFormData({ ...formData, styles: [...formData.styles, style] });
        }
    };

    if (success) {
        return (
            <div className={classes.container}>
                <div className={classes.card} style={{ textAlign: 'center' }}>
                    {tenant?.logo && (
                        <img
                            src={tenant.logo}
                            alt={tenant.name}
                            style={{
                                maxHeight: '50px',
                                margin: '0 auto 1.5rem',
                                display: 'block'
                            }}
                        />
                    )}
                    <ShieldCheck size={48} color="var(--color-success)" style={{ margin: '0 auto 1rem' }} />
                    <h1 className={classes.title} style={{ color: 'var(--color-success)' }}>Registrazione Firmata con Successo!</h1>
                    <p className={classes.subtitle}>Il tuo profilo è stato creato e i consensi sono stati firmati digitalmente con firma touch.</p>
                    <p style={{ marginTop: '1rem', color: 'var(--color-text-secondary)' }}>
                        {tenant?.name || 'Lo studio'} ti contatterà a breve.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className={classes.container}>
            <div className={classes.card} style={{ maxWidth: '700px' }}>
                {/* Studio Branding */}
                <div style={{
                    textAlign: 'center',
                    marginBottom: '2rem',
                    paddingBottom: '1.5rem',
                    borderBottom: '1px solid var(--color-border)'
                }}>
                    {tenant?.logo ? (
                        <img
                            src={tenant.logo}
                            alt={tenant.name}
                            style={{
                                maxHeight: '60px',
                                maxWidth: '200px',
                                margin: '0 auto 1rem',
                                display: 'block'
                            }}
                        />
                    ) : (
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '0.5rem',
                            marginBottom: '1rem'
                        }}>
                            <Building2 size={32} style={{ color: 'var(--color-primary)' }} />
                        </div>
                    )}
                    <h1 style={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: 'var(--color-text-primary)',
                        marginBottom: '0.25rem'
                    }}>
                        {tenant?.name || 'InkFlow Studio'}
                    </h1>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                        Registrazione Cliente & Firma Consensi
                    </p>
                </div>

                <div className={classes.header}>
                    <h1 className={classes.title}>Benvenuto!</h1>
                    <p className={classes.subtitle}>Compila il form per registrarti e firmare i consensi.</p>
                </div>

                <form onSubmit={handleInitialSubmit} className={classes.form}>
                    {/* Dati Anagrafici */}
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', marginTop: '1rem', color: 'var(--color-text-primary)' }}>Dati Anagrafici</h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className={classes.group}>
                            <label className={classes.label}>Nome *</label>
                            <input required className={classes.input}
                                value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} />
                        </div>
                        <div className={classes.group}>
                            <label className={classes.label}>Cognome *</label>
                            <input required className={classes.input}
                                value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} />
                        </div>
                    </div>

                    <div className={classes.group}>
                        <label className={classes.label}>Codice Fiscale *</label>
                        <input required className={classes.input} maxLength={16} pattern="[A-Z0-9]{16}"
                            placeholder="RSSMRA80A01H501U"
                            value={formData.fiscalCode}
                            onChange={e => setFormData({ ...formData, fiscalCode: e.target.value.toUpperCase() })} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className={classes.group}>
                            <label className={classes.label}>Data di Nascita *</label>
                            <input required type="date" className={classes.input}
                                value={formData.birthDate} onChange={e => setFormData({ ...formData, birthDate: e.target.value })} />
                        </div>
                        <div className={classes.group}>
                            <label className={classes.label}>Luogo di Nascita *</label>
                            <input required className={classes.input} placeholder="Roma"
                                value={formData.birthPlace} onChange={e => setFormData({ ...formData, birthPlace: e.target.value })} />
                        </div>
                    </div>

                    {/* Residenza */}
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', marginTop: '1.5rem', color: 'var(--color-text-primary)' }}>Residenza</h3>

                    <div className={classes.group}>
                        <label className={classes.label}>Indirizzo *</label>
                        <input required className={classes.input} placeholder="Via Roma, 123"
                            value={formData.street} onChange={e => setFormData({ ...formData, street: e.target.value })} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                        <div className={classes.group}>
                            <label className={classes.label}>Città *</label>
                            <input required className={classes.input} placeholder="Milano"
                                value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                        </div>
                        <div className={classes.group}>
                            <label className={classes.label}>CAP *</label>
                            <input required className={classes.input} maxLength={5} pattern="[0-9]{5}" placeholder="20100"
                                value={formData.zip} onChange={e => setFormData({ ...formData, zip: e.target.value })} />
                        </div>
                    </div>

                    <div className={classes.group}>
                        <label className={classes.label}>Comune *</label>
                        <input required className={classes.input} placeholder="Milano"
                            value={formData.municipality} onChange={e => setFormData({ ...formData, municipality: e.target.value })} />
                    </div>

                    {/* Contatti */}
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', marginTop: '1.5rem', color: 'var(--color-text-primary)' }}>Contatti</h3>

                    <div className={classes.group}>
                        <label className={classes.label}>Email *</label>
                        <input required type="email" className={classes.input} placeholder="nome@esempio.it"
                            value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                    </div>

                    <div className={classes.group}>
                        <label className={classes.label}>Numero di Telefono *</label>
                        <input required type="tel" className={classes.input} placeholder="+39 333 1234567"
                            value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                    </div>

                    {/* Preferenze */}
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', marginTop: '1.5rem', color: 'var(--color-text-primary)' }}>Preferenze Stile</h3>

                    <div className={classes.group}>
                        <label className={classes.label} style={{ marginBottom: '0.5rem', display: 'block' }}>Stili Preferiti (opzionale)</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {availableStyles.map(style => (
                                <button
                                    key={style}
                                    type="button"
                                    onClick={() => toggleStyle(style)}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        borderRadius: '999px',
                                        border: '1px solid var(--color-border)',
                                        background: formData.styles.includes(style) ? 'var(--color-primary)' : 'transparent',
                                        color: formData.styles.includes(style) ? 'white' : 'var(--color-text-secondary)',
                                        fontSize: '0.8rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {style}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Consensi */}
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', marginTop: '1.5rem', color: 'var(--color-text-primary)' }}>Consensi & Firma Digitale Touch</h3>

                    {/* Privacy Signature */}
                    <div className={classes.group}>
                        <div style={{
                            padding: '1rem',
                            border: `2px solid ${privacySignature ? '#10b981' : 'var(--color-border)'}`,
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: privacySignature ? '#f0fdf4' : 'var(--color-surface-hover)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                        <ShieldCheck size={20} color={privacySignature ? '#10b981' : '#6b7280'} />
                                        <strong style={{ fontSize: '0.95rem', color: privacySignature ? '#10b981' : 'var(--color-text-primary)' }}>
                                            Informativa Privacy
                                        </strong>
                                    </div>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: '0.25rem 0' }}>
                                        Leggi e firma l'informativa sul trattamento dei dati personali
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => openDocModal('PRIVACY')}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: 'var(--color-primary)',
                                            textDecoration: 'underline',
                                            padding: 0,
                                            cursor: 'pointer',
                                            marginTop: '0.25rem',
                                            fontSize: '0.8rem'
                                        }}
                                    >
                                        📄 Leggi Documento Completo
                                    </button>
                                </div>
                                {privacySignature && (
                                    <div style={{
                                        padding: '0.5rem 1rem',
                                        backgroundColor: '#10b981',
                                        color: 'white',
                                        borderRadius: '999px',
                                        fontSize: '0.8rem',
                                        fontWeight: '600'
                                    }}>
                                        ✓ Firmato
                                    </div>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => handleSignRequest('PRIVACY')}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    backgroundColor: privacySignature ? '#f3f4f6' : 'var(--color-primary)',
                                    color: privacySignature ? '#6b7280' : 'white',
                                    border: 'none',
                                    borderRadius: 'var(--radius-md)',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    fontSize: '0.95rem'
                                }}
                            >
                                <PenTool size={18} />
                                {privacySignature ? 'Firma di Nuovo' : 'Firma con il Dito'}
                            </button>
                        </div>
                    </div>

                    {/* Informed Consent Signature */}
                    <div className={classes.group}>
                        <div style={{
                            padding: '1rem',
                            border: `2px solid ${consentSignature ? '#10b981' : 'var(--color-border)'}`,
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: consentSignature ? '#f0fdf4' : 'var(--color-surface-hover)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                        <ShieldCheck size={20} color={consentSignature ? '#10b981' : '#6b7280'} />
                                        <strong style={{ fontSize: '0.95rem', color: consentSignature ? '#10b981' : 'var(--color-text-primary)' }}>
                                            Consenso Informato
                                        </strong>
                                    </div>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: '0.25rem 0' }}>
                                        Leggi e firma il consenso per le procedure di tatuaggio
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => openDocModal('CONSENT')}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: 'var(--color-primary)',
                                            textDecoration: 'underline',
                                            padding: 0,
                                            cursor: 'pointer',
                                            marginTop: '0.25rem',
                                            fontSize: '0.8rem'
                                        }}
                                    >
                                        📄 Leggi Documento Completo
                                    </button>
                                </div>
                                {consentSignature && (
                                    <div style={{
                                        padding: '0.5rem 1rem',
                                        backgroundColor: '#10b981',
                                        color: 'white',
                                        borderRadius: '999px',
                                        fontSize: '0.8rem',
                                        fontWeight: '600'
                                    }}>
                                        ✓ Firmato
                                    </div>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => handleSignRequest('CONSENT')}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    backgroundColor: consentSignature ? '#f3f4f6' : 'var(--color-primary)',
                                    color: consentSignature ? '#6b7280' : 'white',
                                    border: 'none',
                                    borderRadius: 'var(--radius-md)',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    fontSize: '0.95rem'
                                }}
                            >
                                <PenTool size={18} />
                                {consentSignature ? 'Firma di Nuovo' : 'Firma con il Dito'}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className={classes.button} disabled={loading || !privacySignature || !consentSignature} style={{ marginTop: '2rem' }}>
                        {loading ? 'Elaborazione...' : 'Completa Registrazione'}
                    </button>
                    <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                        ✍️ Firma digitale touch - Firma Elettronica Semplice (FES) conforme al Regolamento eIDAS
                    </p>
                </form>
            </div>

            {/* Document Reading Modal */}
            {viewDoc && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100
                }}>
                    <div style={{
                        backgroundColor: 'var(--color-surface)', padding: '2rem', borderRadius: 'var(--radius-lg)',
                        width: '90%', maxWidth: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column',
                        border: '1px solid var(--color-border)'
                    }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <ShieldCheck size={24} color="var(--color-primary)" />
                            {viewDoc === 'PRIVACY' ? 'Privacy Policy & GDPR' : 'Consenso Informato'}
                        </h2>

                        <div style={{
                            flex: 1, overflowY: 'auto', background: 'var(--color-surface-hover)',
                            padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem',
                            fontSize: '0.9rem', lineHeight: '1.6', border: '1px solid var(--color-border)'
                        }}>
                            {viewDoc === 'PRIVACY' ? (
                                <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'sans-serif' }}>
                                    {getPrivacyText(tenant?.name)}
                                </div>
                            ) : (
                                <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'sans-serif' }}>
                                    {getConsentText({
                                        firstName: formData.firstName,
                                        lastName: formData.lastName,
                                        fiscalCode: formData.fiscalCode,
                                        birthDate: formData.birthDate,
                                        birthPlace: formData.birthPlace,
                                        address: {
                                            street: formData.street,
                                            city: formData.city,
                                            zip: formData.zip,
                                            municipality: formData.municipality,
                                            country: 'Italia'
                                        }
                                    } as any)}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => {
                                if (viewDoc === 'PRIVACY') setFormData({ ...formData, privacyAccepted: true });
                                if (viewDoc === 'CONSENT') setFormData({ ...formData, informedConsentAccepted: true });
                                setViewDoc(null);
                            }}
                            style={{
                                width: '100%', padding: '1rem', backgroundColor: 'var(--color-primary)',
                                color: 'white', border: 'none', borderRadius: 'var(--radius-md)',
                                fontWeight: 'bold', cursor: 'pointer'
                            }}
                        >
                            Ho Letto e Accetto
                        </button>
                        <button
                            onClick={() => setViewDoc(null)}
                            style={{
                                width: '100%', padding: '0.5rem', backgroundColor: 'transparent',
                                color: 'var(--color-text-secondary)', border: 'none', marginTop: '0.5rem',
                                cursor: 'pointer'
                            }}
                        >
                            Chiudi
                        </button>
                    </div>
                </div>
            )}


            {/* Signature Pad Modal */}
            <SignaturePadModal
                isOpen={signatureModalOpen}
                onClose={() => {
                    setSignatureModalOpen(false);
                    setCurrentSignatureType(null);
                }}
                onSave={handleSignatureSave}
                title={currentSignatureType === 'PRIVACY' ? 'Firma Privacy Policy' : 'Firma Consenso Informato'}
            />
        </div>
    );
}
