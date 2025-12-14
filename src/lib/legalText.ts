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
    const birth = client?.birthDate ? `${client.birthDate} a ${client.birthPlace || '___'}` : '___ a ___';
    const cf = client?.fiscalCode || '________________';
    const address = client?.address ? `${client.address.street || ''}, ${client.address.city || ''}` : '___';

    return `
DATI DEL CLIENTE
Nome e Cognome: ${fullName}
Data di Nascita: ${birth}
Codice Fiscale: ${cf}
Indirizzo: ${address}

--------------------------------------------------

# CONSENSO INFORMATO PER TATUAGGIO

**Versione digitale – lettura online e firma con OTP (One Time Password)**
**Aggiornato 2025**

---

Il presente documento costituisce **consenso informato digitale** per l’esecuzione di un tatuaggio.

Il contenuto viene **letto integralmente online** e **accettato mediante firma elettronica semplice tramite codice OTP**, inviato al recapito associato all’account del Cliente all’interno dell’applicazione.

La firma con OTP equivale ad accettazione **libera, consapevole, esplicita e legalmente valida**, ai sensi della normativa vigente.

---

## DICHIARAZIONI DEL CLIENTE

Il Cliente dichiara e conferma quanto segue:

* di essere **maggiorenne (18+)**
* di aver ricevuto informazioni chiare e comprensibili sulla procedura di tatuaggio
* di comprendere che il tatuaggio è una **procedura invasiva** che comporta la perforazione della cute
* di essere consapevole che il tatuaggio è **permanente** e che la sua rimozione è complessa, costosa e non sempre totale

---

## DICHIARAZIONE SANITARIA

Il Cliente dichiara sotto la propria responsabilità:

* di non presentare patologie cutanee attive nell’area da trattare
* di non essere affetto/a da epatite B, epatite C, HIV o altre malattie trasmissibili per via ematica
* di non soffrire di disturbi della coagulazione, diabete non controllato o immunodeficienze
* di non assumere farmaci anticoagulanti o immunosoppressori
* di non essere in stato di gravidanza o allattamento
* di non avere allergie note a lattice, metalli, pigmenti o disinfettanti

Il Cliente si impegna a comunicare **qualsiasi variazione dello stato di salute** prima dell’esecuzione del tatuaggio.

---

## RISCHI E POSSIBILI COMPLICANZE

Il Cliente dichiara di essere stato informato e di accettare che il tatuaggio può comportare:

* dolore, sanguinamento, arrossamento, gonfiore o formazione di croste
* infezioni locali o sistemiche
* reazioni allergiche ai pigmenti o ai materiali utilizzati
* cicatrici, alterazioni cromatiche o risultati estetici non perfettamente prevedibili

---

## CURA POST-TATUAGGIO

Il Cliente dichiara di aver ricevuto istruzioni adeguate sulla corretta cura post-tatuaggio e si impegna a seguirle scrupolosamente.

Eventuali complicazioni derivanti dal **mancato rispetto delle indicazioni post-trattamento** non potranno essere imputate allo Studio o al Tatuatore.

---

## RESPONSABILITÀ

Il Cliente solleva lo Studio e il Tatuatore da ogni responsabilità derivante da:

* dichiarazioni sanitarie non veritiere o incomplete
* reazioni individuali imprevedibili
* mancata osservanza delle istruzioni post-tatuaggio

---

## PRIVACY E TRATTAMENTO DEI DATI

Il Cliente autorizza il trattamento dei dati personali e sanitari associati al proprio profilo digitale, ai sensi del **Regolamento UE 2016/679 (GDPR)**, esclusivamente per finalità amministrative, sanitarie e legali connesse al servizio di tatuaggio.

---

## CONSENSO FINALE E FIRMA DIGITALE

Il Cliente dichiara di aver **letto integralmente** il presente consenso informato e di **accettarne ogni parte senza riserve**.

La sottoscrizione avviene mediante inserimento di **codice OTP univoco**, che costituisce **firma elettronica semplice** e rende il presente documento pienamente valido ed efficace.

☐ **Confermo e firmo digitalmente**

---

**Documento valido senza firma autografa**
`;
};
