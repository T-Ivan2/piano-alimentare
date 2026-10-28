import { useState } from 'react';
import { supabase } from '../supabase';
import { MEAL_TYPES, isoDay } from '../dates';
import GestionePiano from './GestionePiano';
import Sheet, { outlineStyle, primaryStyle } from './Sheet';

const MEASURES = [['peso', 'Peso', 'kg', 'weight'], ['massa_grassa_plica', 'Massa grassa plica', '%', 'fat_plica'], ['massa_grassa_bia', 'Massa grassa BIA', '%', 'fat_bia'],
  ['vita', 'Vita', 'cm', 'waist'], ['fianchi', 'Fianchi', 'cm', 'hips'], ['coscia', 'Coscia', 'cm', 'thigh'], ['braccio', 'Braccio', 'cm', 'arm']];
const fmt = (v) => (v == null ? '–' : Number(v).toLocaleString('it-IT', { maximumFractionDigits: 1 }));
const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();

export default function Revisione({ theme, pending, activePlan, onClose, onDone }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [editing, setEditing] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const [activated, setActivated] = useState(false); // piano attivo ma misure non salvate: si chiude solo a mano
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
      // il piano è già attivo: si resta qui per mostrare l'errore delle misure
      if (error) { setBusy(false); setActivated(true); setMsg('Piano attivato, ma le misure non sono state salvate: ' + error.message + '. Puoi aggiungerle da Progressi.'); return; }
    }
    setBusy(false);
    onDone();
  };

  // Scarto in due tocchi, senza finestre: il primo chiede conferma nel pannello
  const discard = async () => {
    setDiscarding(false);
    setBusy(true);
    await supabase.from('plans').update({ status: 'discarded' }).eq('id', pending.id);
    setBusy(false);
    onDone();
  };

  if (editing) {
    return <GestionePiano theme={theme} activePlan={activePlan} initialDraft={pending} reviewMode
      onClose={() => setEditing(false)} onChanged={() => { setEditing(false); onDone(true); }} />;
  }

  const list = showAll ? meals : changed;

  const footer = (
    <div className="flex flex-col gap-2">
      {discarding && (
        <div role="alert" className="flex items-center justify-between gap-2 pl-3 py-1 pr-1" style={{ border: `1px solid ${theme.danger}` }}>
          <span className="text-[15px]">Scartare questo piano?</span>
          <span className="flex gap-1 shrink-0">
            <button onClick={() => setDiscarding(false)} className="label min-h-11 px-3" style={outlineStyle(theme)}>No</button>
            <button disabled={busy} onClick={discard} className="label min-h-11 px-3" style={outlineStyle(theme, theme.danger)}>Scarta</button>
          </span>
        </div>
      )}
      <div className="flex items-center gap-2">
        <button disabled={busy} onClick={() => setEditing(true)} className="label min-h-12 px-2.5" style={outlineStyle(theme)}>Modifica</button>
        <button disabled={busy} onClick={() => setDiscarding(true)} className="label min-h-12 px-2.5" style={outlineStyle(theme, theme.danger)}>Scarta</button>
        <button disabled={busy} onClick={confirm} className="cut-br theme-action label min-h-12 px-3 text-[15px] whitespace-nowrap ml-auto disabled:opacity-50" style={primaryStyle(theme)}>
          {busy ? 'Attivo…' : 'Conferma e attiva'}
        </button>
      </div>
    </div>
  );

  return (
    <Sheet theme={theme} variant="full" title="Nuovo piano da verificare" subtitle={`Dalla mail di Carlotta · ${r.filename || 'PDF'}`} onClose={activated ? () => onDone() : onClose} footer={activated ? null : footer}>
      {msg && <p role="alert" className="m-0 mb-4 text-[15px]" style={{ color: theme.danger }}>{msg}</p>}

      <p className="m-0 font-display font-bold text-[22px] leading-tight">{pending.title} · {pending.month_label}</p>
      <p className="m-0 mt-1 text-[16px]" style={{ color: theme.muted }}>
        {changed.length === 0 ? 'Il menù è identico a quello attuale.' : `${changed.length} pasti cambiati su ${meals.length}.`}
      </p>

      {r.dubbi?.length > 0 && (
        <section className="mt-5 px-3 py-3" style={{ border: `1px solid ${theme.acc}` }} aria-labelledby="dubbi">
          <h3 id="dubbi" className="label m-0" style={{ color: theme.acc }}>Da controllare</h3>
          <ul className="m-0 mt-1.5 pl-5 flex flex-col gap-1 text-[15px] list-[square]">
            {r.dubbi.map((d, i) => <li key={i}>{d}</li>)}
          </ul>
        </section>
      )}

      {(indNew.join('|') !== indOld.join('|')) && (
        <section className="mt-6" aria-labelledby="indicazioni">
          <h3 id="indicazioni" className="label m-0 pb-2" style={{ color: theme.muted, borderBottom: `1px solid ${theme.line}` }}>Consigli del mese</h3>
          {indOld.length > 0 && <p className="m-0 mt-2 text-[15px] line-through" style={{ color: theme.muted }}>{indOld.join(' · ')}</p>}
          <p className="m-0 mt-1 text-[16px]">{indNew.join(' · ') || 'Nessuno'}</p>
        </section>
      )}

      <section className="mt-6" aria-labelledby="cambi">
        <div className="flex justify-between items-center gap-3 pb-2" style={{ borderBottom: `1px solid ${theme.line}` }}>
          <h3 id="cambi" className="label m-0" style={{ color: theme.muted }}>{showAll ? 'Tutto il menù' : 'Cosa cambia'}</h3>
          <button onClick={() => setShowAll(!showAll)} aria-pressed={showAll} className="label min-h-11 px-3" style={outlineStyle(theme)}>
            {showAll ? 'Solo modifiche' : 'Vedi tutto'}
          </button>
        </div>
        {list.map((x) => (
          <div key={`${x.d}-${x.i}`} className="py-3" style={{ borderBottom: `1px solid ${theme.line}` }}>
            <p className="m-0 flex justify-between gap-3">
              <span className="font-display font-bold uppercase tracking-wide text-[19px]" style={{ color: x.changed ? theme.text : theme.muted }}>{MEAL_TYPES[x.i] || `Pasto ${x.i + 1}`}</span>
              <span className="label" style={{ color: theme.muted }}>{x.day}</span>
            </p>
            {x.changed && x.before && <p className="m-0 mt-1 text-[14px] line-through" style={{ color: theme.muted }}>{x.before}</p>}
            <p className="m-0 mt-1 text-[16px] leading-snug" style={{ color: x.changed ? theme.text : theme.muted }}>{x.text}</p>
          </div>
        ))}
      </section>

      {MEASURES.some(([k]) => m[k] != null) && (
        <section className="mt-6" aria-labelledby="misure-controllo">
          <h3 id="misure-controllo" className="label m-0 pb-2" style={{ color: theme.muted, borderBottom: `1px solid ${theme.line}` }}>
            Misure del controllo{m.etichetta ? ` · ${m.etichetta}` : ''}
          </h3>
          {MEASURES.filter(([k]) => m[k] != null).map(([k, l, u]) => (
            <p key={k} className="m-0 py-2 flex justify-between gap-3" style={{ borderBottom: `1px solid ${theme.line}` }}>
              <span className="text-[16px]">{l}</span>
              <span className="font-display font-semibold text-[19px]">{fmt(m[k])} {u}</span>
            </p>
          ))}
          <p className="m-0 mt-2 text-[14px]" style={{ color: theme.muted }}>Confermando, vengono aggiunte a Progressi come controllo con Carlotta.</p>
        </section>
      )}
    </Sheet>
  );
}
