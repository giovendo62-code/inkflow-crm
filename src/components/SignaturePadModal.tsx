import React, { useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { X, RotateCcw, Check } from 'lucide-react';

interface SignaturePadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (signatureData: string) => void;
    title?: string;
}

export function SignaturePadModal({ isOpen, onClose, onSave, title = "Firma qui" }: SignaturePadModalProps) {
    const sigCanvas = useRef<SignatureCanvas>(null);
    const [isEmpty, setIsEmpty] = React.useState(true);

    useEffect(() => {
        if (isOpen) {
            // Reset on open
            setIsEmpty(true);
            // Lock body scroll
            document.body.style.overflow = 'hidden';
        } else {
            // Unlock body scroll
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleClear = () => {
        sigCanvas.current?.clear();
        setIsEmpty(true);
    };

    const handleSave = () => {
        if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
            const signatureData = sigCanvas.current.toDataURL('image/png');
            onSave(signatureData);
        }
    };

    const handleBegin = () => {
        setIsEmpty(false);
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: '#ffffff',
                zIndex: 10000,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}
        >
            {/* Header */}
            <div
                style={{
                    padding: '1rem',
                    borderBottom: '2px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#f9fafb'
                }}
            >
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                    {title}
                </h2>
                <button
                    onClick={onClose}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#e5e7eb')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                    <X size={24} color="#6b7280" />
                </button>
            </div>

            {/* Instructions */}
            <div
                style={{
                    padding: '1rem',
                    backgroundColor: '#eff6ff',
                    borderBottom: '1px solid #dbeafe',
                    textAlign: 'center'
                }}
            >
                <p style={{ margin: 0, fontSize: '0.95rem', color: '#1e40af', fontWeight: '500' }}>
                    ✍️ Firma con il dito o la penna touch nell'area sottostante
                </p>
            </div>

            {/* Signature Canvas */}
            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#ffffff',
                    padding: '1rem',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        border: '2px dashed #d1d5db',
                        borderRadius: '12px',
                        backgroundColor: '#fafafa',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    {isEmpty && (
                        <div
                            style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                color: '#9ca3af',
                                fontSize: '1.1rem',
                                fontWeight: '500',
                                pointerEvents: 'none',
                                textAlign: 'center',
                                zIndex: 1
                            }}
                        >
                            Firma qui
                        </div>
                    )}
                    <SignatureCanvas
                        ref={sigCanvas}
                        canvasProps={{
                            style: {
                                width: '100%',
                                height: '100%',
                                touchAction: 'none',
                                cursor: 'crosshair'
                            }
                        }}
                        backgroundColor="transparent"
                        penColor="#000000"
                        minWidth={1.5}
                        maxWidth={3}
                        velocityFilterWeight={0.7}
                        onBegin={handleBegin}
                    />
                </div>
            </div>

            {/* Action Buttons */}
            <div
                style={{
                    padding: '1rem',
                    borderTop: '2px solid #e5e7eb',
                    display: 'flex',
                    gap: '0.75rem',
                    backgroundColor: '#f9fafb'
                }}
            >
                <button
                    onClick={handleClear}
                    style={{
                        flex: 1,
                        padding: '1rem',
                        backgroundColor: '#ffffff',
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px',
                        fontWeight: '600',
                        fontSize: '1rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        color: '#6b7280',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                        e.currentTarget.style.borderColor = '#d1d5db';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor = '#ffffff';
                        e.currentTarget.style.borderColor = '#e5e7eb';
                    }}
                >
                    <RotateCcw size={20} />
                    Cancella
                </button>
                <button
                    onClick={handleSave}
                    disabled={isEmpty}
                    style={{
                        flex: 2,
                        padding: '1rem',
                        backgroundColor: isEmpty ? '#d1d5db' : '#10b981',
                        border: 'none',
                        borderRadius: '12px',
                        fontWeight: '600',
                        fontSize: '1rem',
                        cursor: isEmpty ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        color: '#ffffff',
                        transition: 'all 0.2s',
                        opacity: isEmpty ? 0.6 : 1
                    }}
                    onMouseEnter={e => {
                        if (!isEmpty) {
                            e.currentTarget.style.backgroundColor = '#059669';
                        }
                    }}
                    onMouseLeave={e => {
                        if (!isEmpty) {
                            e.currentTarget.style.backgroundColor = '#10b981';
                        }
                    }}
                >
                    <Check size={20} />
                    Conferma Firma
                </button>
            </div>
        </div>
    );
}
