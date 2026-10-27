import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { weekdayIndex, isoDay, MEAL_TYPES, MEAL_TINTS } from '../dates';

const SHORT = ['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM'];

export default function Settimana({ plan, theme, user }) {
  const todayIdx = weekdayIndex(new Date());
  const [sel, setSel] = useState(todayIdx);
  const day = plan.data.giorni[sel];
  const today = isoDay(new Date());
  const tips = plan.data.indicazioni || [];
  const [checks, setChecks] = useState({});
  const [tipError, setTipError] = useState('');

  // I consigli del mese si spuntano ogni giorno: stanno nel diario di oggi
  useEffect(() => {
    if (!tips.length) return;
    supabase.from('day_logs').select('checks').eq('day', today).maybeSingle()
      .then(({ data }) => setChecks(data?.checks || {}));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleTip = async (t) => {
    const next = { ...checks, [t]: !checks[t] };
    setChecks(next);
    const { error } = await supabase.from('day_logs')
      .upsert({ user_id: user.id, day: today, checks: next, updated_at: new Date().toISOString() });
    setTipError(error ? 'Non sono riuscito a salvare, riprova.' : '');
  };

  return (
    <div className="flex flex-col gap-4">
      <header>
        <p className="text-muted m-0 text-sm">{plan.title} · {plan.month_label}</p>
        <h1 className="font-display text-[30px] font-semibold m-0">La settimana</h1>
      </header>

      {tips.length > 0 && (
        <section aria-labelledby="consigli">
          <h2 id="consigli" className="label m-0 pb-2" style={{ color: theme.muted, borderBottom: `1px solid ${theme.line}` }}>Consigli del mese · oggi</h2>
          {tips.map((t) => {
            const on = !!checks[t];
            return (
              <button key={t} onClick={() => toggleTip(t)} aria-pressed={on}
                className="w-full min-h-12 py-2 flex gap-3 items-center text-left bg-transparent border-0 text-[16px]"
                style={{ color: theme.text, borderBottom: `1px solid ${theme.line}` }}>
                <span className="w-6 h-6 shrink-0 flex items-center justify-center"
                  style={on ? { background: theme.done, color: theme.onAcc } : { border: `1px solid ${theme.edge}` }}>
                  {on && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" aria-hidden="true"><path d="M4 12l5 5L20 6" /></svg>}
                </span>
                {t}
              </button>
            );
          })}
          {tipError && <p role="alert" className="m-0 mt-2 text-sm" style={{ color: theme.danger }}>{tipError}</p>}
        </section>
      )}

      <div className="grid grid-cols-7 gap-1.5" role="tablist" aria-label="Giorni">
        {SHORT.map((s, i) => {
          const on = i === sel;
          return (
            <button key={s} role="tab" aria-selected={on} aria-label={plan.data.giorni[i].nome} onClick={() => setSel(i)}
              className="theme-card theme-action h-[62px] rounded-[20px] border-0 text-[13px] font-bold flex flex-col items-center justify-center gap-1.5"
              style={{ background: on ? theme.acc : theme.surf, color: on ? theme.onAcc : theme.text }}>
              {s}
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: i === todayIdx ? (on ? theme.onAcc : theme.acc) : 'transparent' }} />
            </button>
          );
        })}
      </div>

      <h2 className="font-display text-[22px] font-semibold m-0 mt-1">{day.nome}</h2>

      <div className="flex flex-col gap-2.5">
        {day.pasti.map((t, i) => (
          <div key={i} className="theme-card rounded-[22px] px-4 py-3.5" style={{ background: theme.surf }}>
            <p className="m-0 text-[13px] font-bold" style={{ color: MEAL_TINTS[i] }}>{MEAL_TYPES[i]}</p>
            <p className="m-0 text-[15px] leading-snug">{t}</p>
          </div>
        ))}
      </div>

      {plan.data.consigli?.length > 0 && (
        <div className="rounded-[22px] px-4 py-3.5 text-sm leading-relaxed flex flex-col gap-1.5"
          style={{ border: `1.5px dashed ${theme.surf2}`, color: theme.muted }}>
          {plan.data.consigli.map((c) => <p key={c} className="m-0">{c}</p>)}
        </div>
      )}
    </div>
  );
}
