import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { MEAL_TYPES } from '../dates';

const clone = (x) => JSON.parse(JSON.stringify(x));

export default function GestionePiano({ theme, activePlan, onClose, onChanged }) {
  const [plans, setPlans] = useState([]);
  const [draft, setDraft] = useState(null); // { id?, title, month_label, goal, data }
  const [day, setDay] = useState(0);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

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
    const { error: e1 } = await supabase.from('plans').update({ active: false }).neq('id', id);
    const { error: e2 } = await supabase.from('plans').update({ active: true }).eq('id', id);
    if (e1 || e2) { setMsg('Errore: ' + (e1 || e2).message); return; }
    if (refresh) { setMsg('Piano attivato.'); load(); onChanged(); }
  };

  const input = { background: theme.surf2, color: theme.text, border: 0 };
  const card = { background: theme.surf };

  return (
    <div className="fixed inset-0 z-30 overflow-y-auto" style={{ backgroundColor: theme.bg, color: theme.text }}>
      <div className="max-w-md mx-auto px-4 pt-6 pb-16 flex flex-col gap-4">
        <header className="flex justify-between items-start gap-3">
          <div>
            <p className="m-0 text-sm" style={{ color: theme.muted }}>{draft ? (draft.id ? 'Modifica piano attivo' : 'Nuovo piano') : 'Gestione'}</p>
            <h1 className="m-0 font-display text-[28px] font-semibold">{draft ? 'Piano alimentare' : 'I tuoi piani'}</h1>
          </div>
          <button onClick={draft ? () => setDraft(null) : onClose} aria-label={draft ? 'Annulla modifiche' : 'Chiudi'}
            className="w-11 h-11 shrink-0 rounded-full border-0 flex items-center justify-center" style={{ background: theme.surf, color: theme.text }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </header>

        {msg && <p className="m-0 rounded-2xl px-4 py-3 text-sm" style={card}>{msg}</p>}

        {!draft && (
          <>
            <button onClick={startNew} className="theme-action h-12 rounded-full border-0 font-bold" style={{ background: theme.acc, color: theme.onAcc }}>
              + Nuovo piano (parti da quello attuale)
            </button>
            <button onClick={editActive} className="h-12 rounded-full bg-transparent font-bold" style={{ border: `1.5px solid ${theme.surf2}`, color: theme.text }}>
              Correggi il piano attivo
            </button>
            <section className="flex flex-col gap-2">
              <h2 className="m-0 text-[13px] font-bold uppercase tracking-wide" style={{ color: theme.muted }}>Archivio</h2>
              {plans.map((p) => (
                <div key={p.id} className="theme-card rounded-[20px] px-4 py-3 flex justify-between items-center gap-3" style={card}>
                  <div className="min-w-0">
                    <p className="m-0 font-bold truncate">{p.title}</p>
                    <p className="m-0 text-xs" style={{ color: theme.muted }}>{p.month_label} · {new Date(p.created_at).toLocaleDateString('it-IT')}</p>
                  </div>
                  {p.active
                    ? <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: theme.surf2, color: theme.acc }}>Attivo</span>
                    : <button onClick={() => activatePlan(p.id)} className="h-10 px-3 rounded-full bg-transparent text-sm font-bold" style={{ border: `1.5px solid ${theme.surf2}`, color: theme.text }}>Attiva</button>}
                </div>
              ))}
            </section>
          </>
        )}

        {draft && (
          <>
            <section className="theme-card rounded-[22px] p-4 flex flex-col gap-3" style={card}>
              <label className="flex flex-col gap-1 text-sm">Titolo
                <input value={draft.title} placeholder="es. Piano di novembre 2026" onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="h-11 rounded-xl px-3 text-base" style={input} />
              </label>
              <label className="flex flex-col gap-1 text-sm">Mese del percorso
                <input value={draft.month_label} placeholder="es. Mese 8" onChange={(e) => setDraft({ ...draft, month_label: e.target.value })} className="h-11 rounded-xl px-3 text-base" style={input} />
              </label>
              <label className="flex flex-col gap-1 text-sm">Obiettivo
                <input value={draft.goal} onChange={(e) => setDraft({ ...draft, goal: e.target.value })} className="h-11 rounded-xl px-3 text-base" style={input} />
              </label>
            </section>

            <ListEditor theme={theme} title="Indicazioni del mese" hint="Diventano una spunta giornaliera in Oggi (es. Creatina 4 g al giorno)."
              items={draft.data.indicazioni || []} onChange={(v) => setData((d) => { d.indicazioni = v; })} />

            <section className="theme-card rounded-[22px] p-4 flex flex-col gap-3" style={card}>
              <h2 className="m-0 font-display text-lg font-semibold">Menù settimanale</h2>
              <div className="grid grid-cols-7 gap-1" role="tablist">
                {draft.data.giorni.map((g, i) => (
                  <button key={g.nome} role="tab" aria-selected={i === day} onClick={() => setDay(i)}
                    className="h-10 rounded-xl border-0 text-xs font-bold"
                    style={{ background: i === day ? theme.acc : theme.surf2, color: i === day ? theme.onAcc : theme.text }}>{g.nome.slice(0, 3).toUpperCase()}</button>
                ))}
              </div>
              {MEAL_TYPES.map((t, i) => (
                <label key={t} className="flex flex-col gap-1 text-sm">{t}
                  <textarea rows={2} value={draft.data.giorni[day].pasti[i]} onChange={(e) => setData((d) => { d.giorni[day].pasti[i] = e.target.value; })}
                    className="rounded-xl px-3 py-2 text-base leading-snug resize-y" style={input} />
                </label>
              ))}
            </section>

            <section className="theme-card rounded-[22px] p-4 flex flex-col gap-3" style={card}>
              <h2 className="m-0 font-display text-lg font-semibold">Lista della spesa</h2>
              <p className="m-0 text-xs" style={{ color: theme.muted }}>Controlla che le quantità corrispondano al nuovo menù.</p>
              {(draft.data.spesa || []).map((g, gi) => (
                <div key={gi} className="flex flex-col gap-2">
                  <input value={g.gruppo} onChange={(e) => setData((d) => { d.spesa[gi].gruppo = e.target.value; })} className="h-10 rounded-xl px-3 font-bold" style={input} aria-label="Nome reparto" />
                  {g.voci.map((v, vi) => (
                    <div key={vi} className="grid gap-1.5" style={{ gridTemplateColumns: '1.4fr 0.9fr 1.4fr auto' }}>
                      {[0, 1, 2].map((k) => (
                        <input key={k} value={v[k]} placeholder={['Alimento', 'Quantità', 'Quando'][k]} aria-label={['Alimento', 'Quantità', 'Quando'][k]}
                          onChange={(e) => setData((d) => { d.spesa[gi].voci[vi][k] = e.target.value; })} className="h-10 min-w-0 rounded-lg px-2 text-sm" style={input} />
                      ))}
                      <button onClick={() => setData((d) => { d.spesa[gi].voci.splice(vi, 1); })} aria-label="Rimuovi voce"
                        className="w-10 h-10 rounded-lg border-0" style={{ background: theme.surf2, color: '#F0A08A' }}>×</button>
                    </div>
                  ))}
                  <button onClick={() => setData((d) => { d.spesa[gi].voci.push(['', '', '']); })} className="h-9 rounded-lg bg-transparent text-sm font-bold self-start px-3"
                    style={{ border: `1.5px dashed ${theme.surf2}`, color: theme.text }}>+ voce</button>
                </div>
              ))}
            </section>

            <ListEditor theme={theme} title="Consigli" hint="Compaiono in fondo alla schermata Settimana."
              items={draft.data.consigli || []} onChange={(v) => setData((d) => { d.consigli = v; })} />

            <section className="theme-card rounded-[22px] p-4 flex flex-col gap-2" style={card}>
              <label className="flex justify-between items-center gap-3 text-sm">Acqua al giorno (ml)
                <input type="number" inputMode="numeric" step="250" value={draft.data.acqua_ml || 2500}
                  onChange={(e) => setData((d) => { d.acqua_ml = Number(e.target.value) || 2500; })} className="h-11 w-28 rounded-xl px-3 text-base" style={input} />
              </label>
              <p className="m-0 text-xs" style={{ color: theme.muted }}>Le sostituzioni (equivalenze e secondi piatti) restano quelle attuali.</p>
            </section>

            <div className="flex flex-col gap-2 sticky bottom-3">
              <button disabled={busy} onClick={() => save(true)} className="theme-action h-12 rounded-full border-0 font-bold"
                style={{ background: theme.acc, color: theme.onAcc, opacity: busy ? 0.6 : 1 }}>{draft.id ? 'Salva modifiche' : 'Salva e attiva'}</button>
              {!draft.id && (
                <button disabled={busy} onClick={() => save(false)} className="h-11 rounded-full font-bold text-sm"
                  style={{ background: theme.bg, border: `1.5px solid ${theme.surf2}`, color: theme.text }}>Salva come bozza</button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ListEditor({ theme, title, hint, items, onChange }) {
  const input = { background: theme.surf2, color: theme.text, border: 0 };
  return (
    <section className="theme-card rounded-[22px] p-4 flex flex-col gap-2" style={{ background: theme.surf }}>
      <h2 className="m-0 font-display text-lg font-semibold">{title}</h2>
      <p className="m-0 text-xs" style={{ color: theme.muted }}>{hint}</p>
      {items.map((v, i) => (
        <div key={i} className="flex gap-1.5">
          <input value={v} onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} className="h-10 flex-1 min-w-0 rounded-lg px-3 text-sm" style={input} aria-label={`${title} ${i + 1}`} />
          <button onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label="Rimuovi" className="w-10 h-10 rounded-lg border-0" style={{ background: theme.surf2, color: '#F0A08A' }}>×</button>
        </div>
      ))}
      <button onClick={() => onChange([...items, ''])} className="h-9 rounded-lg bg-transparent text-sm font-bold self-start px-3"
        style={{ border: `1.5px dashed ${theme.surf2}`, color: theme.text }}>+ aggiungi</button>
    </section>
  );
}
