import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import classes from './PublicClientForm.module.css';
import { v4 as uuidv4 } from 'uuid';
import { storage } from '../../lib/storage';
import { type Client, type TattooStyle, type Tenant } from '../../types';
import { Building2, ShieldCheck, Lock } from 'lucide-react';
import { sendWelcomeEmail } from '../../lib/email';

export function PublicClientForm() {
    const { tenantId } = useParams<{ tenantId: string }>();

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [tenant, setTenant] = useState<Tenant | null>(null);

    // OTP State
    const [otpModalOpen, setOtpModalOpen] = useState(false);
    const [generatedOtp, setGeneratedOtp] = useState('');
    const [inputOtp, setInputOtp] = useState('');

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

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOtp(otp);

        // Simulate sending SMS/Email
        alert(`🔒 SIMULAZIONE SMS/EMAIL (Codice ATP)\n\nIl tuo codice di firma è: ${otp}`);

        setOtpModalOpen(true);
    };

    const handleVerifyOtp = () => {
        if (inputOtp === generatedOtp) {
            setOtpModalOpen(false);
            finalizeRegistration();
        } else {
            alert('Codice ATP non valido. Riprova.');
        }
    };

    const finalizeRegistration = async () => {
        setLoading(true);

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
                informedConsentDate: new Date().toISOString()
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
                    <p className={classes.subtitle}>Il tuo profilo è stato creato e i consensi sono stati firmati digitalmente tramite codice ATP.</p>
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
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', marginTop: '1.5rem', color: 'var(--color-text-primary)' }}>Consensi & Firma Digitale (ATP)</h3>

                    <div className={classes.group}>
                        <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', cursor: 'pointer' }}>
                            <input type="checkbox" checked={formData.privacyAccepted}
                                onChange={e => setFormData({ ...formData, privacyAccepted: e.target.checked })}
                                style={{ marginTop: '4px' }} />
                            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                Accetto l'<strong>Informativa Privacy</strong> e autorizzo il trattamento dei miei dati personali. *
                            </span>
                        </label>
                    </div>

                    <div className={classes.group}>
                        <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', cursor: 'pointer' }}>
                            <input type="checkbox" checked={formData.informedConsentAccepted}
                                onChange={e => setFormData({ ...formData, informedConsentAccepted: e.target.checked })}
                                style={{ marginTop: '4px' }} />
                            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                Accetto il <strong>Consenso Informato</strong> per le procedure di tatuaggio. *
                            </span>
                        </label>
                    </div>

                    <button type="submit" className={classes.button} disabled={loading} style={{ marginTop: '2rem' }}>
                        {loading ? 'Elaborazione...' : 'Richiedi Codice ATP & Firma'}
                    </button>
                    <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                        Riceverai un codice via SMS/Email per firmare digitalmente.
                    </p>
                </form>
            </div>

            {/* OTP Modal */}
            {otpModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'var(--color-surface)', padding: '2rem', borderRadius: 'var(--radius-lg)',
                        width: '100%', maxWidth: '400px', border: '1px solid var(--color-border)', textAlign: 'center'
                    }}>
                        <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
                            <div style={{ padding: '1rem', borderRadius: '50%', backgroundColor: 'rgba(66, 133, 244, 0.1)' }}>
                                <Lock size={32} color="#4285F4" />
                            </div>
                        </div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Verifica Codice ATP</h2>
                        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            Inserisci il codice di 6 cifre che abbiamo appena inviato a <strong>{formData.phone}</strong>
                        </p>

                        <input
                            type="text"
                            maxLength={6}
                            placeholder="000000"
                            style={{
                                width: '100%', padding: '1rem', fontSize: '1.5rem', textAlign: 'center',
                                letterSpacing: '0.5rem', borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)', marginBottom: '1.5rem',
                                color: 'var(--color-text-primary)', backgroundColor: 'var(--color-background)'
                            }}
                            value={inputOtp}
                            onChange={e => setInputOtp(e.target.value.replace(/[^0-9]/g, ''))}
                        />

                        <button
                            onClick={handleVerifyOtp}
                            style={{
                                width: '100%', padding: '1rem', backgroundColor: 'var(--color-primary)',
                                color: 'white', border: 'none', borderRadius: 'var(--radius-md)',
                                fontWeight: '600', cursor: 'pointer', fontSize: '1rem'
                            }}
                        >
                            Verifica & Firma
                        </button>
                        <button
                            onClick={() => setOtpModalOpen(false)}
                            style={{
                                width: '100%', padding: '0.5rem', backgroundColor: 'transparent',
                                color: 'var(--color-text-muted)', border: 'none', marginTop: '1rem',
                                cursor: 'pointer', fontSize: '0.9rem'
                            }}
                        >
                            Annulla
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
