import { useState } from 'react';

// Gruppi di sostituzione pertinenti a un pasto, in base alle parole del testo
export function groupsFor(plan, text) {
  const t = text.toLowerCase();
  return (plan.data.sostituzioni || []).filter((g) => g.parole.some((p) => new RegExp(`\\b${p}\\b`).test(t)));
}

export default function Sostituzioni({ plan, theme, mealType, text, current, onPick, onClear, onClose }) {
  const groups = groupsFor(plan, text);
  const [tab, setTab] = useState(0);
  const g = groups[tab];

  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center" style={{ background: 'rgba(10,8,6,0.6)' }} onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={`Sostituisci: ${mealType}`} onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md max-h-[88dvh] flex flex-col rounded-t-[28px]" style={{ background: theme.bg }}>
        <div className="px-5 pt-5 pb-3 flex flex-col gap-3">
          <div className="flex justify-between items-start gap-3">
            <div>
              <p className="m-0 text-[13px] font-bold" style={{ color: theme.acc }}>{mealType}</p>
              <h2 className="m-0 font-display text-[24px] font-semibold">Sostituisci</h2>
              <p className="m-0 mt-1 text-sm" style={{ color: '#C9BBA8' }}>{text}</p>
            </div>
            <button onClick={onClose} aria-label="Chiudi" className="w-11 h-11 shrink-0 rounded-full border-0 flex items-center justify-center"
              style={{ background: theme.surf, color: '#F3EADD' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>
          {groups.length > 1 && (
            <div className="flex gap-2 flex-wrap" role="tablist">
              {groups.map((x, i) => (
                <button key={x.id} role="tab" aria-selected={i === tab} onClick={() => setTab(i)}
                  className="h-11 px-4 rounded-full border-0 font-bold text-sm"
                  style={{ background: i === tab ? theme.acc : theme.surf, color: i === tab ? '#1A1512' : '#F3EADD' }}>{x.titolo}</button>
              ))}
            </div>
          )}
          {current && (
            <div className="rounded-2xl px-4 py-3 flex justify-between items-center gap-3 text-sm" style={{ background: theme.surf }}>
              <span>Scelto: <b>{current}</b></span>
              <button onClick={onClear} className="bg-transparent border-0 font-bold" style={{ color: '#F0A08A' }}>Rimuovi</button>
            </div>
          )}
        </div>

        <div className="overflow-y-auto px-5 pb-8 flex flex-col gap-4">
          {!g && <p className="text-muted m-0">Per questo pasto non ci sono sostituzioni nel piano.</p>}
          {g?.sezioni.map((s) => (
            <section key={s.nome} className="flex flex-col gap-2">
              <h3 className="m-0 text-[13px] font-bold uppercase tracking-wide text-muted">{s.nome}</h3>
              {s.opzioni.map(([name, qty]) => {
                const label = `${qty} ${name.toLowerCase()} al posto di ${g.titolo}`;
                const on = current === label;
                return (
                  <button key={name} onClick={() => onPick(label)} aria-pressed={on}
                    className="flex justify-between items-center gap-3 min-h-[52px] px-4 py-2.5 rounded-[18px] text-left text-[15px]"
                    style={{ background: on ? theme.surf2 : theme.surf, border: `2px solid ${on ? theme.acc : 'transparent'}`, color: '#F3EADD' }}>
                    <span>{name}</span>
                    <span className="font-bold whitespace-nowrap" style={{ color: on ? theme.acc : '#C9BBA8' }}>{qty}</span>
                  </button>
                );
              })}
            </section>
          ))}
          {g?.nota && (
            <p className="m-0 rounded-[20px] px-4 py-3 text-[13px] leading-relaxed" style={{ border: `1.5px dashed ${theme.surf2}`, color: '#C9BBA8' }}>{g.nota}</p>
          )}
        </div>
      </div>
    </div>
  );
}
