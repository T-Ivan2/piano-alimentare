import { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabase';
import ThemeBand from '../components/ThemeBand';
import Sostituzioni, { groupsFor } from '../components/Sostituzioni';
import Promemoria from '../components/Promemoria';
import GestionePiano from '../components/GestionePiano';
import Revisione from '../components/Revisione';
import { SwapIcon, CheckIcon } from '../components/Icons';
import useMealTimes from '../hooks/useMealTimes';
import { readCache, writeCache } from '../cache';
import { weekdayIndex, isoDay, startOfWeek, longDate, MEAL_TYPES, toMinutes } from '../dates';

const GLASS_ML = 250;
const empty = { meals: {}, water: 0, checks: {}, subs: {} };
const litres = (ml) => (ml / 1000).toLocaleString('it-IT', { maximumFractionDigits: 2 });
const mealName = (i) => MEAL_TYPES[i] || `Pasto ${i + 1}`;
const pad = (n) => String(n).padStart(2, '0');
const clock = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const stamp = (d) => `${d.toLocaleDateString('it-IT', { weekday: 'short' }).replace('.', '')} ${pad(d.getDate())}.${pad(d.getMonth() + 1)} · ${clock(d)}`;
// Il pasto "di adesso": l'ultimo il cui orario è arrivato; se è già fatto, il primo non fatto dopo di lui.
// Prima del primo orario è la colazione. Null quando dal pasto attuale in poi è tutto fatto.
function focusIndex(count, times, done, nowMin) {
  let cur = 0;
  for (let i = 0; i < count; i++) if (times[i] != null && toMinutes(times[i]) <= nowMin) cur = i;
  for (let i = cur; i < count; i++) if (!done[i]) return { focus: i, current: cur };
  return { focus: null, current: cur };
}

export default function Oggi({ plan, theme, user, themesOn, onToggleThemes, onPlanChanged, pending }) {
  const [now, setNow] = useState(() => new Date());
  const [today] = useState(() => isoDay(new Date()));
  const wd = weekdayIndex(now);
  const meals = plan.data.giorni?.[wd]?.pasti || [];
  const tomorrow = plan.data.giorni?.[(wd + 1) % 7]?.pasti?.[0];
  const glasses = Math.round((plan.data.acqua_ml || 2500) / GLASS_ML);

  const [log, setLog] = useState(empty);
  // 'loading' | 'ok' | 'offline' (copia locale) | 'error' (nessuna copia: non si salva per non sovrascrivere)
  const [status, setStatus] = useState('loading');
  const [week, setWeek] = useState({ done: 0 });
  const times = useMealTimes();
  const [menu, setMenu] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [swap, setSwap] = useState(null);
  const [reminders, setReminders] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [review, setReview] = useState(false);
  const [moves, setMoves] = useState(0);
  const [announce, setAnnounce] = useState('');
  const menuBox = useRef(null);

  // L'orologio sposta il pasto di adesso; a mezzanotte si ricarica per non scrivere sul giorno sbagliato
  useEffect(() => {
    const id = setInterval(() => {
      const d = new Date();
      if (isoDay(d) !== today) window.location.reload();
      else setNow(d);
    }, 30000);
    return () => clearInterval(id);
  }, [today]);

  // Il menu del profilo si chiude con Esc o toccando fuori
  useEffect(() => {
    if (!menu) return;
    const onKey = (e) => { if (e.key === 'Escape') setMenu(false); };
    const onDown = (e) => { if (!menuBox.current?.contains(e.target)) setMenu(false); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', onDown); };
  }, [menu]);

  const load = () => {
    setStatus('loading');
    supabase.from('day_logs').select('*')
      .gte('day', isoDay(startOfWeek(now))).lte('day', today)
      .then(({ data, error }) => {
        if (error) {
          // Senza rete: si riparte dalla copia locale di oggi, se c'è; altrimenti si blocca il salvataggio
          const cached = readCache(`diario:${today}`);
          if (cached) { latest.current = cached; setLog(cached); setStatus('offline'); } else setStatus('error');
          return;
        }
        const rows = data || [];
        const t = rows.find((r) => r.day === today);
        if (t) { latest.current = { meals: t.meals || {}, water: t.water || 0, checks: t.checks || {}, subs: t.subs || {} }; setLog(latest.current); }
        writeCache(`diario:${today}`, latest.current);
        const others = rows.filter((r) => r.day !== today)
          .reduce((n, r) => n + Object.values(r.meals || {}).filter(Boolean).length, 0);
        setWeek({ done: others });
        setStatus('ok');
      });
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, []);

  // Salvataggi in fila: ognuno parte dallo stato più recente e scrive dopo il precedente,
  // così due tocchi veloci non si sovrascrivono
  const latest = useRef(log);
  const queue = useRef(Promise.resolve());
  const canSave = status === 'ok' || status === 'offline';
  const save = (change) => {
    if (!canSave) return;
    const next = typeof change === 'function' ? change(latest.current) : change;
    latest.current = next;
    setLog(next);
    writeCache(`diario:${today}`, next);
    queue.current = queue.current.then(async () => {
      const { error } = await supabase.from('day_logs')
        .upsert({ user_id: user.id, day: today, ...latest.current, updated_at: new Date().toISOString() });
      setSaveError(error ? latest.current : null);
    });
  };

  const done = meals.map((_, i) => !!log.meals[i]);
  const doneToday = done.filter(Boolean).length;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const { focus, current } = focusIndex(meals.length, times, done, nowMin);
  const weekTotal = (wd + 1) * meals.length;

  const toggleMeal = (i) => {
    if (!canSave) return;
    setMoves((m) => m + 1);
    const was = !!latest.current.meals[i];
    save((l) => ({ ...l, meals: { ...l.meals, [i]: !l.meals[i] } }));
    // annuncio per chi usa un lettore di schermo: cosa è cambiato e qual è il pasto di adesso
    const after = meals.map((_, k) => (k === i ? !was : done[k]));
    const next = focusIndex(meals.length, times, after, nowMin).focus;
    setAnnounce(`${mealName(i)} ${was ? 'da fare' : 'segnato come fatto'}. ${next === null ? 'Per oggi è tutto.' : `Ora: ${mealName(next)} alle ${times[next] || ''}.`}`);
  };

  return (
    <div className="flex flex-col">
      <p className="sr-only" aria-live="polite">{announce}</p>
      <header className="flex justify-between items-start gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-[26px] leading-[1.1] font-bold m-0">{theme.greet}</h1>
          <p className="label m-0 mt-1.5" style={{ color: theme.muted }}>
            <time dateTime={now.toISOString()} aria-label={`${longDate(now)}, ore ${clock(now)}`}>{stamp(now)}</time>
          </p>
          <p className="m-0 mt-0.5 text-[15px]" style={{ color: theme.muted }}>{theme.tag}</p>
        </div>
        <div ref={menuBox} className="relative shrink-0">
          <button onClick={() => setMenu(!menu)} aria-label="Profilo e impostazioni" aria-expanded={menu}
            className="cut-tl w-11 h-11 font-display font-bold text-base"
            style={{ background: theme.surf2, color: theme.text, border: `1px solid ${theme.edge}` }}>IT</button>
          {menu && (
            <div className="absolute right-0 top-12 z-20 w-64 p-1 flex flex-col" style={{ background: theme.surf, border: `1px solid ${theme.edge}` }}>
              {[['Gestisci il piano', () => { setAdmin(true); setMenu(false); }],
                ['Promemoria e notifiche', () => { setReminders(true); setMenu(false); }]].map(([l, f]) => (
                <button key={l} onClick={f} className="text-left px-3 min-h-12 bg-transparent border-0 text-[16px]" style={{ color: theme.text }}>{l}</button>
              ))}
              <button onClick={onToggleThemes} className="text-left px-3 min-h-12 bg-transparent border-0 text-[16px]" style={{ color: theme.text }}>
                Temi stagionali: <b>{themesOn ? 'attivi' : 'spenti'}</b>
              </button>
              <div className="mx-3 my-1 h-px" style={{ background: theme.line }} />
              <button onClick={() => supabase.auth.signOut()} className="text-left px-3 min-h-12 bg-transparent border-0 text-[16px]" style={{ color: theme.danger }}>
                Esci
              </button>
            </div>
          )}
        </div>
      </header>
      <ThemeBand theme={theme} className="-mx-4 sm:-mx-5" />
      <div className="ruler -mx-4 sm:-mx-5" />

      {pending && (
        <button onClick={() => setReview(true)} className="theme-action mt-3 px-4 py-3 flex items-center gap-3 text-left"
          style={{ background: theme.surf, color: theme.text, border: `1px solid ${theme.acc}` }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={theme.acc} strokeWidth="2" strokeLinecap="square" aria-hidden="true"><path d="M3 5h18v14H3z" /><path d="M3 7l9 6 9-6" /></svg>
          <span className="flex-1">
            <span className="block font-display font-bold text-[17px] uppercase tracking-wide">Nuovo piano di Carlotta</span>
            <span className="block text-sm" style={{ color: theme.muted }}>Tocca per verificarlo e confermarlo</span>
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
        </button>
      )}

      {status === 'offline' && (
        <p role="status" className="m-0 mt-3 px-3 py-2 text-[15px]" style={{ border: `1px solid ${theme.edge}`, color: theme.muted }}>
          Sei offline: vedi l'ultima copia salvata sul telefono.
        </p>
      )}

      {status === 'error' && (
        <div role="alert" className="mt-3 px-3 py-3 flex items-center justify-between gap-3" style={{ border: `1px solid ${theme.danger}`, background: theme.surf }}>
          <span className="text-[16px]">Non riesco a leggere la giornata. Finché non la leggo non segno niente, per non perdere i dati.</span>
          <button onClick={load} className="label min-h-11 px-3 shrink-0" style={{ color: theme.danger, border: `1px solid ${theme.danger}`, background: 'transparent' }}>Riprova</button>
        </div>
      )}
      {canSave && (
        <NowPanel key={focus ?? 'fine'} animate={moves > 0} theme={theme} plan={plan}
          i={focus} meals={meals} times={times} current={current} log={log} doneToday={doneToday}
          tomorrow={tomorrow} onDone={toggleMeal} onSwap={setSwap} />
      )}
      {status === 'loading' && <div className="mt-3 h-[220px]" style={{ background: theme.surf }} aria-busy="true" aria-label="Caricamento del pasto" />}

      {saveError && (
        <div role="alert" className="mt-2 flex items-center justify-between gap-3 px-3 py-2 text-[15px]" style={{ border: `1px solid ${theme.danger}`, color: theme.text }}>
          <span>Non sono riuscito a salvare.</span>
          <button onClick={() => save(saveError)} className="label min-h-11 px-3 bg-transparent" style={{ color: theme.danger, border: `1px solid ${theme.danger}` }}>Riprova</button>
        </div>
      )}

      <section className="mt-4" aria-labelledby="acqua">
        <div className="flex justify-between items-baseline">
          <h2 id="acqua" className="label m-0" style={{ color: theme.muted }}>Acqua</h2>
          <span className="label" style={{ color: theme.done }}>{litres(log.water * GLASS_ML)} / {litres(glasses * GLASS_ML)} L</span>
        </div>
        <div className="mt-2 grid gap-1" style={{ gridTemplateColumns: `repeat(${glasses}, minmax(0, 1fr))` }}>
          {Array.from({ length: glasses }, (_, i) => {
            const on = i < log.water;
            return (
              <button key={i} disabled={!canSave} aria-label={`${i + 1} ${i === 0 ? 'bicchiere' : 'bicchieri'} su ${glasses}`} aria-pressed={on}
                onClick={() => save((l) => ({ ...l, water: l.water === i + 1 ? i : i + 1 }))}
                className="h-11 p-0 disabled:opacity-40" style={{ background: on ? theme.done : theme.surf, border: `1px solid ${on ? theme.done : theme.edge}` }} />
            );
          })}
        </div>
      </section>

      <section className="mt-5" aria-labelledby="giornata">
        <div className="flex justify-between items-baseline pb-2" style={{ borderBottom: `1px solid ${theme.line}` }}>
          <h2 id="giornata" className="label m-0" style={{ color: theme.muted }}>La giornata</h2>
          <span className="label" style={{ color: theme.muted }}>{doneToday}/{meals.length} oggi · {week.done + doneToday}/{weekTotal} sett.</span>
        </div>
        <div className="grid grid-cols-[52px_1fr_96px] gap-3 pt-1.5 pb-0.5 label text-[11px]" style={{ color: theme.muted }} aria-hidden="true">
          <span>Ora</span><span>Pasto</span><span className="text-center">Stato</span>
        </div>
        {meals.map((text, i) => (
          <MealRow key={i} i={i} text={text} time={times[i]} done={done[i]} isFocus={i === focus} disabled={!canSave}
            state={done[i] ? 'Fatto' : i === focus ? (focus > current ? 'Prossimo' : 'Adesso') : i < current ? 'Aperto' : 'Dopo'}
            sub={log.subs[i]} canSwap={groupsFor(plan, text).length > 0} theme={theme}
            onToggle={() => toggleMeal(i)} onSwap={() => setSwap(i)} />
        ))}
      </section>

      {review && pending && <Revisione theme={theme} pending={pending} activePlan={plan} onClose={() => setReview(false)}
        onDone={(keep) => { onPlanChanged(); if (!keep) setReview(false); }} />}
      {admin && <GestionePiano theme={theme} activePlan={plan} onClose={() => setAdmin(false)} onChanged={onPlanChanged} />}
      {reminders && <Promemoria theme={theme} user={user} onClose={() => setReminders(false)} />}

      {swap !== null && (
        <Sostituzioni plan={plan} theme={theme} mealType={mealName(swap)} text={meals[swap]} current={log.subs[swap]}
          onPick={(label) => { const k = swap; save((l) => ({ ...l, subs: { ...l.subs, [k]: label } })); setSwap(null); }}
          onClear={() => { const k = swap; save((l) => { const s = { ...l.subs }; delete s[k]; return { ...l, subs: s }; }); setSwap(null); }}
          onClose={() => setSwap(null)} />
      )}
    </div>
  );
}

// Pannello del pasto di adesso; a giornata finita mostra la chiusura e la colazione di domani
function NowPanel({ animate, theme, plan, i, meals, times, current, log, doneToday, tomorrow, onDone, onSwap }) {
  const [glitch] = useState(animate); // solo all'ingresso di un nuovo pasto, mai all'apertura dell'app
  const cls = `cut-br mt-3 p-px ${glitch ? 'glitch-in' : ''}`;
  const style = { '--cut': '20px', background: theme.edge };
  const inner = { '--cut': '19.6px', background: theme.surf };

  if (i === null) {
    const all = doneToday === meals.length;
    return (
      <section className={cls} style={style}>
        <div className="cut-br px-4 py-3" style={inner}>
        <h2 className="font-display font-bold uppercase text-[40px] leading-none m-0" style={{ color: theme.acc }}>
          {all ? 'Giornata completa' : 'Per oggi è tutto'}
        </h2>
        <p className="m-0 mt-3 text-[17px] leading-snug">
          {all ? `${meals.length} pasti su ${meals.length}. ${theme.tag}.` : 'I pasti non segnati restano qui sotto: puoi segnarli ora o, nei prossimi giorni, da Settimana.'}
        </p>
        {tomorrow && (
          <p className="m-0 mt-4 pt-3 text-[15px]" style={{ borderTop: `1px solid ${theme.line}`, color: theme.muted }}>
            <span className="label" style={{ color: theme.text }}>Domani a colazione</span><br />{tomorrow}
          </p>
        )}
        </div>
      </section>
    );
  }

  const text = meals[i];
  const ahead = i > current;
  const canSwap = groupsFor(plan, text).length > 0;
  return (
    <section className={cls} style={style} aria-labelledby="adesso">
      <div className="cut-br px-4 py-3" style={inner}>
      <div className="flex justify-between items-start gap-3">
        <h2 id="adesso" className="font-display font-bold uppercase text-[48px] leading-[.9] m-0 min-w-0 break-words" style={{ color: theme.acc }}>
          {mealName(i)}
        </h2>
        <p className="m-0 pt-1 text-right shrink-0">
          <span className="block font-display font-bold text-[22px] leading-none">{times[i] || ''}</span>
          <span className="label block mt-1" style={{ color: theme.acc }}>{ahead ? 'Prossimo' : 'Adesso'}</span>
        </p>
      </div>
      <p className="m-0 mt-3 text-[18px] leading-[1.4]">{text}</p>
      {log.subs[i] && (
        <p className="m-0 mt-2 text-[15px] flex gap-2 items-start">
          <span style={{ color: theme.muted }}><SwapIcon /></span> <span>{log.subs[i]}</span>
        </p>
      )}
      <div className="mt-4 flex justify-between items-center gap-3">
        {canSwap ? (
          <button onClick={() => onSwap(i)} className="label min-h-12 px-4 bg-transparent"
            style={{ color: theme.text, border: `1px solid ${theme.edge}` }}>
            {log.subs[i] ? 'Cambia' : 'Sostituisci'}
          </button>
        ) : <span />}
        <button onClick={() => onDone(i)} className="cut-br theme-action label min-h-12 px-7 border-0 text-[17px]"
          style={{ background: theme.acc, color: theme.onAcc }} aria-label={`Segna ${mealName(i)} come fatto`}>
          Fatto
        </button>
      </div>
      </div>
    </section>
  );
}

// Riga del tabellone: orario, pasto, stato. Lo stato è una parola e insieme il tasto per segnare il pasto;
// sulla riga a fuoco è solo un indicatore, perché il tasto è nel pannello sopra.
function MealRow({ i, text, time, done, isFocus, disabled, state, sub, canSwap, theme, onToggle, onSwap }) {
  const Body = canSwap ? 'button' : 'div';
  const tone = done ? theme.muted : theme.text;
  return (
    <div className={`grid grid-cols-[52px_1fr_96px] gap-3 items-center py-1.5 ${isFocus ? '-mx-2 px-2' : ''}`}
      style={isFocus ? { background: theme.surf, outline: `1px solid ${theme.acc}`, outlineOffset: '-1px' } : { borderBottom: `1px solid ${theme.line}` }}>
      <span className="font-display font-semibold text-[19px]" style={{ color: isFocus ? theme.acc : tone }}>{time || ''}</span>
      <Body {...(canSwap ? { onClick: onSwap, 'aria-label': `${mealName(i)}: ${text}. Sostituisci` } : {})}
        className="min-w-0 text-left bg-transparent border-0 p-0 py-1" style={{ color: theme.text }}>
        <span className="flex items-center gap-1.5 font-display font-bold uppercase tracking-wide text-[19px] leading-tight" style={{ color: tone }}>
          {mealName(i)}{canSwap && <span style={{ color: theme.muted }}><SwapIcon /></span>}
        </span>
        {!isFocus && <span className="text-[14px] leading-snug line-clamp-1" style={{ color: theme.muted }}>{sub || text}</span>}
      </Body>
      {isFocus ? (
        <span className="label min-h-11 flex items-center justify-center gap-1.5" style={{ color: theme.acc }}>
          <span className="w-2 h-2 rotate-45 shrink-0" style={{ background: theme.acc }} aria-hidden="true" />{state}
        </span>
      ) : (
        <button onClick={onToggle} aria-pressed={done} disabled={disabled}
          aria-label={done ? `${mealName(i)}: fatto, tocca per annullare` : `${mealName(i)}: ${state.toLowerCase()}. Segna come fatto`}
          className="label min-h-11 px-2 flex items-center justify-center gap-1.5 disabled:opacity-40"
          style={done ? { background: theme.done, color: theme.onAcc, border: `1px solid ${theme.done}` }
            : { background: 'transparent', color: theme.text, border: `1px solid ${theme.edge}` }}>
          {done
            ? <CheckIcon />
            : <span className="w-3 h-3 shrink-0" style={{ border: '1.5px solid currentColor' }} aria-hidden="true" />}
          {state}
        </button>
      )}
    </div>
  );
}
