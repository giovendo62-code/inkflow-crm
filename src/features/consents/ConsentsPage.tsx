import { useState, useEffect } from 'react';
import { storage } from '../../lib/storage';
import { type Client } from '../../types';
import { Search, FileText, CheckCircle, XCircle, PenTool, ShieldCheck, Download, HeartHandshake, Lock, Phone } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export function ConsentsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [showSignModal, setShowSignModal] = useState(false);
    const [signType, setSignType] = useState<'PRIVACY' | 'CONSENT' | 'CARE'>('PRIVACY');
    const [isSigning, setIsSigning] = useState(false);

    // OTP State
    const [otpStep, setOtpStep] = useState<'REVIEW' | 'OTP_INPUT'>('REVIEW');
    const [generatedOtp, setGeneratedOtp] = useState('');
    const [inputOtp, setInputOtp] = useState('');

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

    const handleSignRequest = (client: Client, type: 'PRIVACY' | 'CONSENT' | 'CARE') => {
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
        } else if (signType === 'CONSENT') {
            updatedClient.informedConsentAccepted = true;
            updatedClient.informedConsentDate = timestamp;
        } else {
            updatedClient.tattooCareAccepted = true;
            updatedClient.tattooCareDate = timestamp;
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
            case 'CARE': return 'Cura del Tatuaggio (Aftercare)';
        }
    };

    const getDocContent = () => {
        switch (signType) {
            case 'PRIVACY':
                return (
                    <>
                        <p><strong>INFORMATIVA SUL TRATTAMENTO DEI DATI PERSONALI (Art. 13 GDPR 679/2016)</strong></p>
                        <p>Il sottoscritto/a, acquisite le informazioni fornite dal titolare del trattamento...</p>
                        {/* More Lorem Ipsum or real text */}
                        <p>Dichiara di aver ricevuto l'informativa e acconsente al trattamento dei propri dati personali per le finalità indicate.</p>
                    </>
                );
            case 'CONSENT':
                return (
                    <>
                        <p><strong>CONSENSO INFORMATO ALL'ESECUZIONE DI TATUAGGIO / PIERCING</strong></p>
                        <p>Il sottoscritto dichiara di essere maggiorenne e nel pieno possesso delle proprie facoltà mentali...</p>
                        <ul>
                            <li>Non sono sotto l'effetto di alcool o droghe.</li>
                            <li>Non soffro di patologie cardiache, epilessia, emofilia...</li>
                            <li>Sono consapevole che il tatuaggio è indelebile.</li>
                        </ul>
                    </>
                );
            case 'CARE':
                return (
                    <>
                        <p><strong>ISTRUZIONI PER LA CURA DEL TATUAGGIO (AFTERCARE)</strong></p>
                        <p>Per garantire una corretta guarigione, seguire attentamente le seguenti istruzioni:</p>
                        <ol>
                            <li>Rimuovere la pellicola protettiva dopo 2-3 ore.</li>
                            <li>Lavare delicatamente con sapone neutro e acqua tiepida.</li>
                            <li>Asciugare tamponando con carta assorbente pulita.</li>
                            <li>Applicare uno strato sottile di crema specifica 3-4 volte al giorno.</li>
                            <li>Non grattare le crosticine. Evitare sole, mare e piscina per 15 giorni.</li>
                        </ol>
                    </>
                );
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
                                    />
                                    {/* Consent */}
                                    <ConsentBadge
                                        title="Consenso"
                                        accepted={client.informedConsentAccepted}
                                        date={client.informedConsentDate}
                                        icon={<FileText size={18} />}
                                        onSign={() => handleSignRequest(client, 'CONSENT')}
                                    />
                                    {/* Care */}
                                    <ConsentBadge
                                        title="Cura Tattoo"
                                        accepted={client.tattooCareAccepted}
                                        date={client.tattooCareDate}
                                        icon={<HeartHandshake size={18} />}
                                        onSign={() => handleSignRequest(client, 'CARE')}
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

                        {otpStep === 'REVIEW' && (
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
function ConsentBadge({ title, accepted, date, icon, onSign }: { title: string, accepted?: boolean, date?: string, icon: any, onSign: () => void }) {
    return (
        <div style={{ textAlign: 'center', minWidth: '100px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem', justifyContent: 'center', color: accepted ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                {icon}
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{title}</span>
            </div>
            {accepted ? (
                <div style={{ fontSize: '0.75rem', color: 'var(--color-success)' }}>
                    Firma: {new Date(date!).toLocaleDateString()}
                </div>
            ) : (
                <button
                    onClick={onSign}
                    style={{
                        background: 'rgba(66, 133, 244, 0.1)', color: '#4285F4',
                        border: '1px solid rgba(66, 133, 244, 0.3)',
                        padding: '0.25rem 0.75rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem'
                    }}
                >
                    Firma Ora
                </button>
            )}
        </div>
    );
}
