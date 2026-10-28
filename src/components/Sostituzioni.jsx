import { useRef, useState } from 'react';
import Sheet, { outlineStyle } from './Sheet';
import { CheckIcon } from './Icons';

// Gruppi di sostituzione pertinenti a un pasto, in base alle parole del testo
export function groupsFor(plan, text) {
  const t = text.toLowerCase();
  return (plan.data.sostituzioni || []).filter((g) => g.parole.some((p) => new RegExp(`\\b${p}\\b`).test(t)));
}

export default function Sostituzioni({ plan, theme, mealType, text, current, onPick, onClear, onClose }) {
  const groups = groupsFor(plan, text);
  const [tab, setTab] = useState(0);
  const tabs = useRef([]);
  const g = groups[tab];

  const onKey = (e) => {
    const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!d) return;
    e.preventDefault();
    const n = (tab + d + groups.length) % groups.length;
    setTab(n);
    tabs.current[n]?.focus();
  };

  return (
    <Sheet theme={theme} title={`Sostituisci: ${mealType.toLowerCase()}`} subtitle={text} onClose={onClose}>
      {current && (
        <div className="mb-4 flex justify-between items-center gap-3 pl-3 py-1 pr-1" style={{ border: `1px solid ${theme.acc}` }}>
          <span className="text-[15px] min-w-0">Scelto: <b>{current}</b></span>
          <button onClick={onClear} className="label min-h-11 px-3 shrink-0" style={outlineStyle(theme, theme.danger)}>Rimuovi</button>
        </div>
      )}

      {groups.length > 1 && (
        <div className="flex gap-2 flex-wrap mb-4" role="tablist" aria-label="Cosa sostituire" onKeyDown={onKey}>
          {groups.map((x, i) => {
            const on = i === tab;
            return (
              <button key={x.id} ref={(el) => { tabs.current[i] = el; }} role="tab" aria-selected={on} tabIndex={on ? 0 : -1}
                onClick={() => setTab(i)} className="label min-h-11 px-4"
                style={{ background: on ? theme.surf2 : 'transparent', color: on ? theme.acc : theme.text, border: `1px solid ${on ? theme.acc : theme.edge}` }}>
                {x.titolo}
              </button>
            );
          })}
        </div>
      )}

      {!g && <p className="m-0 text-[16px]" style={{ color: theme.muted }}>Per questo pasto non ci sono sostituzioni nel piano.</p>}
      {g?.sezioni.map((s) => (
        <section key={s.nome} className="mb-5" role={groups.length > 1 ? 'tabpanel' : undefined}>
          <h3 className="label m-0 pb-2" style={{ color: theme.muted, borderBottom: `1px solid ${theme.line}` }}>{s.nome}</h3>
          {s.opzioni.map(([name, qty]) => {
            const label = `${qty} ${name.toLowerCase()} al posto di ${g.titolo}`;
            const on = current === label;
            return (
              <button key={name} onClick={() => onPick(label)} aria-pressed={on}
                className="w-full flex items-center gap-3 min-h-[52px] py-2 text-left bg-transparent border-0 text-[16px]"
                style={{ color: theme.text, borderBottom: `1px solid ${theme.line}` }}>
                <span className="w-6 h-6 shrink-0 flex items-center justify-center"
                  style={on ? { background: theme.acc, color: theme.onAcc } : { border: `1px solid ${theme.edge}` }}>
                  {on && <CheckIcon />}
                </span>
                <span className="flex-1 min-w-0">{name}</span>
                <span className="font-display font-semibold text-[19px] whitespace-nowrap" style={{ color: on ? theme.acc : theme.text }}>{qty}</span>
              </button>
            );
          })}
        </section>
      ))}
      {g?.nota && <p className="m-0 text-[14px] leading-relaxed" style={{ color: theme.muted }}>{g.nota}</p>}
    </Sheet>
  );
}
