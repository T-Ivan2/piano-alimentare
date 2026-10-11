import { useState } from 'react';
import { weekdayIndex, MEAL_TYPES, MEAL_TINTS } from '../dates';

const SHORT = ['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM'];

export default function Settimana({ plan, theme }) {
  const todayIdx = weekdayIndex(new Date());
  const [sel, setSel] = useState(todayIdx);
  const day = plan.data.giorni[sel];

  return (
    <div className="flex flex-col gap-4">
      <header>
        <p className="text-muted m-0 text-sm">{plan.title} · {plan.month_label}</p>
        <h1 className="font-display text-[30px] font-semibold m-0">La settimana</h1>
      </header>

      <div className="grid grid-cols-7 gap-1.5" role="tablist" aria-label="Giorni">
        {SHORT.map((s, i) => {
          const on = i === sel;
          return (
            <button key={s} role="tab" aria-selected={on} aria-label={plan.data.giorni[i].nome} onClick={() => setSel(i)}
              className="h-[62px] rounded-[20px] border-0 text-[13px] font-bold flex flex-col items-center justify-center gap-1.5"
              style={{ background: on ? theme.acc : theme.surf, color: on ? '#1A1512' : '#F3EADD' }}>
              {s}
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: i === todayIdx ? (on ? '#1A1512' : theme.acc) : 'transparent' }} />
            </button>
          );
        })}
      </div>

      <h2 className="font-display text-[22px] font-semibold m-0 mt-1">{day.nome}</h2>

      <div className="flex flex-col gap-2.5">
        {day.pasti.map((t, i) => (
          <div key={i} className="rounded-[22px] px-4 py-3.5" style={{ background: theme.surf }}>
            <p className="m-0 text-[13px] font-bold" style={{ color: MEAL_TINTS[i] }}>{MEAL_TYPES[i]}</p>
            <p className="m-0 text-[15px] leading-snug">{t}</p>
          </div>
        ))}
      </div>

      {plan.data.consigli?.length > 0 && (
        <div className="rounded-[22px] px-4 py-3.5 text-sm leading-relaxed flex flex-col gap-1.5"
          style={{ border: `1.5px dashed ${theme.surf2}`, color: '#C9BBA8' }}>
          {plan.data.consigli.map((c) => <p key={c} className="m-0">{c}</p>)}
        </div>
      )}
    </div>
  );
}
