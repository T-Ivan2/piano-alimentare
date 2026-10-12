import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import Illustration from '../components/Illustration';
import Sostituzioni, { groupsFor } from '../components/Sostituzioni';
import { weekdayIndex, isoDay, startOfWeek, longDate, MEAL_TYPES, MEAL_TINTS } from '../dates';

const GLASS_ML = 250;
const empty = { meals: {}, water: 0, checks: {}, subs: {} };

export default function Oggi({ plan, theme, user, themesOn, onToggleThemes }) {
  const now = new Date();
  const today = isoDay(now);
  const wd = weekdayIndex(now);
  const meals = plan.data.giorni[wd].pasti;
  const glasses = Math.round((plan.data.acqua_ml || 2500) / GLASS_ML);

  const [log, setLog] = useState(empty);
  const [week, setWeek] = useState({ done: 0, total: 0 });
  const [menu, setMenu] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [swap, setSwap] = useState(null);

  useEffect(() => {
    supabase.from('day_logs').select('*')
      .gte('day', isoDay(startOfWeek(now))).lte('day', today)
      .then(({ data }) => {
        const rows = data || [];
        const t = rows.find((r) => r.day === today);
        if (t) setLog({ meals: t.meals || {}, water: t.water || 0, checks: t.checks || {}, subs: t.subs || {} });
        const others = rows.filter((r) => r.day !== today)
          .reduce((n, r) => n + Object.values(r.meals || {}).filter(Boolean).length, 0);
        setWeek({ done: others, total: (wd + 1) * 4 });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async (next) => {
    setLog(next);
    const { error } = await supabase.from('day_logs')
      .upsert({ user_id: user.id, day: today, ...next, updated_at: new Date().toISOString() });
    setSaveError(error ? 'Non sono riuscito a salvare, riprova.' : '');
  };

  const doneToday = meals.filter((_, i) => log.meals[i]).length;
  const weekDone = week.done + doneToday;

  return (
    <div className="flex flex-col gap-4">
      <header className="flex justify-between items-center">
        <div>
          <p className="text-muted m-0 text-sm">{longDate(now)}</p>
          <h1 className="font-display text-[28px] leading-tight font-semibold m-0">{theme.greet}</h1>
        </div>
        <button onClick={() => setMenu(!menu)} aria-label="Profilo e impostazioni" aria-expanded={menu}
          className="theme-card w-[46px] h-[46px] shrink-0 rounded-full border-0 font-display font-semibold"
          style={{ background: theme.surf2, color: theme.text }}>IT</button>
      </header>

      {menu && (
        <div className="theme-card rounded-[22px] p-2 flex flex-col" style={{ background: theme.surf }}>
          <button onClick={onToggleThemes} className="text-left px-3 py-3 bg-transparent border-0 text-[15px]" style={{ color: theme.text }}>
            Temi stagionali: <b>{themesOn ? 'attivi' : 'spenti'}</b>
          </button>
          <button onClick={() => supabase.auth.signOut()} className="text-left px-3 py-3 bg-transparent border-0 text-[15px]" style={{ color: '#F0A08A' }}>
            Esci
          </button>
        </div>
      )}

      <Illustration name={theme.key} />

      <section className="theme-card rounded-[26px] px-[18px] py-4 flex gap-4 items-center" style={{ background: theme.surf }}>
        <Ring value={doneToday} max={meals.length} theme={theme} />
        <div>
          <p className="font-display font-semibold text-[17px] m-0">{theme.tag}</p>
          <p className="text-muted text-sm m-0">Questa settimana {weekDone} pasti su {week.total || (wd + 1) * 4}</p>
        </div>
      </section>

      {plan.data.indicazioni?.map((ind) => (
        <label key={ind} className="theme-card rounded-[20px] px-4 py-3 flex gap-3 items-center text-[15px]" style={{ background: theme.surf }}>
          <input type="checkbox" checked={!!log.checks[ind]} style={{ accentColor: theme.acc, width: 22, height: 22 }}
            onChange={(e) => save({ ...log, checks: { ...log.checks, [ind]: e.target.checked } })} />
          <span>{ind} · <span className="text-muted">consiglio del mese</span></span>
        </label>
      ))}

      <section className="flex flex-col gap-2.5" aria-label="Pasti di oggi">
        {meals.map((text, i) => {
          const done = !!log.meals[i];
          return (
            <div key={i} className="theme-card rounded-[22px] py-3.5 pl-4 pr-3.5 flex gap-3 items-center" style={{ background: theme.surf }}>
              <div className="flex-1 min-w-0">
                <p className="m-0 text-[13px] font-bold" style={{ color: MEAL_TINTS[i] }}>{MEAL_TYPES[i]}</p>
                <p className="m-0 text-[15px] leading-snug">{text}</p>
                {log.subs[i] && <p className="m-0 mt-1 text-[13px]" style={{ color: theme.acc }}>↻ {log.subs[i]}</p>}
                {groupsFor(plan, text).length > 0 && (
                  <button onClick={() => setSwap(i)} className="mt-1 p-0 bg-transparent border-0 text-[13px] font-semibold" style={{ color: theme.acc }}>
                    {log.subs[i] ? 'Cambia sostituzione' : 'Sostituisci'}
                  </button>
                )}
              </div>
              <button onClick={() => save({ ...log, meals: { ...log.meals, [i]: !done } })}
                aria-label={done ? `${MEAL_TYPES[i]}: fatto, tocca per annullare` : `Segna ${MEAL_TYPES[i]} come fatto`}
                aria-pressed={done}
                className="theme-action w-[46px] h-[46px] shrink-0 rounded-full flex items-center justify-center"
                style={{ background: done ? theme.acc : 'transparent', border: done ? 'none' : `2px dashed ${theme.surf2}`, color: theme.onAcc }}>
                {done && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg>}
              </button>
            </div>
          );
        })}
      </section>

      <section className="theme-card rounded-[22px] px-4 py-3.5 flex flex-col gap-2.5" style={{ background: theme.surf }}>
        <div className="flex justify-between items-baseline">
          <h2 className="font-display font-semibold text-base m-0">Acqua</h2>
          <span className="text-muted text-sm">{((log.water * GLASS_ML) / 1000).toLocaleString('it-IT')} di {((glasses * GLASS_ML) / 1000).toLocaleString('it-IT')} L</span>
        </div>
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${glasses}, minmax(0, 1fr))` }}>
          {Array.from({ length: glasses }, (_, i) => (
            <button key={i} aria-label={`${i + 1} bicchieri`} onClick={() => save({ ...log, water: log.water === i + 1 ? i : i + 1 })}
              className="h-7 rounded-full border-0 p-0" style={{ background: i < log.water ? '#8FBFCD' : theme.surf2 }} />
          ))}
        </div>
      </section>

      {swap !== null && (
        <Sostituzioni plan={plan} theme={theme} mealType={MEAL_TYPES[swap]} text={meals[swap]} current={log.subs[swap]}
          onPick={(label) => { save({ ...log, subs: { ...log.subs, [swap]: label } }); setSwap(null); }}
          onClear={() => { const s = { ...log.subs }; delete s[swap]; save({ ...log, subs: s }); setSwap(null); }}
          onClose={() => setSwap(null)} />
      )}

      {saveError && <p className="m-0 text-sm" style={{ color: '#F0A08A' }}>{saveError}</p>}
    </div>
  );
}

function Ring({ value, max, theme }) {
  const r = 30, c = 2 * Math.PI * r, p = max ? value / max : 0;
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" role="img" aria-label={`${value} pasti su ${max}`}>
      <circle cx="36" cy="36" r={r} fill="none" stroke={theme.surf2} strokeWidth="7" />
      <circle cx="36" cy="36" r={r} fill="none" stroke={theme.acc} strokeWidth="7" strokeLinecap="round"
        strokeDasharray={`${c * p} ${c}`} transform="rotate(-90 36 36)" />
      <text x="36" y="42" textAnchor="middle" fill="#F3EADD" style={{ font: '600 19px Fraunces, serif' }}>{value}/{max}</text>
    </svg>
  );
}
