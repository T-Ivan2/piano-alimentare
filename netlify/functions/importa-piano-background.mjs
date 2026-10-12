// Importa un piano dal PDF di Carlotta: lo legge con Claude, lo salva come bozza da verificare e manda una notifica.
// È una "background function" di Netlify: risponde subito e lavora fino a 15 minuti.
// Chiamata da: lo script di Gmail (header x-import-secret) oppure dall'app (header Authorization con la sessione).
// Variabili d'ambiente: ANTHROPIC_API_KEY, IMPORT_SECRET, SUPABASE_SERVICE_ROLE_KEY, VAPID_PRIVATE_KEY.
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://djqmazdtzytxrrofdnbg.supabase.co';
const VAPID_PUBLIC_KEY = 'BPX54OuFPxPYcMeDsiRM4xEL1AtVm0PGb173u9nmfe2VC02hMqFmNom6S-rSpPyuqKDgoTRQfKBkhaJsnDvLTtM';
const MODEL = process.env.IMPORT_MODEL || 'claude-opus-5-5';
const DAYS = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

const num = { type: ['number', 'null'] };
const SCHEMA = {
  type: 'object',
  properties: {
    mese: { type: 'string', description: 'Etichetta del mese di percorso se ricavabile (es. "Mese 7"), altrimenti stringa vuota' },
    obiettivo: { type: 'string' },
    indicazioni: { type: 'array', items: { type: 'string' }, description: 'Indicazioni mensili, una per voce (es. "Creatina 4 g al giorno")' },
    giorni: {
      type: 'array', minItems: 7, maxItems: 7,
      description: 'Da lunedì a domenica, in ordine',
      items: {
        type: 'object',
        properties: {
          nome: { type: 'string', enum: DAYS },
          pasti: { type: 'array', minItems: 4, maxItems: 4, items: { type: 'string' }, description: 'Colazione, pranzo, spuntino, cena' },
        },
        required: ['nome', 'pasti'],
      },
    },
    consigli: { type: 'array', items: { type: 'string' }, description: 'Indicazioni generali brevi e utili nel quotidiano' },
    acqua_ml: { type: 'integer' },
    spesa: {
      type: 'array',
      description: 'Lista della spesa settimanale calcolata dal menù',
      items: {
        type: 'object',
        properties: {
          gruppo: { type: 'string', enum: ['Proteine', 'Latticini', 'Pane e cereali', 'Frutta e verdura', 'Dispensa'] },
          voci: { type: 'array', items: { type: 'array', minItems: 3, maxItems: 3, items: { type: 'string' } }, description: '[alimento, quantità totale, in quali pasti]' },
        },
        required: ['gruppo', 'voci'],
      },
    },
    misure: {
      type: 'object',
      description: 'Valori attuali del report di composizione corporea (non le variazioni)',
      properties: {
        etichetta: { type: ['string', 'null'] }, peso: num, massa_grassa_plica: num, massa_grassa_bia: num,
        vita: num, fianchi: num, coscia: num, braccio: num,
      },
    },
    storico_peso: { type: 'array', items: { type: 'object', properties: { etichetta: { type: 'string' }, peso: { type: 'number' } }, required: ['etichetta', 'peso'] } },
    dubbi: { type: 'array', items: { type: 'string' }, description: 'Punti illeggibili, ambigui o incoerenti da far controllare' },
  },
  required: ['indicazioni', 'giorni', 'consigli', 'spesa', 'misure', 'dubbi'],
};

const PROMPT = `Questo è il piano alimentare mensile scritto dalla dietista per il suo paziente. Trascrivilo con lo strumento salva_piano.
Regole:
- Riporta i pasti fedelmente, con le grammature esatte. Non inventare e non correggere alimenti o quantità. Puoi solo sistemare spazi e maiuscole (es. "Verdure + 50 g pane + carne 200 g").
- I giorni vanno da lunedì a domenica; i pasti sono sempre colazione, pranzo, spuntino, cena. Un "pasto libero" resta scritto così.
- Indicazioni: solo quelle del mese (in genere sotto "Indicazioni mensili").
- Consigli: riassumi in frasi brevi le indicazioni pratiche ricorrenti (acqua, olio, inversione pranzo/cena, spuntino saltato, pesi a crudo).
- Spesa: somma le quantità della settimana dal menù e indica in quali pasti servono (es. "lun, mer, ven pranzo").
- Misure: prendi i valori attuali del report (il numero tra parentesi accanto alla variazione, il peso dell'ultima barra del grafico). Se un valore non c'è, null.
- Storico peso: tutte le barre del grafico, con la loro etichetta (es. "Mese 1").
- Dubbi: elenca ogni punto che non hai letto con certezza o che sembra incoerente.`;

const json = (code, body) => new Response(JSON.stringify(body), { status: code, headers: { 'content-type': 'application/json' } });

async function readPdf(pdfBase64) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 8000,
      tools: [{ name: 'salva_piano', description: 'Salva il piano alimentare estratto dal PDF', input_schema: SCHEMA }],
      tool_choice: { type: 'tool', name: 'salva_piano' },
      messages: [{ role: 'user', content: [
        { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 } },
        { type: 'text', text: PROMPT },
      ] }],
    }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`API ${res.status}: ${body?.error?.message || JSON.stringify(body)}`);
  const tool = body.content?.find((c) => c.type === 'tool_use');
  if (!tool) throw new Error('Risposta senza piano');
  return { plan: tool.input, usage: body.usage };
}

function problems(p) {
  const out = [];
  if (!Array.isArray(p.giorni) || p.giorni.length !== 7) out.push('i giorni non sono 7');
  else p.giorni.forEach((g, i) => {
    if (!Array.isArray(g.pasti) || g.pasti.length !== 4 || g.pasti.some((m) => !String(m || '').trim())) out.push(`${DAYS[i]}: pasti mancanti`);
  });
  const m = p.misure || {};
  const range = (v, a, b, n) => { if (v != null && (v < a || v > b)) out.push(`${n} fuori scala (${v})`); };
  range(m.peso, 30, 250, 'peso'); range(m.massa_grassa_plica, 3, 70, 'massa grassa plica'); range(m.massa_grassa_bia, 3, 70, 'massa grassa BIA');
  range(m.vita, 40, 200, 'vita'); range(m.fianchi, 50, 200, 'fianchi'); range(m.coscia, 25, 120, 'coscia'); range(m.braccio, 15, 70, 'braccio');
  return out;
}

async function notify(db, title, body) {
  if (!process.env.VAPID_PRIVATE_KEY) return;
  webpush.setVapidDetails('mailto:noreply@pianoalimentareivan.netlify.app', VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
  const { data: subs } = await db.from('push_subscriptions').select('id, subscription').eq('enabled', true);
  for (const s of subs || []) {
    try { await webpush.sendNotification(s.subscription, JSON.stringify({ title, body, tag: 'nuovo-piano', url: '/' })); }
    catch (err) { if (err.statusCode === 404 || err.statusCode === 410) await db.from('push_subscriptions').update({ enabled: false }).eq('id', s.id); }
  }
}

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'POST only' });
  const { ANTHROPIC_API_KEY, IMPORT_SECRET, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!ANTHROPIC_API_KEY || !SUPABASE_SERVICE_ROLE_KEY) { console.log('Import non configurato'); return json(500, { error: 'not configured' }); }
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  // Autorizzazione: segreto dello script Gmail oppure sessione dell'app
  const secretOk = IMPORT_SECRET && req.headers.get('x-import-secret') === IMPORT_SECRET;
  let userOk = false;
  const token = (req.headers.get('authorization') || '').replace(/^Bearer /, '');
  if (!secretOk && token) { const { data } = await db.auth.getUser(token); userOk = !!data?.user; }
  if (!secretOk && !userOk) { console.log('Import rifiutato: non autorizzato'); return json(401, { error: 'unauthorized' }); }

  let payload;
  try { payload = await req.json(); } catch { return json(400, { error: 'bad json' }); }
  const { pdf_base64: pdf, filename = 'piano.pdf', ref = null } = payload;
  if (!pdf) return json(400, { error: 'missing pdf' });

  if (ref) {
    const { data: dup } = await db.from('plans').select('id').eq('source_ref', ref).maybeSingle();
    if (dup) { console.log('Mail già importata', ref); return json(200, { skipped: true }); }
  }

  try {
    let { plan, usage } = await readPdf(pdf);
    let issues = problems(plan);
    if (issues.length) {
      console.log('Primo tentativo con problemi, riprovo:', issues);
      ({ plan, usage } = await readPdf(pdf));
      issues = problems(plan);
    }
    console.log('Token usati', usage);

    const { data: active } = await db.from('plans').select('*').eq('active', true).limit(1).maybeSingle();
    const today = new Date().toLocaleDateString('it-IT', { month: 'long', year: 'numeric', timeZone: 'Europe/Rome' });
    const data = {
      indicazioni: plan.indicazioni || [],
      giorni: plan.giorni.map((g, i) => ({ nome: DAYS[i], pasti: g.pasti.map((m) => String(m).trim()) })),
      consigli: plan.consigli?.length ? plan.consigli : active?.data?.consigli || [],
      acqua_ml: plan.acqua_ml || active?.data?.acqua_ml || 2500,
      spesa: plan.spesa?.length ? plan.spesa : active?.data?.spesa || [],
      sostituzioni: active?.data?.sostituzioni || [],
    };
    const { error } = await db.from('plans').insert({
      title: `Piano di ${today}`,
      month_label: plan.mese || 'Nuovo mese',
      goal: plan.obiettivo || active?.goal || '',
      active: false,
      status: 'review',
      source_ref: ref,
      data,
      review: { filename, misure: plan.misure || {}, storico_peso: plan.storico_peso || [], dubbi: [...(plan.dubbi || []), ...issues], importato_il: new Date().toISOString() },
    });
    if (error) throw new Error('Salvataggio: ' + error.message);

    await notify(db, 'Nuovo piano di Carlotta', issues.length ? 'Pronto da verificare: ci sono alcuni punti da controllare.' : 'Pronto da verificare e confermare.');
    console.log('Piano importato', filename);
    return json(200, { ok: true });
  } catch (err) {
    console.log('Import fallito:', err.message);
    await notify(db, 'Import del piano non riuscito', 'Non sono riuscito a leggere il PDF. Puoi inserirlo a mano da Gestisci il piano.');
    return json(500, { error: err.message });
  }
};
