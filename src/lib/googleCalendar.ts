
// src/lib/googleCalendar.ts

// NOTE: You must enable the Google Calendar API in your Google Cloud Console
// and create credentials (OAuth Client ID).
// Add VITE_GOOGLE_CLIENT_ID to your .env file.

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const SCOPES = 'https://www.googleapis.com/auth/calendar';

// Load the Google API script dynamically
export const loadGoogleScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        if ((window as any).google && (window as any).google.accounts) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Google GIS script'));
        document.body.appendChild(script);
    });
};

// Initialize Token Client
let tokenClient: any;

export const initGoogleCalendar = async (callback: (response: any) => void) => {
    await loadGoogleScript();

    tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (resp: any) => {
            if (resp.error) {
                console.error("Google Auth Error:", resp);
                return;
            }
            callback(resp);
        },
    });
};

// Trigger Login Popup
export const loginToGoogleCalendar = () => {
    if (tokenClient) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        console.error("Google Token Client not initialized");
    }
};

// Create Event
export const createGoogleCalendarEvent = async (accessToken: string, eventDetails: any) => {
    const calendarId = eventDetails.calendarId || 'primary';
    const event = {
        'summary': eventDetails.title,
        'location': 'InkFlow Studio',
        'description': eventDetails.description,
        'start': {
            'dateTime': eventDetails.startTime, // ISO string
            'timeZone': 'Europe/Rome',
        },
        'end': {
            'dateTime': eventDetails.endTime, // ISO string
            'timeZone': 'Europe/Rome',
        },
        'reminders': {
            'useDefault': false,
            'overrides': [
                { 'method': 'email', 'minutes': 24 * 60 },
                { 'method': 'popup', 'minutes': 30 },
            ],
        },
    };

    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
    });

    if (!response.ok) {
        throw new Error(`Google Calendar API Error: ${response.statusText}`);
    }

    return await response.json();
};

export const listGoogleCalendars = async (accessToken: string) => {
    const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
    });
    if (!response.ok) {
        throw new Error(`Google Calendar API Error: ${response.statusText}`);
    }
    return await response.json(); // returns { items: [{id, summary, ...}] }
};

export const listGoogleCalendarEvents = async (accessToken: string) => {
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=10&orderBy=startTime&singleEvents=true', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
    });
    if (!response.ok) {
        throw new Error(`Google Calendar API Error: ${response.statusText}`);
    }
    return await response.json();
}
