import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

// Se mancano le chiavi, avvisa in console ma non crashare
if (!import.meta.env.VITE_SUPABASE_URL) {
    console.warn('⚠️ VITE_SUPABASE_URL mancante! Verificare .env.local');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
});

export const testConnection = async () => {
    if (supabaseUrl === 'https://placeholder.supabase.co') return false;
    try {
        const { data, error } = await supabase.from('tenants').select('count');
        if (error) throw error;
        console.log('✅ Supabase connesso!');
        return true;
    } catch (error) {
        console.error('❌ Errore connessione Supabase:', error);
        return false;
    }
};
