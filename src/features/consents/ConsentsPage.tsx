import { useState, useEffect } from 'react';
import { storage } from '../../lib/storage';
import { type Client } from '../../types';
import { Search, FileText, CheckCircle, XCircle, PenTool, ShieldCheck, Download } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export function ConsentsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [showSignModal, setShowSignModal] = useState(false);
    const [signType, setSignType] = useState<'PRIVACY' | 'CONSENT'>('PRIVACY');
    const [isSigning, setIsSigning] = useState(false);

    useEffect(() => {
        setClients(storage.getClients());
    }, []);

    const filteredClients = clients.filter(c =>
        (c.firstName + ' ' + c.lastName).toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSignRequest = (client: Client, type: 'PRIVACY' | 'CONSENT') => {
        setSelectedClient(client);
        setSignType(type);
        setShowSignModal(true);
    };

    const confirmSignature = () => {
        if (!selectedClient) return;
        setIsSigning(true);

        setTimeout(() => {
            const updatedClient = { ...selectedClient };
            const timestamp = new Date().toISOString();
            const atpCode = uuidv4().split('-')[0].toUpperCase(); // Short code

            if (signType === 'PRIVACY') {
                updatedClient.privacyPolicyAccepted = true;
                updatedClient.privacyPolicyDate = timestamp;
                // Add signature metadata if we had a dedicated field, for now just boolean
            } else {
                updatedClient.informedConsentAccepted = true;
                updatedClient.informedConsentDate = timestamp;
            }

            storage.saveClient(updatedClient);

            // Refresh local list
            setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));

            setIsSigning(false);
            setShowSignModal(false);
            setSelectedClient(null);
        }, 1500); // Simulate processing
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Gestione Consensi & Privacy</h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                    Cerca un cliente per visualizzare lo stato dei consensi e richiedere la firma digitale.
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
                        background: 'none',
                        border: 'none',
                        fontSize: '1.1rem',
                        width: '100%',
                        color: 'var(--color-text-primary)',
                        outline: 'none'
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
                                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>CF: {client.fiscalCode || 'N/D'}</p>
                                </div>

                                {/* Status Badges */}
                                <div style={{ display: 'flex', gap: '2rem', flex: 1, justifyContent: 'center' }}>
                                    {/* Privacy */}
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', justifyContent: 'center' }}>
                                            <ShieldCheck size={18} color={client.privacyPolicyAccepted ? 'var(--color-success)' : 'var(--color-text-muted)'} />
                                            <span style={{ fontWeight: 600 }}>Privacy Policy</span>
                                        </div>
                                        {client.privacyPolicyAccepted ? (
                                            <div style={{ fontSize: '0.8rem', color: 'var(--color-success)' }}>
                                                Firmato il {new Date(client.privacyPolicyDate!).toLocaleDateString()}
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleSignRequest(client, 'PRIVACY')}
                                                style={{
                                                    background: 'rgba(66, 133, 244, 0.1)', color: '#4285F4',
                                                    border: '1px solid rgba(66, 133, 244, 0.3)',
                                                    padding: '0.25rem 0.75rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem'
                                                }}
                                            >
                                                Richiedi Firma
                                            </button>
                                        )}
                                    </div>

                                    {/* Informed Consent */}
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', justifyContent: 'center' }}>
                                            <FileText size={18} color={client.informedConsentAccepted ? 'var(--color-success)' : 'var(--color-text-muted)'} />
                                            <span style={{ fontWeight: 600 }}>Consenso Informato</span>
                                        </div>
                                        {client.informedConsentAccepted ? (
                                            <div style={{ fontSize: '0.8rem', color: 'var(--color-success)' }}>
                                                Firmato il {new Date(client.informedConsentDate!).toLocaleDateString()}
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleSignRequest(client, 'CONSENT')}
                                                style={{
                                                    background: 'rgba(66, 133, 244, 0.1)', color: '#4285F4',
                                                    border: '1px solid rgba(66, 133, 244, 0.3)',
                                                    padding: '0.25rem 0.75rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem'
                                                }}
                                            >
                                                Richiedi Firma
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button style={{
                                        padding: '0.5rem', borderRadius: '50%', border: '1px solid var(--color-border)',
                                        background: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer'
                                    }} title="Scarica PDF Summary">
                                        <Download size={20} />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                            Nessun cliente trovato con questo nome.
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
                            Firma Digitale: {signType === 'PRIVACY' ? 'Privacy Policy' : 'Consenso Informato'}
                        </h2>

                        <div style={{
                            background: 'var(--color-surface-hover)', padding: '1rem', borderRadius: 'var(--radius-md)',
                            maxHeight: '200px', overflowY: 'auto', marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: '1.5',
                            border: '1px solid var(--color-border)'
                        }}>
                            <p>
                                <strong>CONDIZIONI GENERALI {signType === 'PRIVACY' ? 'DI TRATTAMENTO DATI' : 'DI ESECUZIONE TATUAGGIO'}</strong><br /><br />
                                Il sottoscritto <strong>{selectedClient.firstName} {selectedClient.lastName}</strong>, nato a {selectedClient.birthPlace || '___'} il {selectedClient.birthDate || '___'},<br />
                                dichiara di aver letto e compreso quanto segue:<br /><br />
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                                Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.<br /><br />
                                1. Accetto le procedure igienico-sanitarie.<br />
                                2. Dichiaro di non essere sotto effetto di sostanze.<br />
                                3. Acconsento al trattamento dei dati personali (GDPR 2016/679).<br /><br />
                                Firma Digitale apposta tramite sistema InkFlow CRM.
                            </p>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', padding: '1rem', background: 'rgba(0, 204, 102, 0.1)', borderRadius: 'var(--radius-md)' }}>
                            <input type="checkbox" id="accept" style={{ width: '20px', height: '20px' }} defaultChecked />
                            <label htmlFor="accept" style={{ fontSize: '0.9rem', cursor: 'pointer' }}>
                                Dichiaro di aver letto e compreso i termini e accetto di apporre la mia firma digitale.
                            </label>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={() => setShowSignModal(false)}
                                disabled={isSigning}
                                style={{ flex: 1, padding: '1rem', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)' }}
                            >
                                Annulla
                            </button>
                            <button
                                onClick={confirmSignature}
                                disabled={isSigning}
                                style={{
                                    flex: 1, padding: '1rem', background: 'var(--color-primary)', border: 'none',
                                    borderRadius: 'var(--radius-md)', color: 'white', fontWeight: 'bold'
                                }}
                            >
                                {isSigning ? 'Generazione ATP Code...' : 'Firma Digitalmente'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
