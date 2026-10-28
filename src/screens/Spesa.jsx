import { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabase';
import { isoDay, startOfWeek } from '../dates';
import { CheckIcon } from '../components/Icons';
import { readCache, writeCache } from '../cache';

const UNDO_MS = 6000;

export default function Spesa({ plan, theme, user }) {
  const groups = plan.data.spesa || [];
  const week = isoDay(startOfWeek(new Date()));
  const [checks, setChecks] = useState({});
  const [err, setErr] = useState('');
  const [undo, setUndo] = useState(null); // lista prima dell'azzeramento, finché si può annullare
  const timer = useRef(null);

  // 'loading' | 'ok' | 'offline' (copia locale) | 'error': senza una lettura valida non si salva, per non azzerare la lista vera
  const [status, setStatus] = useState('loading');
  const load = () => {
    setStatus('loading');
    supabase.from('shopping').select('checks').eq('week_start', week).maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          const cached = readCache(`spesa:${week}`);
          if (cached) { setChecks(cached); setStatus('offline'); } else setStatus('error');
          return;
        }
        setChecks(data?.checks || {});
        writeCache(`spesa:${week}`, data?.checks || {});
        setStatus('ok');
      });
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [week]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const save = async (next) => {
    if (status !== 'ok' && status !== 'offline') return;
    setChecks(next);
    writeCache(`spesa:${week}`, next);
    const { error } = await supabase.from('shopping').upsert({ user_id: user.id, week_start: week, checks: next });
    setErr(error ? 'Non sono riuscito a salvare, riprova.' : '');
  };

  // Azzera subito ma lascia qualche secondo per tornare indietro
  const reset = () => {
    setUndo(checks);
    save({});
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setUndo(null), UNDO_MS);
  };
  const restore = () => {
    clearTimeout(timer.current);
    save(undo);
    setUndo(null);
  };

  const all = groups.flatMap((g) => g.voci.map((v) => v[0]));
  const done = all.filter((n) => checks[n]).length;

  if (!groups.length) {
    return (
      <div>
        <h1 className="font-display text-[26px] leading-[1.1] font-bold m-0">La spesa</h1>
        <p className="m-0 mt-3 text-[16px]" style={{ color: theme.muted }}>La lista della spesa non è ancora nel piano attivo. Arriva con il prossimo piano, oppure si aggiunge da Gestisci il piano.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <header className="flex justify-between items-start gap-3">
        <div>
          <h1 className="font-display text-[26px] leading-[1.1] font-bold m-0">La spesa</h1>
          <p className="m-0 mt-1 text-[15px]" style={{ color: theme.muted }}>Per tutta la settimana, generata dal piano</p>
        </div>
        <button onClick={reset} disabled={!done} className="theme-action label min-h-11 px-4 bg-transparent shrink-0 disabled:opacity-40"
          style={{ border: `1px solid ${theme.edge}`, color: theme.text }}>Azzera</button>
      </header>

      {status === 'offline' && (
        <p role="status" className="m-0 mt-4 px-3 py-2 text-[15px]" style={{ border: `1px solid ${theme.edge}`, color: theme.muted }}>Sei offline: vedi l'ultima copia salvata sul telefono.</p>
      )}
      {status === 'error' && (
        <div role="alert" className="mt-4 px-3 py-3 flex items-center justify-between gap-3" style={{ border: `1px solid ${theme.danger}`, background: theme.surf }}>
          <span className="text-[16px]">Non riesco a leggere la lista. Finché non la leggo non segno niente.</span>
          <button onClick={load} className="label min-h-11 px-3 shrink-0" style={{ color: theme.danger, border: `1px solid ${theme.danger}`, background: 'transparent' }}>Riprova</button>
        </div>
      )}

      <section className="mt-4" aria-label="Avanzamento della spesa">
        <div className="flex justify-between items-baseline">
          <span className="label" style={{ color: theme.done }}>{done} di {all.length} presi</span>
          <span className="label" style={{ color: theme.muted }}>{all.length - done} da prendere</span>
        </div>
        <div className="mt-2 h-2 flex gap-[2px]" aria-hidden="true">
          {all.map((n) => <span key={n} className="flex-1" style={{ background: checks[n] ? theme.done : theme.surf2 }} />)}
        </div>
      </section>

      {groups.map((g) => {
        const got = g.voci.filter(([n]) => checks[n]).length;
        return (
          <section key={g.gruppo} className="mt-6" aria-labelledby={`g-${g.gruppo}`}>
            <div className="flex justify-between items-baseline pb-2" style={{ borderBottom: `1px solid ${theme.line}` }}>
              <h2 id={`g-${g.gruppo}`} className="label m-0" style={{ color: theme.muted }}>{g.gruppo}</h2>
              <span className="label" style={{ color: got === g.voci.length ? theme.done : theme.muted }}>{got}/{g.voci.length}</span>
            </div>
            {g.voci.map(([name, qty, why]) => {
              const on = !!checks[name];
              return (
                <button key={name} onClick={() => save({ ...checks, [name]: !on })} aria-pressed={on}
                  className="w-full flex gap-3 items-center min-h-[56px] py-2 bg-transparent border-0 text-left"
                  style={{ color: theme.text, borderBottom: `1px solid ${theme.line}` }}>
                  <span className="w-6 h-6 shrink-0 flex items-center justify-center"
                    style={on ? { background: theme.done, color: theme.onAcc } : { border: `1px solid ${theme.edge}` }}>
                    {on && <CheckIcon />}
                  </span>
                  <span className="flex-1 min-w-0 flex flex-col">
                    <span className="text-[16px] leading-snug" style={{ color: on ? theme.muted : theme.text, textDecoration: on ? 'line-through' : 'none' }}>{name}</span>
                    {why && <span className="text-[14px] leading-snug" style={{ color: theme.muted }}>{why}</span>}
                  </span>
                  <span className="font-display font-semibold text-[19px] shrink-0" style={{ color: on ? theme.muted : theme.text }}>{qty}</span>
                </button>
              );
            })}
          </section>
        );
      })}

      {err && <p role="alert" className="m-0 mt-3 text-[15px]" style={{ color: theme.danger }}>{err}</p>}

      {undo && (
        <div role="status" className="fixed inset-x-0 z-20 px-4" style={{ bottom: 'calc(max(14px, env(safe-area-inset-bottom)) + 64px)' }}>
          <div className="max-w-md mx-auto flex items-center justify-between gap-3 pl-4 pr-1 py-1"
            style={{ background: theme.surf2, border: `1px solid ${theme.edge}` }}>
            <span className="text-[15px]">Lista azzerata</span>
            <button onClick={restore} className="label min-h-11 px-4 bg-transparent border-0" style={{ color: theme.acc }}>Annulla</button>
          </div>
        </div>
      )}
    </div>
  );
}
