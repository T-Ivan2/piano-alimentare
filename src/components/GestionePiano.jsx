import { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabase';
import { MEAL_TYPES } from '../dates';
import { activatePlan as activateInDb } from '../plans';
import Sheet, { fieldStyle, outlineStyle, primaryStyle } from './Sheet';

const clone = (x) => JSON.parse(JSON.stringify(x));

export default function GestionePiano({ theme, activePlan, onClose, onChanged, initialDraft, reviewMode }) {
  const [plans, setPlans] = useState([]);
  const [draft, setDraft] = useState(() => (initialDraft
    ? { id: initialDraft.id, title: initialDraft.title, month_label: initialDraft.month_label, goal: initialDraft.goal || '', data: clone(initialDraft.data) }
    : null)); // { id?, title, month_label, goal, data }
  const [importing, setImporting] = useState(false);
  const [day, setDay] = useState(0);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [undo, setUndo] = useState(null); // piano attivo prima del cambio, finché si può annullare
  const snapshot = useRef(JSON.stringify(draft));
  const timer = useRef(null);
  // a ogni bozza aperta o chiusa si riparte da zero con il confronto delle modifiche
  useEffect(() => { snapshot.current = JSON.stringify(draft); setLeaving(false); }, [draft === null, draft?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => clearTimeout(timer.current), []);

  const load = () => supabase.from('plans').select('id, title, month_label, active, created_at').order('created_at', { ascending: false })
    .then(({ data }) => setPlans(data || []));
  useEffect(() => { load(); }, []);

  const startNew = () => {
    const d = clone(activePlan.data);
    setDraft({ title: '', month_label: '', goal: activePlan.goal || '', data: d });
    setDay(0); setMsg('');
  };
  const editActive = () => {
    setDraft({ id: activePlan.id, title: activePlan.title, month_label: activePlan.month_label, goal: activePlan.goal || '', data: clone(activePlan.data) });
    setDay(0); setMsg('');
  };

  const setData = (fn) => setDraft((d) => { const n = clone(d); fn(n.data, n); return n; });

  const save = async (activate) => {
    if (!draft.title.trim() || !draft.month_label.trim()) { setMsg('Inserisci titolo e mese.'); return; }
    setBusy(true); setMsg('');
    const row = { title: draft.title.trim(), month_label: draft.month_label.trim(), goal: draft.goal, data: draft.data };
    let id = draft.id;
    if (id) {
      const { error } = await supabase.from('plans').update(row).eq('id', id);
      if (error) { setBusy(false); setMsg('Errore: ' + error.message); return; }
    } else {
      const { data, error } = await supabase.from('plans').insert({ ...row, active: false }).select('id').single();
      if (error) { setBusy(false); setMsg('Errore: ' + error.message); return; }
      id = data.id;
    }
    if (activate) await activatePlan(id, false);
    setBusy(false);
    setDraft(null);
    setMsg(activate ? 'Piano salvato e attivato.' : 'Piano salvato.');
    load(); onChanged();
  };

  const activatePlan = async (id, refresh = true) => {
    const error = await activateInDb(id);
    if (error) { setMsg('Non sono riuscito ad attivare il piano: ' + error.message); return; }
    if (refresh) { setMsg('Piano attivato.'); load(); onChanged(); }
  };

  // Cambio del piano attivo dall'archivio: subito, con qualche secondo per tornare indietro
  const switchTo = async (id) => {
    const prev = plans.find((p) => p.active)?.id;
    await activatePlan(id);
    if (prev) {
      setUndo(prev);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setUndo(null), 6000);
    }
  };
  const undoSwitch = async () => {
    clearTimeout(timer.current);
    const prev = undo;
    setUndo(null);
    await activatePlan(prev);
    setMsg('Ripristinato il piano di prima.');
  };

  const importPdf = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 4.5 * 1024 * 1024) { setMsg('Il PDF è troppo grande (max 4,5 MB).'); return; }
    setImporting(true); setMsg('');
    try {
      const b64 = await new Promise((ok, ko) => {
        const fr = new FileReader();
        fr.onload = () => ok(String(fr.result).split(',')[1]);
        fr.onerror = ko;
        fr.readAsDataURL(file);
      });
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/.netlify/functions/importa-piano-background', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ pdf_base64: b64, filename: file.name }),
      });
      setMsg(res.ok ? 'PDF inviato. Lo sto leggendo: ti arriva una notifica quando il piano è pronto da verificare (1-3 minuti).' : `Invio non riuscito (${res.status}).`);
    } catch (err) {
      setMsg('Invio non riuscito: ' + err.message);
    }
    setImporting(false);
  };

  const field = fieldStyle(theme);
  const dirty = draft && JSON.stringify(draft) !== snapshot.current;
  const requestClose = () => {
    if (dirty) { setLeaving(true); return; }
    if (draft && !reviewMode) { setDraft(null); return; }
    onClose();
  };
  const leave = () => { setLeaving(false); if (draft && !reviewMode) setDraft(null); else onClose(); };

  const footer = draft && (
    <div className="flex flex-col gap-2">
      {leaving && (
        <div role="alert" className="flex items-center justify-between gap-2 pl-3 py-1 pr-1" style={{ border: `1px solid ${theme.danger}` }}>
          <span className="text-[15px]">Hai modifiche non salvate.</span>
          <span className="flex gap-1 shrink-0">
            <button onClick={() => setLeaving(false)} className="label min-h-11 px-3" style={outlineStyle(theme)}>Continua</button>
            <button onClick={leave} className="label min-h-11 px-3" style={outlineStyle(theme, theme.danger)}>Scarta</button>
          </span>
        </div>
      )}
      <div className="flex justify-between items-center gap-2">
        {!draft.id && !reviewMode ? (
          <button disabled={busy} onClick={() => save(false)} className="label min-h-12 px-4 disabled:opacity-50" style={outlineStyle(theme)}>Salva come bozza</button>
        ) : <span />}
        <button disabled={busy} onClick={() => save(!reviewMode)} className="cut-br theme-action label min-h-12 px-6 text-[17px] disabled:opacity-50" style={primaryStyle(theme)}>
          {busy ? 'Salvo…' : reviewMode ? 'Salva e torna alla revisione' : draft.id ? 'Salva modifiche' : 'Salva e attiva'}
        </button>
      </div>
    </div>
  );

  return (
    <Sheet theme={theme} variant="full" onClose={requestClose} footer={footer}
      title={draft ? 'Piano alimentare' : 'I tuoi piani'}
      subtitle={reviewMode ? 'Correggi il piano importato' : draft ? (draft.id ? 'Modifica del piano attivo' : 'Nuovo piano, partendo da quello attuale') : 'Importa, crea o cambia il piano attivo'}>
      {msg && <p role="status" className="m-0 mb-4 px-3 py-2.5 text-[15px]" style={{ border: `1px solid ${theme.edge}`, background: theme.surf }}>{msg}</p>}

      {!draft && (
        <>
          <label className="cut-br theme-action label min-h-12 px-4 flex items-center justify-center cursor-pointer text-[17px]"
            style={{ ...primaryStyle(theme), opacity: importing ? 0.6 : 1 }}>
            {importing ? 'Invio del PDF…' : 'Importa il PDF di Carlotta'}
            <input type="file" accept="application/pdf" className="sr-only" disabled={importing} onChange={importPdf} />
          </label>
          <p className="m-0 mt-2 text-[14px]" style={{ color: theme.muted }}>Di solito arriva da solo dalla mail: questo serve se il PDF ce l'hai sul telefono.</p>
          {activePlan && (
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button onClick={startNew} className="label min-h-12 px-2" style={outlineStyle(theme)}>Nuovo piano</button>
              <button onClick={editActive} className="label min-h-12 px-2" style={outlineStyle(theme)}>Correggi l'attivo</button>
            </div>
          )}

          <section className="mt-6" aria-labelledby="archivio">
            <h3 id="archivio" className="label m-0 pb-2" style={{ color: theme.muted, borderBottom: `1px solid ${theme.line}` }}>Archivio</h3>
            {plans.map((p) => (
              <div key={p.id} className="py-2.5 flex justify-between items-center gap-3" style={{ borderBottom: `1px solid ${theme.line}` }}>
                <div className="min-w-0">
                  <p className="m-0 text-[16px] truncate">{p.title}</p>
                  <p className="m-0 text-[14px]" style={{ color: theme.muted }}>{p.month_label} · {new Date(p.created_at).toLocaleDateString('it-IT')}</p>
                </div>
                {p.active
                  ? <span className="label px-3 min-h-11 flex items-center" style={{ color: theme.acc }}>Attivo</span>
                  : <button onClick={() => switchTo(p.id)} className="label min-h-11 px-4 shrink-0" style={outlineStyle(theme)}>Attiva</button>}
              </div>
            ))}
          </section>
          {undo && (
            <div role="status" className="sticky bottom-0 mt-4 flex items-center justify-between gap-3 pl-4 pr-1 py-1" style={{ background: theme.surf2, border: `1px solid ${theme.edge}` }}>
              <span className="text-[15px]">Piano attivato</span>
              <button onClick={undoSwitch} className="label min-h-11 px-4 bg-transparent border-0" style={{ color: theme.acc }}>Annulla</button>
            </div>
          )}
        </>
      )}

      {draft && (
        <div className="flex flex-col gap-6">
          <section className="grid gap-3">
            <label className="flex flex-col gap-1 text-[14px]" style={{ color: theme.muted }}>Titolo
              <input value={draft.title} placeholder="es. Piano di novembre 2026" onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="h-11 px-3 text-[16px]" style={field} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-[14px]" style={{ color: theme.muted }}>Mese del percorso
                <input value={draft.month_label} placeholder="es. Mese 8" onChange={(e) => setDraft({ ...draft, month_label: e.target.value })} className="h-11 px-3 text-[16px]" style={field} />
              </label>
              <label className="flex flex-col gap-1 text-[14px]" style={{ color: theme.muted }}>Acqua al giorno (ml)
                <input type="number" inputMode="numeric" step="250" value={draft.data.acqua_ml || 2500}
                  onChange={(e) => setData((d) => { d.acqua_ml = Number(e.target.value) || 2500; })} className="h-11 px-3 text-[16px] font-display font-semibold" style={field} />
              </label>
            </div>
            <label className="flex flex-col gap-1 text-[14px]" style={{ color: theme.muted }}>Obiettivo
              <input value={draft.goal} onChange={(e) => setDraft({ ...draft, goal: e.target.value })} className="h-11 px-3 text-[16px]" style={field} />
            </label>
          </section>

          <ListEditor theme={theme} title="Consigli del mese" hint="Diventano una spunta giornaliera in Settimana (es. Creatina 4 g al giorno)."
            items={draft.data.indicazioni || []} onChange={(v) => setData((d) => { d.indicazioni = v; })} />

          <section aria-labelledby="menu">
            <h3 id="menu" className="label m-0 pb-2" style={{ color: theme.muted, borderBottom: `1px solid ${theme.line}` }}>Menù settimanale</h3>
            <div className="grid grid-cols-7 gap-1 mt-2" role="tablist" aria-label="Giorno da modificare">
              {draft.data.giorni.map((g, i) => {
                const on = i === day;
                return (
                  <button key={g.nome} role="tab" aria-selected={on} aria-label={g.nome} onClick={() => setDay(i)} className="label text-[11px] min-h-11 border-0"
                    style={{ background: on ? theme.surf : 'transparent', color: on ? theme.acc : theme.text, boxShadow: on ? `inset 0 2px ${theme.acc}` : `inset 0 -1px ${theme.line}` }}>
                    {g.nome.slice(0, 3)}
                  </button>
                );
              })}
            </div>
            {MEAL_TYPES.map((t, i) => (
              <label key={t} className="flex flex-col gap-1 mt-3 text-[14px]" style={{ color: theme.muted }}>{t}
                <textarea rows={2} value={draft.data.giorni[day].pasti[i]} onChange={(e) => setData((d) => { d.giorni[day].pasti[i] = e.target.value; })}
                  className="px-3 py-2 text-[16px] leading-snug resize-y" style={field} />
              </label>
            ))}
          </section>

          <section aria-labelledby="lista-spesa">
            <h3 id="lista-spesa" className="label m-0 pb-2" style={{ color: theme.muted, borderBottom: `1px solid ${theme.line}` }}>Lista della spesa</h3>
            <p className="m-0 mt-2 text-[14px]" style={{ color: theme.muted }}>Controlla che le quantità corrispondano al nuovo menù.</p>
            {(draft.data.spesa || []).map((g, gi) => (
              <div key={gi} className="flex flex-col gap-1.5 mt-3">
                <input value={g.gruppo} onChange={(e) => setData((d) => { d.spesa[gi].gruppo = e.target.value; })} className="h-11 px-3 label" style={field} aria-label="Nome reparto" />
                {g.voci.map((v, vi) => (
                  <div key={vi} className="grid gap-1.5" style={{ gridTemplateColumns: '1.4fr 0.9fr 1.4fr 44px' }}>
                    {[0, 1, 2].map((k) => (
                      <input key={k} value={v[k]} placeholder={['Alimento', 'Quantità', 'Quando'][k]} aria-label={['Alimento', 'Quantità', 'Quando'][k]}
                        onChange={(e) => setData((d) => { d.spesa[gi].voci[vi][k] = e.target.value; })} className="h-11 min-w-0 px-2 text-[15px]" style={field} />
                    ))}
                    <RemoveButton theme={theme} label={`Rimuovi ${v[0] || 'voce'}`} onClick={() => setData((d) => { d.spesa[gi].voci.splice(vi, 1); })} />
                  </div>
                ))}
                <button onClick={() => setData((d) => { d.spesa[gi].voci.push(['', '', '']); })} className="label min-h-11 px-3 self-start" style={outlineStyle(theme)}>Aggiungi voce</button>
              </div>
            ))}
          </section>

          <ListEditor theme={theme} title="Note del piano" hint="Compaiono in fondo alla schermata Settimana."
            items={draft.data.consigli || []} onChange={(v) => setData((d) => { d.consigli = v; })} />
          <p className="m-0 text-[14px]" style={{ color: theme.muted }}>Le sostituzioni (equivalenze e secondi piatti) restano quelle attuali.</p>
        </div>
      )}
    </Sheet>
  );
}

function RemoveButton({ theme, label, onClick }) {
  return (
    <button onClick={onClick} aria-label={label} className="w-11 h-11 flex items-center justify-center" style={outlineStyle(theme, theme.danger)}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" /></svg>
    </button>
  );
}

function ListEditor({ theme, title, hint, items, onChange }) {
  return (
    <section aria-label={title}>
      <h3 className="label m-0 pb-2" style={{ color: theme.muted, borderBottom: `1px solid ${theme.line}` }}>{title}</h3>
      <p className="m-0 mt-2 text-[14px]" style={{ color: theme.muted }}>{hint}</p>
      <div className="flex flex-col gap-1.5 mt-2">
        {items.map((v, i) => (
          <div key={i} className="flex gap-1.5">
            <input value={v} onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} className="h-11 flex-1 min-w-0 px-3 text-[16px]" style={fieldStyle(theme)} aria-label={`${title} ${i + 1}`} />
            <RemoveButton theme={theme} label={`Rimuovi ${v || 'riga'}`} onClick={() => onChange(items.filter((_, j) => j !== i))} />
          </div>
        ))}
        <button onClick={() => onChange([...items, ''])} className="label min-h-11 px-3 self-start" style={outlineStyle(theme)}>Aggiungi</button>
      </div>
    </section>
  );
}
