import { type Client } from '../types';

export const getPrivacyText = (tenantName: string = 'Lo Studio') => `
INFORMATIVA SUL TRATTAMENTO DEI DATI PERSONALI (Art. 13 GDPR 679/2016)

Gentile Cliente,
ai sensi del Regolamento UE 2016/679 (GDPR), ${tenantName} in qualità di Titolare del Trattamento, ti informa che i tuoi dati personali saranno trattati nel rispetto della normativa vigente.

1. TITOLARE DEL TRATTAMENTO
Il titolare è ${tenantName}, presso la sede operativa indicata.

2. FINALITÀ DEL TRATTAMENTO
I dati (anagrafici, fiscali e relativi allo stato di salute necessari per l'esecuzione del servizio) sono raccolti per:
- Gestione degli appuntamenti e della scheda cliente.
- Adempimenti fiscali e amministrativi.
- Tutela della salute e sicurezza durante l'esecuzione del servizio (tatuaggio/piercing).
- Comunicazioni promozionali (solo se esplicitamente acconsentito).

3. BASE GIURIDICA
Il trattamento è necessario per l'esecuzione del contratto di prestazione d'opera e per l'adempimento di obblighi legali e sanitari.

4. CONSERVAZIONE DEI DATI
I dati saranno conservati per il tempo necessario all'espletamento delle finalità amministrative (10 anni) e sanitarie.

5. I TUOI DIRITTI
Hai diritto di chiedere l'accesso, la rettifica, la cancellazione dei dati o la limitazione del trattamento, nonché di opporti al trattamento e di proporre reclamo all'autorità di controllo.
`;

export const getConsentText = (client: Partial<Client> | null) => {
    const fullName = client && client.firstName ? `${client.firstName} ${client.lastName}`.trim() : 'IL CLIENTE';
    const birth = client?.birthDate ? `nato/a a ${client.birthPlace || '___'} il ${client.birthDate}` : 'nato/a a ___ il ___';
    const cf = client?.fiscalCode || '________________';
    const address = client?.address ? `${client.address.street || ''}, ${client.address.city || ''}` : '___';

    return `
CONSENSO INFORMATO ALL'ESECUZIONE DI TATUAGGIO / PIERCING

Il/La sottoscritto/a: ${fullName}
${birth}
Codice Fiscale: ${cf}
Residente in: ${address}

DICHIARA DI ESSERE MAGGIORENNE E NEL PIENO POSSESSO DELLE PROPRIE FACOLTÀ.

PREMESSO CHE
- Sono stato/a esaustivamente informato/a sulla natura dell'intervento di tatuaggio/piercing, che consiste nell'introduzione nella cute di pigmenti o monili mediante aghi sterili monouso.
- Sono consapevole che il tatuaggio è una modificazione permanente della pelle e che la sua rimozione può essere difficile, costosa e lasciare cicatrici.

DICHIARO SOTTO LA MIA RESPONSABILITÀ
1. SALUTE FISICA: Di non essere affetto/a da emofilia, epilessia, malattie infettive trasmissibili (Epatite A/B/C, HIV), malattie della pelle nella zona da trattare (psoriasi, dermatiti), diabete non compensato o patologie cardiache gravi.
2. ALLERGIE: Di non avere allergie note ai componenti dei pigmenti, al lattice, ai metalli (nichel) o a creme/saponi medicali.
3. STATO FISIOLOGICO: Di non essere in stato di gravidanza o allattamento.
4. CONDIZIONI PSICOFISICHE: Di non essere sotto l'effetto di alcool, droghe o farmaci che alterano la capacità di intendere o la coagulazione del sangue.

MI IMPEGNO A
- Seguire scrupolosamente le istruzioni "Aftercare" (cura post-tatuaggio) fornite dall'operatore.
- Sollevare lo studio e l'artista da ogni responsabilità civile e penale per complicazioni derivanti da mia negligenza nella cura, da cause non imputabili all'artista o da informazioni false/omesse in questo modulo.

ACCONSENTO
All'esecuzione del tatuaggio/piercing secondo il disegno/progetto concordato.

Letto, confermato e sottoscritto.
`;
};
