import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { VAPID_PUBLIC_KEY } from '../config';
import { MEAL_TYPES, MEAL_TIMES } from '../dates';
import Sheet, { fieldStyle, outlineStyle, primaryStyle } from './Sheet';
import { CheckIcon } from './Icons';

const DEFAULTS = { pastiOn: true, pasti: MEAL_TIMES, acquaOn: true, acqua: ['10:30', '12:30', '15:30', '18:00'] };

const keyBytes = (b64) => {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

const supported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

export default function Promemoria({ theme, user, onClose }) {
  const [state, setState] = useState('loading'); // loading | off | on | denied | unsupported
  const [rem, setRem] = useState(DEFAULTS);
  const [endpoint, setEndpoint] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      if (!supported()) return setState('unsupported');
      if (Notification.permission === 'denied') return setState('denied');
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (!sub) return setState('off');
      setEndpoint(sub.endpoint);
      const { data } = await supabase.from('push_subscriptions').select('reminders, enabled').eq('endpoint', sub.endpoint).maybeSingle();
      if (data?.reminders?.pasti) setRem({ ...DEFAULTS, ...data.reminders });
      setState(data?.enabled ? 'on' : 'off');
    })().catch(() => setState('off'));
  }, []);

  const save = async (next, sub) => {
    const s = sub || (await (await navigator.serviceWorker.ready).pushManager.getSubscription());
    if (!s) return;
    const { error } = await supabase.from('push_subscriptions').upsert(
      { user_id: user.id, endpoint: s.endpoint, subscription: s.toJSON(), reminders: next, enabled: true },
      { onConflict: 'endpoint' }
    );
    setMsg(error ? 'Non sono riuscito a salvare: ' + error.message : 'Salvato');
    if (!error) setTimeout(() => setMsg(''), 1500);
  };

  const enable = async () => {
    setMsg('');
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return setState(perm === 'denied' ? 'denied' : 'off');
    const reg = await navigator.serviceWorker.ready;
    const sub = (await reg.pushManager.getSubscription())
      || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID_PUBLIC_KEY) }));
    setEndpoint(sub.endpoint);
    await save(rem, sub);
    setState('on');
  };

  const disable = async () => {
    if (endpoint) await supabase.from('push_subscriptions').update({ enabled: false }).eq('endpoint', endpoint);
    setState('off');
  };

  const update = (next) => { setRem(next); save(next); };

  // Riga con casella quadrata: accende o spegne un gruppo di promemoria
  const Toggle = ({ on, label, onChange }) => (
    <button type="button" onClick={() => onChange(!on)} aria-pressed={on}
      className="w-full min-h-12 flex items-center justify-between gap-3 bg-transparent border-0 p-0 text-left" style={{ color: theme.text }}>
      <span className="font-display font-bold uppercase tracking-wide text-[19px]">{label}</span>
      <span className="label flex items-center gap-2" style={{ color: on ? theme.acc : theme.muted }}>
        {on ? 'Attivi' : 'Spenti'}
        <span className="w-6 h-6 flex items-center justify-center" style={on ? { background: theme.acc, color: theme.onAcc } : { border: `1px solid ${theme.edge}` }}>
          {on && <CheckIcon />}
        </span>
      </span>
    </button>
  );
  const time = 'h-11 px-3 text-[16px] font-display font-semibold';

  return (
    <Sheet theme={theme} title="Promemoria" subtitle="Notifiche per i pasti e l'acqua" onClose={onClose}>
      {state === 'loading' && <p className="m-0 text-[16px]" style={{ color: theme.muted }}>Controllo le notifiche…</p>}
      {state === 'unsupported' && <p className="m-0 text-[16px]" style={{ color: theme.muted }}>Questo browser non supporta le notifiche. Installa l'app dalla schermata Home (menu ⋮ → Installa app) e riprova da lì.</p>}
      {state === 'denied' && <p className="m-0 text-[16px]" style={{ color: theme.muted }}>Le notifiche sono bloccate. Riattivale nelle impostazioni del sito in Chrome (lucchetto accanto all'indirizzo → Notifiche → Consenti), poi riapri questa finestra.</p>}
      {state === 'off' && (
        <div className="flex flex-col gap-3">
          <p className="m-0 text-[16px]" style={{ color: theme.muted }}>Ricevi un avviso all'ora di ogni pasto e qualche richiamo per l'acqua.</p>
          <button onClick={enable} className="cut-br theme-action label min-h-12 px-7 text-[17px] self-end" style={primaryStyle(theme)}>Attiva le notifiche</button>
        </div>
      )}

      {state === 'on' && (
        <>
          <section className="pb-4" style={{ borderBottom: `1px solid ${theme.line}` }}>
            <Toggle on={rem.pastiOn} label="Pasti" onChange={(v) => update({ ...rem, pastiOn: v })} />
            {rem.pastiOn && MEAL_TYPES.map((t, i) => (
              <label key={t} className="flex justify-between items-center gap-3 text-[16px] mt-2">
                {t}
                <input type="time" value={rem.pasti[i]} onChange={(e) => update({ ...rem, pasti: rem.pasti.map((v, j) => (j === i ? e.target.value : v)) })}
                  className={time} style={fieldStyle(theme)} />
              </label>
            ))}
            <p className="m-0 mt-3 text-[14px]" style={{ color: theme.muted }}>Se hai già segnato il pasto come fatto, la notifica non arriva. Questi orari decidono anche il pasto "di adesso" in Oggi.</p>
          </section>

          <section className="py-4" style={{ borderBottom: `1px solid ${theme.line}` }}>
            <Toggle on={rem.acquaOn} label="Acqua" onChange={(v) => update({ ...rem, acquaOn: v })} />
            {rem.acquaOn && (
              <div className="grid grid-cols-2 gap-3 mt-2">
                {rem.acqua.map((v, i) => (
                  <label key={i} className="flex flex-col gap-1 text-[14px]" style={{ color: theme.muted }}>Richiamo {i + 1}
                    <input type="time" value={v} onChange={(e) => update({ ...rem, acqua: rem.acqua.map((x, j) => (j === i ? e.target.value : x)) })}
                      className={time} style={fieldStyle(theme)} />
                  </label>
                ))}
              </div>
            )}
            <p className="m-0 mt-3 text-[14px]" style={{ color: theme.muted }}>Smettono quando raggiungi l'obiettivo del giorno.</p>
          </section>

          <button onClick={disable} className="label min-h-11 px-4 mt-4" style={outlineStyle(theme, theme.danger)}>Disattiva su questo telefono</button>
        </>
      )}
      {msg && <p role="status" className="m-0 mt-3 text-[15px]" style={{ color: msg === 'Salvato' ? theme.done : theme.danger }}>{msg}</p>}
    </Sheet>
  );
}
