import { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabase';
import { weekdayIndex, isoDay, startOfWeek, addDays, toMinutes, MEAL_TYPES } from '../dates';
import { SwapIcon, CheckIcon } from '../components/Icons';
import useMealTimes from '../hooks/useMealTimes';

const SHORT = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
const GLASS_ML = 250;
const mealName = (i) => MEAL_TYPES[i] || `Pasto ${i + 1}`;
const litres = (ml) => (ml / 1000).toLocaleString('it-IT', { maximumFractionDigits: 2 });

// Settimana: il piano per i giorni che vengono, il diario per quelli già passati
export default function Settimana({ plan, theme, user }) {
  const now = new Date();
  const todayIdx = weekdayIndex(now);
  const start = startOfWeek(now);
  const dates = SHORT.map((_, i) => addDays(start, i));
  const today = isoDay(now);
  const times = useMealTimes();
  const tips = plan.data.indicazioni || [];
  const notes = plan.data.consigli || [];

  const [sel, setSel] = useState(todayIdx);
  const [logs, setLogs] = useState({});
  const [tipError, setTipError] = useState('');
  const [loadOk, setLoadOk] = useState(false); // senza lettura riuscita non si scrive, per non sovrascrivere il diario
  const tabs = useRef([]);

  useEffect(() => {
    supabase.from('day_logs').select('*').gte('day', isoDay(start)).lte('day', isoDay(dates[6]))
      .then(({ data, error }) => {
        if (error) { setTipError("Non riesco a leggere il diario: sei offline? Riapri la scheda per riprovare."); return; }
        setLogs(Object.fromEntries((data || []).map((r) => [r.day, r])));
        setLoadOk(true);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Correggere un giorno già passato: si scrive solo la colonna dei pasti di quel giorno
  const toggleDayMeal = async (iso, i) => {
    if (!loadOk) return;
    const prev = logs[iso]?.meals || {};
    const meals = { ...prev, [i]: !prev[i] };
    setLogs((l) => ({ ...l, [iso]: { ...(l[iso] || { day: iso }), meals } }));
    const { error } = await supabase.from('day_logs').upsert({ user_id: user.id, day: iso, meals, updated_at: new Date().toISOString() });
    if (error) {
      setLogs((l) => ({ ...l, [iso]: { ...(l[iso] || { day: iso }), meals: prev } }));
      setTipError('Non sono riuscito a salvare, riprova.');
    } else setTipError('');
  };

  const checks = logs[today]?.checks || {};
  // I consigli del mese si spuntano ogni giorno: stanno nel diario di oggi
  const toggleTip = async (t) => {
    if (!loadOk) return;
    const next = { ...checks, [t]: !checks[t] };
    setLogs((l) => ({ ...l, [today]: { ...(l[today] || { day: today }), checks: next } }));
    const { error } = await supabase.from('day_logs')
      .upsert({ user_id: user.id, day: today, checks: next, updated_at: new Date().toISOString() });
    setTipError(error ? 'Non sono riuscito a salvare, riprova.' : '');
  };

  // Frecce sinistra/destra tra i giorni, come si aspetta una lista di schede
  const onKey = (e) => {
    const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (e.key === 'Home' || e.key === 'End' || d) {
      e.preventDefault();
      const n = e.key === 'Home' ? 0 : e.key === 'End' ? 6 : (sel + d + 7) % 7;
      setSel(n);
      tabs.current[n]?.focus();
    }
  };

  const day = plan.data.giorni?.[sel] || { nome: '', pasti: [] };
  const iso = isoDay(dates[sel]);
  const log = logs[iso];
  const isPast = sel <= todayIdx; // oggi compreso: c'è già un diario
  const doneCount = day.pasti.filter((_, i) => log?.meals?.[i]).length;
  const dateLabel = dates[sel].toLocaleDateString('it-IT', { day: 'numeric', month: 'long' });
  const nowMin = now.getHours() * 60 + now.getMinutes();
  // Oggi: un pasto non ancora arrivato è "Dopo", l'ultimo arrivato non fatto è "Adesso", gli altri "Aperto"
  const arrived = (i) => !times[i] || toMinutes(times[i]) <= nowMin;
  const stateOf = (i, done) => {
    if (done) return 'Fatto';
    if (sel !== todayIdx) return 'Aperto';
    if (!arrived(i)) return 'Dopo';
    return arrived(i + 1) && i + 1 < day.pasti.length ? 'Aperto' : 'Adesso';
  };

  return (
    <div className="flex flex-col">
      <header>
        <h1 className="font-display text-[26px] leading-[1.1] font-bold m-0">La settimana</h1>
        <p className="m-0 mt-1 text-[15px]" style={{ color: theme.muted }}>{plan.title} · {plan.month_label}</p>
      </header>

      <div className="mt-4 grid grid-cols-7 gap-1" role="tablist" aria-label="Giorni della settimana" onKeyDown={onKey}>
        {SHORT.map((s, i) => {
          const on = i === sel;
          const dayLog = logs[isoDay(dates[i])];
          const meals = plan.data.giorni?.[i]?.pasti || [];
          const past = i <= todayIdx;
          return (
            <button key={s} ref={(el) => { tabs.current[i] = el; }} role="tab" aria-selected={on} tabIndex={on ? 0 : -1}
              aria-controls="giorno" id={`tab-${i}`}
              aria-label={`${plan.data.giorni?.[i]?.nome || s} ${dates[i].getDate()}${i === todayIdx ? ', oggi' : ''}`}
              onClick={() => setSel(i)}
              className="min-h-[64px] px-0 pt-2 pb-1.5 flex flex-col items-center gap-1 border-0"
              style={{ background: on ? theme.surf : 'transparent', color: on ? theme.acc : theme.text,
                boxShadow: on ? `inset 0 2px ${theme.acc}` : `inset 0 -1px ${theme.line}` }}>
              <span className="label text-[11px]" style={{ color: on ? theme.acc : i === todayIdx ? theme.text : theme.muted }}>
                {i === todayIdx ? 'Oggi' : s}
              </span>
              <span className="font-display font-bold text-[22px] leading-none">{dates[i].getDate()}</span>
              <span className="flex gap-[2px] h-1.5" aria-hidden="true">
                {past && meals.map((_, m) => (
                  <span key={m} className="w-1.5 h-1.5" style={dayLog?.meals?.[m] ? { background: theme.done } : { border: `1px solid ${theme.edge}` }} />
                ))}
              </span>
            </button>
          );
        })}
      </div>

      <section id="giorno" role="tabpanel" aria-labelledby={`tab-${sel}`} className="mt-5">
        <div className="flex justify-between items-baseline gap-3">
          <h2 className="font-display text-[22px] leading-tight font-bold m-0">{day.nome} {dateLabel}</h2>
          <span className="label shrink-0" style={{ color: theme.muted }}>
            {isPast ? `${doneCount}/${day.pasti.length} fatti` : 'In programma'}
          </span>
        </div>
        {isPast && log?.water > 0 && (
          <p className="label m-0 mt-1" style={{ color: theme.done }}>Acqua {litres(log.water * GLASS_ML)} L</p>
        )}

        <div className={`mt-3 grid ${isPast ? 'grid-cols-[52px_1fr_96px]' : 'grid-cols-[52px_1fr]'} gap-3 pb-1 label text-[11px]`}
          style={{ color: theme.muted, borderBottom: `1px solid ${theme.line}` }} aria-hidden="true">
          <span>Ora</span><span>Pasto</span>{isPast && <span className="text-center">Stato</span>}
        </div>
        {day.pasti.map((text, i) => {
          const done = !!log?.meals?.[i];
          const sub = log?.subs?.[i];
          return (
            <div key={i} className={`grid ${isPast ? 'grid-cols-[52px_1fr_96px]' : 'grid-cols-[52px_1fr]'} gap-3 items-start py-3`}
              style={{ borderBottom: `1px solid ${theme.line}` }}>
              <span className="font-display font-semibold text-[19px] leading-tight" style={{ color: done ? theme.muted : theme.text }}>{times[i] || ''}</span>
              <div className="min-w-0">
                <p className="m-0 font-display font-bold uppercase tracking-wide text-[19px] leading-tight" style={{ color: done ? theme.muted : theme.text }}>{mealName(i)}</p>
                {sub ? (
                  <>
                    <p className="m-0 mt-1 text-[15px] leading-snug flex gap-1.5" style={{ color: theme.text }}><SwapIcon /> <span>{sub}</span></p>
                    <p className="m-0 mt-0.5 text-[14px] leading-snug line-through" style={{ color: theme.muted }}>{text}</p>
                  </>
                ) : (
                  <p className="m-0 mt-1 text-[15px] leading-snug" style={{ color: done ? theme.muted : theme.text }}>{text}</p>
                )}
              </div>
              {isPast && (() => {
                const st = stateOf(i, done);
                return (
                  <button onClick={() => toggleDayMeal(iso, i)} disabled={!loadOk} aria-pressed={done}
                    aria-label={`${mealName(i)} di ${day.nome}: ${st.toLowerCase()}. ${done ? 'Tocca per annullare' : 'Segna come fatto'}`}
                    className="label min-h-11 px-1 flex items-center justify-center gap-1.5 disabled:opacity-40"
                    style={done ? { background: theme.done, color: theme.onAcc, border: `1px solid ${theme.done}` }
                      : { background: 'transparent', color: st === 'Adesso' ? theme.acc : theme.text, border: `1px solid ${st === 'Adesso' ? theme.acc : theme.edge}` }}>
                    {done ? <CheckIcon size={12} /> : <span className="w-3 h-3 shrink-0" style={{ border: '1.5px solid currentColor' }} aria-hidden="true" />}{st}
                  </button>
                );
              })()}
            </div>
          );
        })}
      </section>

      {tips.length > 0 && (
        <section aria-labelledby="consigli" className="mt-6">
          <h2 id="consigli" className="label m-0 pb-2" style={{ color: theme.muted, borderBottom: `1px solid ${theme.line}` }}>Da fare oggi</h2>
          {tips.map((t) => {
            const on = !!checks[t];
            return (
              <button key={t} onClick={() => toggleTip(t)} aria-pressed={on}
                className="w-full min-h-12 py-2 flex gap-3 items-center text-left bg-transparent border-0 text-[16px]"
                style={{ color: theme.text, borderBottom: `1px solid ${theme.line}` }}>
                <span className="w-6 h-6 shrink-0 flex items-center justify-center"
                  style={on ? { background: theme.done, color: theme.onAcc } : { border: `1px solid ${theme.edge}` }}>
                  {on && <CheckIcon />}
                </span>
                {t}
              </button>
            );
          })}
          {tipError && <p role="alert" className="m-0 mt-2 text-sm" style={{ color: theme.danger }}>{tipError}</p>}
        </section>
      )}

      {notes.length > 0 && (
        <section aria-labelledby="note" className="mt-6">
          <h2 id="note" className="label m-0 pb-2" style={{ color: theme.muted, borderBottom: `1px solid ${theme.line}` }}>Note del piano</h2>
          {notes.map((c) => (
            <p key={c} className="m-0 py-2.5 text-[15px] leading-relaxed text-pretty" style={{ borderBottom: `1px solid ${theme.line}` }}>{c}</p>
          ))}
        </section>
      )}
    </div>
  );
}
