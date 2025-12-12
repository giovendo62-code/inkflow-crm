import { useState } from 'react';
import { X, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';
import { storage } from '../../lib/storage';
import { type Client } from '../../types';
import classes from './ClientListPage.module.css';

interface ImportCSVModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface CSVRow {
    [key: string]: string;
}

export function ImportCSVModal({ isOpen, onClose, onSuccess }: ImportCSVModalProps) {
    const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'complete'>('upload');
    const [csvData, setCsvData] = useState<CSVRow[]>([]);
    const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
    const [fieldMapping, setFieldMapping] = useState<{ [key: string]: string }>({});
    const [importedCount, setImportedCount] = useState(0);
    const [errors, setErrors] = useState<string[]>([]);

    // Required and optional fields for mapping
    const requiredFields = [
        { key: 'firstName', label: 'Nome *', required: true },
        { key: 'lastName', label: 'Cognome *', required: true },
        { key: 'email', label: 'Email *', required: true },
        { key: 'phone', label: 'Telefono *', required: true }
    ];

    const optionalFields = [
        { key: 'fiscalCode', label: 'Codice Fiscale' },
        { key: 'birthDate', label: 'Data di Nascita' },
        { key: 'birthPlace', label: 'Luogo di Nascita' },
        { key: 'street', label: 'Indirizzo' },
        { key: 'city', label: 'Città' },
        { key: 'zip', label: 'CAP' },
        { key: 'municipality', label: 'Comune' }
    ];

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.data.length === 0) {
                    alert('Il file CSV è vuoto');
                    return;
                }

                const headers = Object.keys(results.data[0] as CSVRow);
                setCsvHeaders(headers);
                setCsvData(results.data as CSVRow[]);

                // Auto-map common field names
                const autoMapping: { [key: string]: string } = {};
                headers.forEach(header => {
                    const lowerHeader = header.toLowerCase();
                    if (lowerHeader.includes('nome') && !lowerHeader.includes('cognome')) autoMapping['firstName'] = header;
                    if (lowerHeader.includes('cognome')) autoMapping['lastName'] = header;
                    if (lowerHeader.includes('email') || lowerHeader.includes('mail')) autoMapping['email'] = header;
                    if (lowerHeader.includes('telefono') || lowerHeader.includes('phone') || lowerHeader.includes('tel')) autoMapping['phone'] = header;
                    if (lowerHeader.includes('fiscale') || lowerHeader.includes('cf')) autoMapping['fiscalCode'] = header;
                    if (lowerHeader.includes('nascita') && lowerHeader.includes('data')) autoMapping['birthDate'] = header;
                    if (lowerHeader.includes('nascita') && lowerHeader.includes('luogo')) autoMapping['birthPlace'] = header;
                    if (lowerHeader.includes('indirizzo') || lowerHeader.includes('via')) autoMapping['street'] = header;
                    if (lowerHeader.includes('città') || lowerHeader.includes('citta')) autoMapping['city'] = header;
                    if (lowerHeader.includes('cap')) autoMapping['zip'] = header;
                    if (lowerHeader.includes('comune')) autoMapping['municipality'] = header;
                });

                setFieldMapping(autoMapping);
                setStep('mapping');
            },
            error: (error) => {
                alert('Errore nel parsing del CSV: ' + error.message);
            }
        });
    };

    const handleImport = () => {
        const newErrors: string[] = [];
        const importedClients: Client[] = [];

        // Validate required fields are mapped
        const missingRequired = requiredFields.filter(f => !fieldMapping[f.key]);
        if (missingRequired.length > 0) {
            alert(`Campi obbligatori mancanti: ${missingRequired.map(f => f.label).join(', ')}`);
            return;
        }

        csvData.forEach((row, index) => {
            try {
                const firstName = row[fieldMapping.firstName]?.trim();
                const lastName = row[fieldMapping.lastName]?.trim();
                const email = row[fieldMapping.email]?.trim();
                const phone = row[fieldMapping.phone]?.trim();

                if (!firstName || !lastName || !email || !phone) {
                    newErrors.push(`Riga ${index + 1}: Campi obbligatori mancanti`);
                    return;
                }

                const client: Client = {
                    id: uuidv4(),
                    tenantId: 'studio-1',
                    firstName,
                    lastName,
                    email,
                    phone,
                    fiscalCode: fieldMapping.fiscalCode ? row[fieldMapping.fiscalCode]?.trim() : undefined,
                    birthDate: fieldMapping.birthDate ? row[fieldMapping.birthDate]?.trim() : undefined,
                    birthPlace: fieldMapping.birthPlace ? row[fieldMapping.birthPlace]?.trim() : undefined,
                    address: {
                        street: fieldMapping.street ? row[fieldMapping.street]?.trim() || '' : '',
                        city: fieldMapping.city ? row[fieldMapping.city]?.trim() || '' : '',
                        zip: fieldMapping.zip ? row[fieldMapping.zip]?.trim() || '' : '',
                        municipality: fieldMapping.municipality ? row[fieldMapping.municipality]?.trim() : undefined,
                        country: 'Italia'
                    },
                    preferences: {
                        styles: []
                    },
                    consents: {
                        privacy: true,
                        informedConsent: true,
                        privacyDate: new Date().toISOString(),
                        informedConsentDate: new Date().toISOString()
                    },
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                importedClients.push(client);
            } catch (error) {
                newErrors.push(`Riga ${index + 1}: Errore durante l'importazione`);
            }
        });

        // Save all clients
        importedClients.forEach(client => storage.saveClient(client));

        setImportedCount(importedClients.length);
        setErrors(newErrors);
        setStep('complete');
    };

    const handleClose = () => {
        setCsvData([]);
        setCsvHeaders([]);
        setFieldMapping({});
        setStep('upload');
        setImportedCount(0);
        setErrors([]);
        onClose();
    };

    const handleComplete = () => {
        onSuccess();
        handleClose();
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 100, padding: '2rem'
        }}>
            <div style={{
                backgroundColor: 'var(--color-surface)', padding: '2rem', borderRadius: 'var(--radius-lg)',
                width: '100%', maxWidth: '800px', border: '1px solid var(--color-border)',
                maxHeight: '90vh', overflowY: 'auto'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Importa Clienti da CSV</h2>
                    <button onClick={handleClose}><X size={24} /></button>
                </div>

                {/* Step 1: Upload */}
                {step === 'upload' && (
                    <div>
                        <div style={{
                            border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-lg)',
                            padding: '3rem', textAlign: 'center', marginBottom: '1.5rem'
                        }}>
                            <Upload size={48} style={{ margin: '0 auto 1rem', color: 'var(--color-primary)' }} />
                            <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>Carica il tuo file CSV</h3>
                            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                                Esporta i clienti da Google Fogli come CSV e caricali qui
                            </p>
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileUpload}
                                style={{ display: 'none' }}
                                id="csv-upload"
                            />
                            <label htmlFor="csv-upload" className={classes.addBtn} style={{ cursor: 'pointer', display: 'inline-flex' }}>
                                <Upload size={18} />
                                <span>Seleziona File CSV</span>
                            </label>
                        </div>

                        <div style={{ background: 'rgba(66, 133, 244, 0.1)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(66, 133, 244, 0.3)' }}>
                            <h4 style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#4285F4', marginBottom: '0.5rem' }}>
                                💡 Come esportare da Google Fogli
                            </h4>
                            <ol style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', paddingLeft: '1.5rem', margin: 0 }}>
                                <li>Apri il tuo foglio Google</li>
                                <li>File → Scarica → Valori separati da virgola (.csv)</li>
                                <li>Carica il file qui</li>
                            </ol>
                        </div>
                    </div>
                )}

                {/* Step 2: Field Mapping */}
                {step === 'mapping' && (
                    <div>
                        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255, 200, 0, 0.1)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255, 200, 0, 0.3)' }}>
                            <p style={{ fontSize: '0.9rem', color: '#FFC800', margin: 0 }}>
                                <strong>Trovati {csvData.length} record.</strong> Mappa i campi del CSV con i campi del CRM.
                            </p>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--color-primary)' }}>
                                Campi Obbligatori
                            </h3>
                            {requiredFields.map(field => (
                                <div key={field.key} style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                                        {field.label}
                                    </label>
                                    <select
                                        value={fieldMapping[field.key] || ''}
                                        onChange={e => setFieldMapping({ ...fieldMapping, [field.key]: e.target.value })}
                                        style={{
                                            width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)',
                                            border: '1px solid var(--color-border)', background: 'var(--color-surface)',
                                            color: 'var(--color-text-primary)'
                                        }}
                                    >
                                        <option value="">-- Seleziona colonna CSV --</option>
                                        {csvHeaders.map(header => (
                                            <option key={header} value={header}>{header}</option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>
                                Campi Opzionali
                            </h3>
                            {optionalFields.map(field => (
                                <div key={field.key} style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                                        {field.label}
                                    </label>
                                    <select
                                        value={fieldMapping[field.key] || ''}
                                        onChange={e => setFieldMapping({ ...fieldMapping, [field.key]: e.target.value })}
                                        style={{
                                            width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)',
                                            border: '1px solid var(--color-border)', background: 'var(--color-surface)',
                                            color: 'var(--color-text-primary)'
                                        }}
                                    >
                                        <option value="">-- Non mappare --</option>
                                        {csvHeaders.map(header => (
                                            <option key={header} value={header}>{header}</option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button onClick={() => setStep('upload')} style={{
                                flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)', background: 'transparent',
                                color: 'var(--color-text-primary)', cursor: 'pointer'
                            }}>
                                Indietro
                            </button>
                            <button onClick={handleImport} className={classes.addBtn} style={{ flex: 1, justifyContent: 'center' }}>
                                Importa {csvData.length} Clienti
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Complete */}
                {step === 'complete' && (
                    <div style={{ textAlign: 'center' }}>
                        {errors.length === 0 ? (
                            <>
                                <CheckCircle size={64} style={{ color: 'var(--color-success)', margin: '0 auto 1.5rem' }} />
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--color-success)' }}>
                                    Importazione Completata!
                                </h3>
                                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
                                    {importedCount} clienti importati con successo.
                                </p>
                            </>
                        ) : (
                            <>
                                <AlertCircle size={64} style={{ color: '#FFC800', margin: '0 auto 1.5rem' }} />
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#FFC800' }}>
                                    Importazione Parziale
                                </h3>
                                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                                    {importedCount} clienti importati, {errors.length} errori.
                                </p>
                                <div style={{
                                    maxHeight: '200px', overflowY: 'auto', textAlign: 'left',
                                    background: 'rgba(255, 0, 0, 0.1)', padding: '1rem',
                                    borderRadius: 'var(--radius-md)', marginBottom: '2rem'
                                }}>
                                    {errors.map((error, i) => (
                                        <div key={i} style={{ fontSize: '0.85rem', color: 'var(--color-error)', marginBottom: '0.5rem' }}>
                                            • {error}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        <button onClick={handleComplete} className={classes.addBtn} style={{ justifyContent: 'center' }}>
                            Chiudi
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
