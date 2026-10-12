// La publishable key è pensata per stare nel browser: i dati sono protetti dalle regole RLS del database.
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://djqmazdtzytxrrofdnbg.supabase.co';
export const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable__lbpoC-DAmkBv5GLUobU8Q_PgYUTcnn';

// Chiave pubblica per le notifiche push (quella privata sta solo nelle impostazioni di Netlify)
export const VAPID_PUBLIC_KEY = 'BPX54OuFPxPYcMeDsiRM4xEL1AtVm0PGb173u9nmfe2VC02hMqFmNom6S-rSpPyuqKDgoTRQfKBkhaJsnDvLTtM';
