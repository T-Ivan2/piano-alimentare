// Promemoria: gira ogni 15 minuti su Netlify e invia le notifiche dei pasti e dell'acqua.
// Variabili d'ambiente richieste su Netlify: SUPABASE_SERVICE_ROLE_KEY, VAPID_PRIVATE_KEY.
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

export const config = { schedule: '*/15 * * * *' };

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://djqmazdtzytxrrofdnbg.supabase.co';
const VAPID_PUBLIC_KEY = 'BPX54OuFPxPYcMeDsiRM4xEL1AtVm0PGb173u9nmfe2VC02hMqFmNom6S-rSpPyuqKDgoTRQfKBkhaJsnDvLTtM';
const MEALS = ['Colazione', 'Pranzo', 'Spuntino', 'Cena'];
const GLASS_ML = 250;
const WINDOW_MIN = 15;

// Ora locale italiana, indipendente dal fuso del server
function romeNow() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', weekday: 'short', hour12: false,
  }).formatToParts(new Date()).map((p) => [p.type, p.value]));
  const wd = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(parts.weekday);
  return { day: `${parts.year}-${parts.month}-${parts.day}`, minutes: (+parts.hour % 24) * 60 + +parts.minute, wd };
}

const toMin = (hhmm) => { const [h, m] = String(hhmm).split(':').map(Number); return h * 60 + (m || 0); };
const due = (hhmm, now) => { const t = toMin(hhmm); return t <= now && t > now - WINDOW_MIN; };

export default async () => {
  const { SUPABASE_SERVICE_ROLE_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
  if (!SUPABASE_SERVICE_ROLE_KEY || !VAPID_PRIVATE_KEY) {
    console.log('Promemoria non configurati: mancano le variabili d\'ambiente.');
    return new Response('not configured', { status: 200 });
  }
  webpush.setVapidDetails(VAPID_SUBJECT || 'mailto:noreply@pianoalimentareivan.netlify.app', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  const now = romeNow();
  const { data: subs } = await db.from('push_subscriptions').select('*').eq('enabled', true);
  if (!subs?.length) return new Response('no subscriptions');
  const { data: plan } = await db.from('plans').select('data').eq('active', true).limit(1).maybeSingle();
  const todayMeals = plan?.data?.giorni?.[now.wd]?.pasti || [];
  const glassesGoal = Math.round((plan?.data?.acqua_ml || 2500) / GLASS_ML);

  let sent = 0;
  for (const s of subs) {
    const r = s.reminders || {};
    const last = { ...(s.last_sent || {}) };
    const { data: log } = await db.from('day_logs').select('meals, water').eq('user_id', s.user_id).eq('day', now.day).maybeSingle();
    const messages = [];

    if (r.pastiOn !== false) {
      MEALS.forEach((name, i) => {
        const key = `pasto${i}`;
        const time = r.pasti?.[i];
        if (!time || !due(time, now.minutes) || last[key] === now.day) return;
        last[key] = now.day;
        if (log?.meals?.[i]) return; // già segnato come fatto
        const text = todayMeals[i];
        if (!text || /pasto libero/i.test(text)) return;
        messages.push({ title: `È ora di ${name.toLowerCase()}`, body: text, tag: key });
      });
    }

    if (r.acquaOn !== false) {
      (r.acqua || []).forEach((time, j) => {
        const key = `acqua${j}`;
        if (!due(time, now.minutes) || last[key] === now.day) return;
        last[key] = now.day;
        const drunk = log?.water || 0;
        if (drunk >= glassesGoal) return;
        const liters = (n) => ((n * GLASS_ML) / 1000).toLocaleString('it-IT');
        messages.push({ title: 'Un bicchiere d\'acqua?', body: `Finora ${liters(drunk)} di ${liters(glassesGoal)} L.`, tag: 'acqua' });
      });
    }

    for (const m of messages) {
      try {
        await webpush.sendNotification(s.subscription, JSON.stringify({ ...m, url: '/' }));
        sent++;
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await db.from('push_subscriptions').update({ enabled: false }).eq('id', s.id); // dispositivo non più valido
        } else {
          console.log('Invio fallito', err.statusCode, err.body);
        }
      }
    }
    if (JSON.stringify(last) !== JSON.stringify(s.last_sent || {})) {
      await db.from('push_subscriptions').update({ last_sent: last }).eq('id', s.id);
    }
  }
  return new Response(`sent ${sent}`);
};
