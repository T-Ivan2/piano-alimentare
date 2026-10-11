import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { isoDay, startOfWeek } from '../dates';

const GROUP_TINTS = ['#E39A72', '#8FBFCD', '#E2B866', '#B4CB86', '#C9A8DA'];

export default function Spesa({ plan, theme, user }) {
  const groups = plan.data.spesa || [];
  const week = isoDay(startOfWeek(new Date()));
  const [checks, setChecks] = useState({});
  const [err, setErr] = useState('');

  useEffect(() => {
    supabase.from('shopping').select('checks').eq('week_start', week).maybeSingle()
      .then(({ data }) => data && setChecks(data.checks || {}));
  }, [week]);

  const save = async (next) => {
    setChecks(next);
    const { error } = await supabase.from('shopping').upsert({ user_id: user.id, week_start: week, checks: next });
    setErr(error ? 'Non sono riuscito a salvare, riprova.' : '');
  };

  const all = groups.flatMap((g) => g.voci.map((v) => v[0]));
  const done = all.filter((n) => checks[n]).length;

  if (!groups.length) {
    return <p className="text-muted">La lista della spesa non è ancora nel piano attivo.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex justify-between items-end">
        <div>
          <p className="text-muted m-0 text-sm">Per tutta la settimana</p>
          <h1 className="font-display text-[30px] font-semibold m-0">La spesa</h1>
        </div>
        <button onClick={() => save({})} className="theme-action h-11 px-4 rounded-full bg-transparent font-bold text-sm"
          style={{ border: `1.5px solid ${theme.surf2}`, color: theme.text }}>Azzera</button>
      </header>

      <section className="theme-card rounded-[22px] px-4 py-3.5 flex flex-col gap-2" style={{ background: theme.surf }}>
        <div className="flex justify-between text-sm">
          <b>{done} di {all.length} presi</b>
          <span className="text-muted">generata dal piano</span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: theme.surf2 }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${(done / all.length) * 100}%`, background: theme.acc }} />
        </div>
      </section>

      {groups.map((g, gi) => (
        <section key={g.gruppo} className="flex flex-col gap-2">
          <h2 className="font-display text-lg font-semibold m-0" style={{ color: GROUP_TINTS[gi % GROUP_TINTS.length] }}>{g.gruppo}</h2>
          <div className="theme-card rounded-[20px] py-1 flex flex-col" style={{ background: theme.surf }}>
            {g.voci.map(([name, qty, why]) => {
              const on = !!checks[name];
              return (
                <button key={name} onClick={() => save({ ...checks, [name]: !on })} aria-pressed={on}
                  className="flex gap-3 items-center min-h-[52px] px-3.5 py-1.5 bg-transparent border-0 text-left" style={{ color: theme.text }}>
                  <span className="w-6 h-6 shrink-0 rounded-lg flex items-center justify-center"
                    style={{ background: on ? theme.acc : 'transparent', border: on ? 'none' : `2px solid ${theme.surf2}`, color: theme.onAcc }}>
                    {on && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg>}
                  </span>
                  <span className="flex-1 flex flex-col" style={{ opacity: on ? 0.5 : 1 }}>
                    <span className="text-[15px]" style={{ textDecoration: on ? 'line-through' : 'none' }}>{name}</span>
                    <span className="text-xs text-muted">{why}</span>
                  </span>
                  <span className="text-sm font-bold" style={{ color: theme.muted, opacity: on ? 0.5 : 1 }}>{qty}</span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
      {err && <p className="m-0 text-sm" style={{ color: '#F0A08A' }}>{err}</p>}
    </div>
  );
}
