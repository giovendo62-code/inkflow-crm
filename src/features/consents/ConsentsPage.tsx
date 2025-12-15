import { useState, useEffect } from 'react';
import { storage } from '../../lib/storage';
import { type Client } from '../../types';
import { Search, FileText, CheckCircle, XCircle, PenTool, ShieldCheck, Download, HeartHandshake, Lock, Phone, Eye } from 'lucide-react';
import { getPrivacyText, getConsentText } from '../../lib/legalText';
import { generateConsentPDF } from '../../lib/pdfGenerator';
import { v4 as uuidv4 } from 'uuid';

export function ConsentsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [showSignModal, setShowSignModal] = useState(false);
    const [signType, setSignType] = useState<'PRIVACY' | 'CONSENT'>('PRIVACY');
    const [isSigning, setIsSigning] = useState(false);

    // OTP State
    const [otpStep, setOtpStep] = useState<'REVIEW' | 'OTP_INPUT'>('REVIEW');
    const [generatedOtp, setGeneratedOtp] = useState('');
    const [inputOtp, setInputOtp] = useState('');

    // PDF Download Handler
    const handleDownloadPDF = async (client: Client, type: 'PRIVACY' | 'CONSENT') => {
        try {
            await generateConsentPDF(client, type);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Errore nella generazione del PDF. Riprova.');
        }
    };

    useEffect(() => {
        const loadClients = async () => {
            const allClients = await storage.getClients();
            setClients(allClients);
        };
        loadClients();
    }, []);

    const filteredClients = clients.filter(c =>
        (c.firstName + ' ' + c.lastName).toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSignRequest = (client: Client, type: 'PRIVACY' | 'CONSENT') => {
        setSelectedClient(client);
        setSignType(type);
        setOtpStep('REVIEW');
        setInputOtp('');
        setGeneratedOtp('');
        setShowSignModal(true);
    };

    const requestOtp = () => {
        if (!selectedClient) return;
        setIsSigning(true);

        // Simulate SMS sending
        setTimeout(() => {
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            setGeneratedOtp(code);
            setOtpStep('OTP_INPUT');
            setIsSigning(false);

            // In production, this would be an SMS API call
            alert(`[SIMULAZIONE SMS]\nInviato a ${selectedClient.phone || 'Numero Sconosciuto'}\n\nIL TUO CODICE ATP È: ${code}`);
        }, 1000);
    };

    const verifyAndSign = async () => {
        if (!selectedClient) return;
        if (inputOtp !== generatedOtp) {
            alert("Codice ATP non valido. Riprova.");
            return;
        }

        setIsSigning(true);
        const updatedClient = { ...selectedClient };
        const timestamp = new Date().toISOString();

        if (signType === 'PRIVACY') {
            updatedClient.privacyPolicyAccepted = true;
            updatedClient.privacyPolicyDate = timestamp;
        } else {
            updatedClient.informedConsentAccepted = true;
            updatedClient.informedConsentDate = timestamp;
        }

        try {
            await storage.saveClient(updatedClient);

            // Refresh local list
            setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));

            setIsSigning(false);
            setShowSignModal(false);
            setSelectedClient(null);
            alert("Documento firmato con successo!");
        } catch (error) {
            console.error("Failed to save consent:", error);
            alert("Errore salvataggio consenso");
            setIsSigning(false);
        }
    };

    const getDocTitle = () => {
        switch (signType) {
            case 'PRIVACY': return 'Privacy Policy & GDPR';
            case 'CONSENT': return 'Consenso Informato';
        }
    };

    const getDocContent = () => {
        if (!selectedClient) return null;

        const style = { whiteSpace: 'pre-wrap', fontFamily: 'sans-serif', lineHeight: '1.6' };

        if (signType === 'PRIVACY') {
            return <div style={style}>{getPrivacyText('InkFlow Studio')}</div>;
        }

        if (signType === 'CONSENT') {
            return <div style={style}>{getConsentText(selectedClient)}</div>;
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Gestione Consensi & Privacy</h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                    Visualizza moduli e richiedi firma digitale tramite Codice ATP (SMS).
                </p>
            </div>

            {/* Search Bar */}
            <div style={{
                background: 'var(--color-surface)',
                padding: '1.5rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                marginBottom: '2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
            }}>
                <Search color="var(--color-text-muted)" />
                <input
                    type="text"
                    placeholder="Cerca cliente per nome, email o telefono..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        background: 'none', border: 'none', fontSize: '1.1rem', width: '100%',
                        color: 'var(--color-text-primary)', outline: 'none'
                    }}
                />
            </div>

            {/* Results */}
            {searchTerm && (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {filteredClients.length > 0 ? (
                        filteredClients.map(client => (
                            <div key={client.id} style={{
                                background: 'var(--color-surface)',
                                padding: '1.5rem',
                                borderRadius: 'var(--radius-lg)',
                                border: '1px solid var(--color-border)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                flexWrap: 'wrap',
                                gap: '1rem'
                            }}>
                                <div style={{ minWidth: '200px' }}>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: '600' }}>{client.firstName} {client.lastName}</h3>
                                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>{client.email}</p>
                                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>{client.phone || 'No telefono'}</p>
                                </div>

                                {/* Status Badges */}
                                <div style={{ display: 'flex', gap: '1.5rem', flex: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                                    {/* Privacy */}
                                    <ConsentBadge
                                        title="Privacy"
                                        accepted={client.privacyPolicyAccepted}
                                        date={client.privacyPolicyDate}
                                        icon={<ShieldCheck size={18} />}
                                        onSign={() => handleSignRequest(client, 'PRIVACY')}
                                        onDownload={client.privacyPolicyAccepted ? () => handleDownloadPDF(client, 'PRIVACY') : undefined}
                                    />
                                    {/* Consent */}
                                    <ConsentBadge
                                        title="Consenso"
                                        accepted={client.informedConsentAccepted}
                                        date={client.informedConsentDate}
                                        icon={<FileText size={18} />}
                                        onSign={() => handleSignRequest(client, 'CONSENT')}
                                        onDownload={client.informedConsentAccepted ? () => handleDownloadPDF(client, 'CONSENT') : undefined}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button style={{
                                        padding: '0.5rem', borderRadius: '50%', border: '1px solid var(--color-border)',
                                        background: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer'
                                    }} title="Scarica Riepilogo PDF">
                                        <Download size={20} />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                            Nessun cliente trovato.
                        </div>
                    )}
                </div>
            )}

            {!searchTerm && (
                <div style={{ textAlign: 'center', marginTop: '4rem', opacity: 0.5 }}>
                    <Search size={48} />
                    <p>Inizia a digitare per cercare un cliente</p>
                </div>
            )}

            {/* Signature Modal */}
            {showSignModal && selectedClient && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{
                        background: 'var(--color-surface)', width: '100%', maxWidth: '600px',
                        padding: '2rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)'
                    }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <PenTool size={24} color="var(--color-primary)" />
                            {getDocTitle()}
                        </h2>

                        <div style={{
                            background: 'var(--color-surface-hover)', padding: '1.5rem', borderRadius: 'var(--radius-md)',
                            maxHeight: '30vh', overflowY: 'auto', marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: '1.6',
                            border: '1px solid var(--color-border)'
                        }}>
                            {getDocContent()}
                        </div>

                        {(signType === 'PRIVACY' ? selectedClient.privacyPolicyAccepted : selectedClient.informedConsentAccepted) ? (
                            <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(0, 200, 81, 0.1)', border: '1px solid #00C851', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                                <CheckCircle size={32} color="#00C851" style={{ marginBottom: '0.5rem' }} />
                                <h3 style={{ color: '#00C851', marginBottom: '0.5rem' }}>Documento Firmato Digitalmente</h3>
                                <p style={{ color: 'var(--color-text-primary)' }}>
                                    Firmato il: {new Date(signType === 'PRIVACY' ? selectedClient.privacyPolicyDate! : selectedClient.informedConsentDate!).toLocaleString()}
                                </p>
                                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
                                    Identità verificata tramite Codice ATP (SMS) inviato a {selectedClient.phone}
                                </p>
                            </div>
                        ) : (
                            otpStep === 'REVIEW' && (
                                <div style={{ marginTop: '1rem' }}>
                                    <p style={{ marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>
                                        Per firmare digitalmente questo documento, verrà inviato un codice ATP (One-Time Password) al numero:
                                        <br /><strong>{selectedClient.phone || 'Numero mancante!'}</strong>
                                    </p>
                                    <button
                                        onClick={requestOtp}
                                        disabled={!selectedClient.phone || isSigning}
                                        style={{
                                            width: '100%', padding: '1rem',
                                            background: 'var(--color-primary)', color: 'white',
                                            border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 'bold',
                                            cursor: (!selectedClient.phone || isSigning) ? 'not-allowed' : 'pointer',
                                            opacity: (!selectedClient.phone || isSigning) ? 0.6 : 1
                                        }}
                                    >
                                        {isSigning ? 'Invio in corso...' : 'Invia Codice ATP via SMS'}
                                    </button>
                                    {!selectedClient.phone && (
                                        <p style={{ color: '#ff4444', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                                            ⚠️ Il cliente non ha un numero di telefono salvato. Modifica l'anagrafica.
                                        </p>
                                    )}
                                </div>
                            )
                        )}

                        {otpStep === 'OTP_INPUT' && (
                            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <Lock size={32} color="var(--color-primary)" style={{ marginBottom: '0.5rem' }} />
                                    <p style={{ fontWeight: 'bold' }}>Inserisci il codice ricevuto via SMS</p>
                                </div>

                                <input
                                    type="text"
                                    maxLength={6}
                                    value={inputOtp}
                                    onChange={(e) => setInputOtp(e.target.value.toUpperCase())}
                                    placeholder="000000"
                                    style={{
                                        fontSize: '2rem', letterSpacing: '0.5rem', textAlign: 'center',
                                        width: '200px', padding: '0.5rem', borderRadius: 'var(--radius-md)',
                                        border: '2px solid var(--color-primary)', outline: 'none',
                                        marginBottom: '1.5rem', backgroundColor: 'var(--color-background)',
                                        color: 'var(--color-text-primary)'
                                    }}
                                />

                                <button
                                    onClick={verifyAndSign}
                                    disabled={inputOtp.length < 6 || isSigning}
                                    style={{
                                        width: '100%', padding: '1rem',
                                        background: '#00C851', color: 'white',
                                        border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 'bold',
                                        cursor: (inputOtp.length < 6 || isSigning) ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {isSigning ? 'Verifica in corso...' : 'Verifica & Firma'}
                                </button>
                            </div>
                        )}

                        <button
                            onClick={() => setShowSignModal(false)}
                            style={{
                                marginTop: '1rem', width: '100%', padding: '0.75rem',
                                background: 'transparent', border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-md)', color: 'var(--color-text-secondary)',
                                cursor: 'pointer'
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

// Subcomponent for Cleaner UI
function ConsentBadge({
    title,
    accepted,
    date,
    icon,
    onSign,
    onDownload
}: {
    title: string,
    accepted?: boolean,
    date?: string,
    icon: any,
    onSign: () => void,
    onDownload?: () => void
}) {
    return (
        <div style={{ textAlign: 'center', minWidth: '100px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem', justifyContent: 'center', color: accepted ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                {icon}
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{title}</span>
            </div>
            {accepted ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                        onClick={onSign}
                        style={{
                            fontSize: '0.75rem',
                            color: 'var(--color-success)',
                            background: 'rgba(0, 200, 81, 0.05)',
                            border: '1px solid currentColor',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            width: '100%',
                            justifyContent: 'center'
                        }}
                    >
                        <Eye size={12} />
                        Vedi: {new Date(date!).toLocaleDateString()}
                    </button>
                    {onDownload && (
                        <button
                            onClick={onDownload}
                            style={{
                                fontSize: '0.75rem',
                                color: '#4285F4',
                                background: 'rgba(66, 133, 244, 0.1)',
                                border: '1px solid #4285F4',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                width: '100%',
                                justifyContent: 'center'
                            }}
                        >
                            <Download size={12} />
                            Scarica PDF
                        </button>
                    )}
                </div>
            ) : (
                <button
                    onClick={onSign}
                    style={{
                        background: 'rgba(66, 133, 244, 0.1)', color: '#4285F4',
                        border: '1px solid #4285F4',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        margin: '0 auto'
                    }}
                >
                    <PenTool size={12} />
                    Firma Ora
                </button>
            )}
        </div>
    );
}
