import jsPDF from 'jspdf';
import { Client } from '../types';
import { getPrivacyText, getConsentText } from './legalText';

/**
 * Genera un PDF del consenso firmato con firma digitale embedded
 */
export async function generateConsentPDF(
    client: Client,
    type: 'PRIVACY' | 'CONSENT',
    tenantName: string = 'InkFlow Studio'
): Promise<void> {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - (margin * 2);
    let yPosition = margin;

    // Helper function to add text with word wrap
    const addText = (text: string, fontSize: number = 10, isBold: boolean = false) => {
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');

        const lines = doc.splitTextToSize(text, maxWidth);

        // Check if we need a new page
        if (yPosition + (lines.length * fontSize * 0.35) > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
        }

        doc.text(lines, margin, yPosition);
        yPosition += lines.length * fontSize * 0.35 + 3;
    };

    // Header
    doc.setFillColor(66, 133, 244);
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(tenantName, margin, 15);

    doc.setFontSize(14);
    doc.text(type === 'PRIVACY' ? 'Informativa Privacy' : 'Consenso Informato', margin, 28);

    yPosition = 50;
    doc.setTextColor(0, 0, 0);

    // Client Info
    addText('DATI DEL CLIENTE', 12, true);
    addText(`Nome: ${client.firstName} ${client.lastName}`);
    addText(`Codice Fiscale: ${client.fiscalCode || 'N/A'}`);
    addText(`Data di Nascita: ${client.birthDate || 'N/A'}`);
    addText(`Luogo di Nascita: ${client.birthPlace || 'N/A'}`);

    if (client.address) {
        addText(`Indirizzo: ${client.address.street}, ${client.address.zip} ${client.address.city} (${client.address.municipality || client.address.city})`);
    }

    addText(`Email: ${client.email}`);
    addText(`Telefono: ${client.phone}`);

    yPosition += 5;

    // Document Content
    addText('TESTO DEL DOCUMENTO', 12, true);

    const content = type === 'PRIVACY'
        ? getPrivacyText(tenantName)
        : getConsentText(client);

    // Split content into paragraphs
    const paragraphs = content.split('\n\n');

    for (const paragraph of paragraphs) {
        if (paragraph.trim()) {
            addText(paragraph.trim(), 9);
        }
    }

    yPosition += 10;

    // Signature Section
    if (yPosition > pageHeight - 100) {
        doc.addPage();
        yPosition = margin;
    }

    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    addText('FIRMA DIGITALE', 12, true);

    const signatureDate = type === 'PRIVACY'
        ? client.consents?.privacyDate
        : client.consents?.informedConsentDate;

    const signatureImage = type === 'PRIVACY'
        ? client.consents?.privacySignature
        : client.consents?.informedConsentSignature;

    if (signatureDate) {
        const date = new Date(signatureDate);
        addText(`Data e ora firma: ${date.toLocaleString('it-IT')}`);
    }

    if (client.consents?.signatureDevice) {
        addText(`Dispositivo: ${client.consents.signatureDevice}`);
    }

    if (client.consents?.signatureTimestamp) {
        const timestamp = new Date(client.consents.signatureTimestamp);
        addText(`Timestamp: ${timestamp.toISOString()}`);
    }

    yPosition += 5;

    // Add signature image if available
    if (signatureImage) {
        try {
            // Load image to get original dimensions
            const img = new Image();
            await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = reject;
                img.src = signatureImage;
            });

            // Calculate dimensions maintaining aspect ratio
            const maxSignatureWidth = 100; // Max width in mm
            const maxSignatureHeight = 50; // Max height in mm

            const imgAspectRatio = img.width / img.height;

            let signatureWidth = maxSignatureWidth;
            let signatureHeight = maxSignatureWidth / imgAspectRatio;

            // If height exceeds max, scale down based on height
            if (signatureHeight > maxSignatureHeight) {
                signatureHeight = maxSignatureHeight;
                signatureWidth = maxSignatureHeight * imgAspectRatio;
            }

            // Check if we need a new page for signature
            if (yPosition + signatureHeight > pageHeight - margin) {
                doc.addPage();
                yPosition = margin;
            }

            // Add border around signature
            doc.setDrawColor(0, 0, 0);
            doc.rect(margin, yPosition, signatureWidth, signatureHeight);

            // Add signature image with correct aspect ratio
            doc.addImage(signatureImage, 'PNG', margin + 2, yPosition + 2, signatureWidth - 4, signatureHeight - 4);

            yPosition += signatureHeight + 5;
            addText('Firma del Cliente', 9);
        } catch (error) {
            console.error('Error adding signature image:', error);
            addText('[Firma digitale presente ma non visualizzabile in PDF]', 9);
        }
    } else {
        addText('[Nessuna firma digitale disponibile]', 9);
    }

    // Footer with legal notice
    yPosition = pageHeight - 30;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    const footerText = 'Documento generato automaticamente da InkFlow CRM. Firma Elettronica Semplice (FES) conforme al Regolamento eIDAS (UE) n. 910/2014.';
    const footerLines = doc.splitTextToSize(footerText, maxWidth);
    doc.text(footerLines, margin, yPosition);

    // Save PDF
    const fileName = `${type === 'PRIVACY' ? 'Privacy' : 'Consenso'}_${client.lastName}_${client.firstName}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
}

/**
 * Genera un PDF combinato con entrambi i consensi
 */
export async function generateCombinedConsentsPDF(
    client: Client,
    tenantName: string = 'InkFlow Studio'
): Promise<void> {
    // For combined PDF, we'll create two separate PDFs and let the user download both
    // A true combined PDF would require more complex logic
    await generateConsentPDF(client, 'PRIVACY', tenantName);

    // Small delay to avoid browser blocking multiple downloads
    await new Promise(resolve => setTimeout(resolve, 500));

    await generateConsentPDF(client, 'CONSENT', tenantName);
}
