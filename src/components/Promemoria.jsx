import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { VAPID_PUBLIC_KEY } from '../config';
import { MEAL_TYPES } from '../dates';

const DEFAULTS = { pastiOn: true, pasti: ['08:00', '13:00', '16:30', '20:00'], acquaOn: true, acqua: ['10:30', '12:30', '15:30', '18:00'] };

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
  const field = { background: theme.surf2, color: theme.text, colorScheme: 'dark' };

  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center" style={{ background: 'rgba(10,8,6,0.6)' }} onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Promemoria" onClick={(e) => e.stopPropagation()}
        className="theme-page w-full max-w-md max-h-[88dvh] overflow-y-auto rounded-t-[28px] px-5 pt-5 pb-8 flex flex-col gap-4"
        style={{ backgroundColor: theme.bg, color: theme.text }}>
        <div className="flex justify-between items-start">
          <div>
            <h2 className="m-0 font-display text-[24px] font-semibold">Promemoria</h2>
            <p className="m-0 text-sm" style={{ color: theme.muted }}>Notifiche per i pasti e l'acqua</p>
          </div>
          <button onClick={onClose} aria-label="Chiudi" className="w-11 h-11 rounded-full border-0 flex items-center justify-center"
            style={{ background: theme.surf, color: theme.text }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        {state === 'loading' && <p className="m-0" style={{ color: theme.muted }}>Controllo…</p>}
        {state === 'unsupported' && <p className="m-0 text-sm" style={{ color: theme.muted }}>Questo browser non supporta le notifiche. Installa l'app dalla schermata Home (menu ⋮ → Installa app) e riprova da lì.</p>}
        {state === 'denied' && <p className="m-0 text-sm" style={{ color: theme.muted }}>Le notifiche sono bloccate. Riattivale nelle impostazioni del sito in Chrome (lucchetto accanto all'indirizzo → Notifiche → Consenti), poi riapri questa finestra.</p>}
        {state === 'off' && (
          <button onClick={enable} className="theme-action h-12 rounded-full border-0 font-bold" style={{ background: theme.acc, color: theme.onAcc }}>
            Attiva le notifiche
          </button>
        )}

        {state === 'on' && (
          <>
            <section className="theme-card rounded-[22px] p-4 flex flex-col gap-3" style={{ background: theme.surf }}>
              <label className="flex justify-between items-center gap-3 font-bold">
                Pasti
                <input type="checkbox" checked={rem.pastiOn} onChange={(e) => update({ ...rem, pastiOn: e.target.checked })}
                  style={{ accentColor: theme.acc, width: 22, height: 22 }} />
              </label>
              {rem.pastiOn && MEAL_TYPES.map((t, i) => (
                <label key={t} className="flex justify-between items-center gap-3 text-[15px]">
                  {t}
                  <input type="time" value={rem.pasti[i]} onChange={(e) => update({ ...rem, pasti: rem.pasti.map((v, j) => (j === i ? e.target.value : v)) })}
                    className="h-11 rounded-xl px-3 border-0 text-base" style={field} />
                </label>
              ))}
              <p className="m-0 text-xs" style={{ color: theme.muted }}>Se hai già segnato il pasto come fatto, la notifica non arriva.</p>
            </section>

            <section className="theme-card rounded-[22px] p-4 flex flex-col gap-3" style={{ background: theme.surf }}>
              <label className="flex justify-between items-center gap-3 font-bold">
                Acqua
                <input type="checkbox" checked={rem.acquaOn} onChange={(e) => update({ ...rem, acquaOn: e.target.checked })}
                  style={{ accentColor: theme.acc, width: 22, height: 22 }} />
              </label>
              {rem.acquaOn && (
                <div className="grid grid-cols-2 gap-2.5">
                  {rem.acqua.map((v, i) => (
                    <input key={i} type="time" value={v} aria-label={`Promemoria acqua ${i + 1}`}
                      onChange={(e) => update({ ...rem, acqua: rem.acqua.map((x, j) => (j === i ? e.target.value : x)) })}
                      className="h-11 rounded-xl px-3 border-0 text-base" style={field} />
                  ))}
                </div>
              )}
              <p className="m-0 text-xs" style={{ color: theme.muted }}>Smettono quando raggiungi l'obiettivo del giorno.</p>
            </section>

            <button onClick={disable} className="h-11 rounded-full bg-transparent font-bold text-sm"
              style={{ border: `1.5px solid ${theme.surf2}`, color: '#F0A08A' }}>Disattiva le notifiche su questo telefono</button>
          </>
        )}
        {msg && <p className="m-0 text-sm text-center" style={{ color: theme.muted }}>{msg}</p>}
      </div>
    </div>
  );
}
