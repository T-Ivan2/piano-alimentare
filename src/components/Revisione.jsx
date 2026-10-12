import { useState } from 'react';
import { supabase } from '../supabase';
import { MEAL_TYPES, MEAL_TINTS, isoDay } from '../dates';
import GestionePiano from './GestionePiano';

const MEASURES = [['peso', 'Peso', 'kg', 'weight'], ['massa_grassa_plica', 'Massa grassa plica', '%', 'fat_plica'], ['massa_grassa_bia', 'Massa grassa BIA', '%', 'fat_bia'],
  ['vita', 'Vita', 'cm', 'waist'], ['fianchi', 'Fianchi', 'cm', 'hips'], ['coscia', 'Coscia', 'cm', 'thigh'], ['braccio', 'Braccio', 'cm', 'arm']];
const fmt = (v) => (v == null ? '–' : Number(v).toLocaleString('it-IT', { maximumFractionDigits: 1 }));
const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();

export default function Revisione({ theme, pending, activePlan, onClose, onDone }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [editing, setEditing] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const r = pending.review || {};
  const m = r.misure || {};
  const old = activePlan?.data;

  const meals = pending.data.giorni.flatMap((g, d) => g.pasti.map((t, i) => ({
    d, i, day: g.nome, text: t, before: old?.giorni?.[d]?.pasti?.[i] ?? '', changed: norm(t) !== norm(old?.giorni?.[d]?.pasti?.[i]),
  })));
  const changed = meals.filter((x) => x.changed);
  const indOld = old?.indicazioni || [];
  const indNew = pending.data.indicazioni || [];

  const confirm = async () => {
    setBusy(true); setMsg('');
    const { error: e1 } = await supabase.from('plans').update({ active: false }).neq('id', pending.id);
    const { error: e2 } = await supabase.from('plans').update({ active: true, status: 'ok' }).eq('id', pending.id);
    if (e1 || e2) { setBusy(false); setMsg('Errore: ' + (e1 || e2).message); return; }
    const rec = { source: 'carlotta', label: m.etichetta || pending.month_label, taken_on: isoDay(new Date()) };
    let any = false;
    MEASURES.forEach(([k, , , col]) => { if (m[k] != null) { rec[col] = m[k]; any = true; } });
    if (any) {
      const { error } = await supabase.from('measurements').insert(rec);
      if (error) setMsg('Piano attivato, ma le misure non sono state salvate: ' + error.message);
    }
    setBusy(false);
    onDone();
  };

  const discard = async () => {
    if (!window.confirm('Scartare questo piano importato?')) return;
    setBusy(true);
    await supabase.from('plans').update({ status: 'discarded' }).eq('id', pending.id);
    setBusy(false);
    onDone();
  };

  if (editing) {
    return <GestionePiano theme={theme} activePlan={activePlan} initialDraft={pending} reviewMode
      onClose={() => setEditing(false)} onChanged={() => { setEditing(false); onDone(true); }} />;
  }

  const card = { background: theme.surf };
  const list = showAll ? meals : changed;

  return (
    <div className="fixed inset-0 z-30 overflow-y-auto" style={{ backgroundColor: theme.bg, color: theme.text }}>
      <div className="max-w-md mx-auto px-4 pt-6 pb-36 flex flex-col gap-4">
        <header className="flex justify-between items-start gap-3">
          <div>
            <p className="m-0 text-sm" style={{ color: theme.muted }}>Dalla mail di Carlotta · {r.filename || 'PDF'}</p>
            <h1 className="m-0 font-display text-[28px] font-semibold leading-tight">Nuovo piano da verificare</h1>
          </div>
          <button onClick={onClose} aria-label="Chiudi" className="w-11 h-11 shrink-0 rounded-full border-0 flex items-center justify-center" style={{ background: theme.surf, color: theme.text }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </header>

        {r.dubbi?.length > 0 && (
          <section className="rounded-[22px] p-4 flex flex-col gap-1.5" style={{ background: '#3A2A1C', border: '1px solid #6A4A2A' }}>
            <h2 className="m-0 text-sm font-bold" style={{ color: '#F5C27A' }}>Da controllare</h2>
            {r.dubbi.map((d, i) => <p key={i} className="m-0 text-sm" style={{ color: '#F3E3CF' }}>• {d}</p>)}
          </section>
        )}

        <section className="theme-card rounded-[22px] p-4 flex flex-col gap-1" style={card}>
          <p className="m-0 font-bold">{pending.title} · {pending.month_label}</p>
          <p className="m-0 text-sm" style={{ color: theme.muted }}>
            {changed.length === 0 ? 'Il menù è identico a quello attuale.' : `${changed.length} pasti cambiati su 28.`}
          </p>
        </section>

        {(indNew.join('|') !== indOld.join('|')) && (
          <section className="theme-card rounded-[22px] p-4 flex flex-col gap-2" style={card}>
            <h2 className="m-0 font-display text-lg font-semibold">Indicazioni del mese</h2>
            {indOld.length > 0 && <p className="m-0 text-sm line-through" style={{ color: theme.muted }}>{indOld.join(' · ')}</p>}
            <p className="m-0 text-sm" style={{ color: theme.acc }}>{indNew.join(' · ') || 'Nessuna'}</p>
          </section>
        )}

        <section className="flex flex-col gap-2.5">
          <div className="flex justify-between items-center">
            <h2 className="m-0 font-display text-lg font-semibold">{showAll ? 'Tutto il menù' : 'Cosa cambia'}</h2>
            <button onClick={() => setShowAll(!showAll)} className="h-9 px-3 rounded-full bg-transparent text-sm font-bold" style={{ border: `1.5px solid ${theme.surf2}`, color: theme.text }}>
              {showAll ? 'Solo modifiche' : 'Vedi tutto'}
            </button>
          </div>
          {list.map((x) => (
            <div key={`${x.d}-${x.i}`} className="theme-card rounded-[20px] px-4 py-3 flex flex-col gap-1" style={card}>
              <p className="m-0 text-[13px] font-bold"><span style={{ color: MEAL_TINTS[x.i] }}>{MEAL_TYPES[x.i]}</span> <span style={{ color: theme.muted }}>· {x.day}</span></p>
              {x.changed && x.before && <p className="m-0 text-sm line-through" style={{ color: theme.muted }}>{x.before}</p>}
              <p className="m-0 text-[15px] leading-snug" style={{ color: x.changed ? theme.text : theme.muted }}>{x.text}</p>
            </div>
          ))}
        </section>

        {MEASURES.some(([k]) => m[k] != null) && (
          <section className="theme-card rounded-[22px] p-4 flex flex-col gap-2" style={card}>
            <h2 className="m-0 font-display text-lg font-semibold">Misure del controllo{m.etichetta ? ` · ${m.etichetta}` : ''}</h2>
            <div className="grid grid-cols-2 gap-2">
              {MEASURES.filter(([k]) => m[k] != null).map(([k, l, u]) => (
                <div key={k} className="rounded-2xl px-3 py-2" style={{ background: theme.surf2 }}>
                  <p className="m-0 text-xs" style={{ color: theme.muted }}>{l}</p>
                  <p className="m-0 font-display text-lg font-semibold">{fmt(m[k])} {u}</p>
                </div>
              ))}
            </div>
            <p className="m-0 text-xs" style={{ color: theme.muted }}>Confermando, vengono aggiunte a Progressi come controllo con Carlotta.</p>
          </section>
        )}

        {msg && <p className="m-0 text-sm" style={{ color: '#F0A08A' }}>{msg}</p>}
      </div>

      <div className="fixed bottom-0 inset-x-0 px-4 pt-3 pb-5" style={{ background: theme.nav, borderTop: `1px solid ${theme.surf2}` }}>
        <div className="max-w-md mx-auto flex flex-col gap-2">
          <button disabled={busy} onClick={confirm} className="theme-action h-12 rounded-full border-0 font-bold" style={{ background: theme.acc, color: theme.onAcc, opacity: busy ? 0.6 : 1 }}>
            Conferma e attiva
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button disabled={busy} onClick={() => setEditing(true)} className="h-11 rounded-full bg-transparent font-bold text-sm" style={{ border: `1.5px solid ${theme.surf2}`, color: theme.text }}>Modifica</button>
            <button disabled={busy} onClick={discard} className="h-11 rounded-full bg-transparent font-bold text-sm" style={{ border: `1.5px solid ${theme.surf2}`, color: '#F0A08A' }}>Scarta</button>
          </div>
        </div>
      </div>
    </div>
  );
}
