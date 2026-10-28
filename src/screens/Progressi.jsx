import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { isoDay } from '../dates';
import { italianError } from '../errors';

const fmt = (v) => (v == null ? '–' : Number(v).toLocaleString('it-IT', { maximumFractionDigits: 1 }));
const signed = (v) => (v > 0 ? '+' : v < 0 ? '−' : '±') + fmt(Math.abs(v));
const MEASURES = [['waist', 'Vita'], ['hips', 'Fianchi'], ['thigh', 'Coscia'], ['arm', 'Braccio']];
const FIELDS = [['weight', 'Peso', 'kg'], ['fat_plica', 'Grasso plica', '%'], ['fat_bia', 'Grasso BIA', '%'], ['waist', 'Vita', 'cm'], ['hips', 'Fianchi', 'cm'], ['thigh', 'Coscia', 'cm'], ['arm', 'Braccio', 'cm']];

const latest = (rows, k) => [...rows].reverse().find((r) => r[k] != null);
const first = (rows, k) => rows.find((r) => r[k] != null);
const label = (r) => r.label || (r.taken_on ? new Date(r.taken_on + 'T12:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }) : '');
const num = (v) => parseFloat(String(v).replace(',', '.'));

export default function Progressi({ theme }) {
  const [rows, setRows] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState(null);
  const [bad, setBad] = useState({});
  const [err, setErr] = useState('');

  const load = () => supabase.from('measurements').select('*')
    .order('taken_on', { ascending: true, nullsFirst: true }).order('id')
    .then(({ data, error }) => { if (error) setErr('Non riesco a leggere le misure: ' + italianError(error) + '.'); else setRows(data || []); setLoaded(true); });
  useEffect(() => { load(); }, []);

  const weights = rows.filter((r) => r.weight != null);
  const lastW = weights[weights.length - 1];
  const firstW = weights[0];

  const submit = async (e) => {
    e.preventDefault();
    const rec = { taken_on: form.taken_on, source: form.source || 'personale' };
    if (form.source === 'carlotta' && form.label) rec.label = form.label;
    const wrong = {};
    FIELDS.forEach(([k]) => {
      if (form[k] === '' || form[k] == null) return;
      const v = num(form[k]);
      if (Number.isFinite(v) && v > 0) rec[k] = v; else wrong[k] = true;
    });
    if (!form.taken_on) wrong.taken_on = true;
    setBad(wrong);
    if (Object.keys(wrong).length) return;
    if (FIELDS.every(([k]) => rec[k] == null)) { setErr('Scrivi almeno una misura.'); return; }
    const { error } = await supabase.from('measurements').insert(rec);
    if (error) { setErr('Non sono riuscito a salvare: ' + italianError(error) + '.'); return; }
    setForm(null); setErr(''); load();
  };

  const field = (k) => ({ background: theme.surf, color: theme.text, border: `1px solid ${bad[k] ? theme.danger : theme.edge}` });

  return (
    <div className="flex flex-col">
      <header className="flex justify-between items-start gap-3">
        <div>
          <h1 className="font-display text-[26px] leading-[1.1] font-bold m-0">Progressi</h1>
          <p className="m-0 mt-1 text-[15px]" style={{ color: theme.muted }}>
            {lastW ? `Ultima misura del peso: ${label(lastW)}` : loaded ? 'Nessuna misura ancora' : 'Caricamento…'}
          </p>
        </div>
        <button onClick={() => { setForm(form ? null : { taken_on: isoDay(new Date()), source: 'personale' }); setBad({}); setErr(''); }}
          aria-expanded={!!form} className="theme-action label min-h-11 px-4 bg-transparent shrink-0"
          style={{ border: `1px solid ${theme.edge}`, color: theme.text }}>
          {form ? 'Chiudi' : 'Nuova misura'}
        </button>
      </header>

      {form && (
        <form onSubmit={submit} noValidate className="mt-4 p-4 flex flex-col gap-3" style={{ background: theme.surf, border: `1px solid ${theme.edge}` }}>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Fonte della misura">
            {[['personale', 'Misura mia'], ['carlotta', 'Controllo Carlotta']].map(([v, l]) => {
              const on = form.source === v;
              return (
                <button type="button" key={v} role="radio" aria-checked={on} onClick={() => setForm({ ...form, source: v })}
                  className="label min-h-11 px-2" style={{ background: on ? theme.surf2 : 'transparent', color: on ? theme.acc : theme.text, border: `1px solid ${on ? theme.acc : theme.edge}` }}>{l}</button>
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-[14px]" style={{ color: theme.muted }}>Data
              <input type="date" required value={form.taken_on} onChange={(e) => setForm({ ...form, taken_on: e.target.value })}
                className="h-11 px-3 text-[16px]" style={{ ...field('taken_on'), colorScheme: 'dark' }} />
            </label>
            {form.source === 'carlotta' && (
              <label className="flex flex-col gap-1 text-[14px]" style={{ color: theme.muted }}>Nome del controllo
                <input value={form.label || ''} placeholder="es. Mese 8" onChange={(e) => setForm({ ...form, label: e.target.value })}
                  className="h-11 px-3 text-[16px]" style={field('label')} />
              </label>
            )}
            {FIELDS.map(([k, l, u]) => (
              <label key={k} className="flex flex-col gap-1 text-[14px]" style={{ color: bad[k] ? theme.danger : theme.muted }}>{l} ({u})
                <input inputMode="decimal" value={form[k] || ''} aria-invalid={!!bad[k]}
                  onChange={(e) => { setForm({ ...form, [k]: e.target.value }); setBad({ ...bad, [k]: false }); }}
                  className="h-11 px-3 text-[16px] font-display font-semibold" style={field(k)} />
                {bad[k] && <span role="alert" className="text-[13px]">Scrivi un numero, es. 78,4</span>}
              </label>
            ))}
          </div>
          <p className="m-0 text-[14px]" style={{ color: theme.muted }}>Compila solo quello che hai misurato.</p>
          <button type="submit" className="cut-br theme-action label min-h-12 border-0 text-[17px] self-end px-7" style={{ background: theme.acc, color: theme.onAcc }}>Salva</button>
        </form>
      )}
      {err && <p role="alert" className="m-0 mt-3 text-[15px]" style={{ color: theme.danger }}>{err}</p>}

      {loaded && !rows.length && !form && (
        <p className="m-0 mt-6 text-[16px]" style={{ color: theme.muted }}>Qui compariranno peso, massa grassa e misure. Aggiungi la prima con "Nuova misura" o confermando il prossimo piano di Carlotta.</p>
      )}

      {weights.length > 0 && <WeightChart weights={weights} theme={theme} delta={lastW.weight - firstW.weight} />}

      {(latest(rows, 'fat_plica') || latest(rows, 'fat_bia')) && (
        <Board title="Massa grassa" head={['Metodo', 'Ultima', 'Dall\'inizio']} theme={theme}
          rows={[['fat_plica', 'Plicometria'], ['fat_bia', 'BIA']].filter(([k]) => latest(rows, k)).map(([k, l]) => {
            const a = first(rows, k), b = latest(rows, k);
            return [l, `${fmt(b[k])} %`, a && a !== b ? `${signed(b[k] - a[k])} %` : '–'];
          })} />
      )}

      {MEASURES.some(([k]) => latest(rows, k)) && (
        <Board title="Misure" head={['Misura', 'Ultima', 'Dall\'inizio']} theme={theme}
          rows={MEASURES.filter(([k]) => latest(rows, k)).map(([k, l]) => {
            const a = first(rows, k), b = latest(rows, k);
            return [l, `${fmt(b[k])} cm`, a && a !== b ? `${signed(b[k] - a[k])} cm` : '–'];
          })} />
      )}

      {rows.length > 0 && (
        <p className="m-0 mt-6 text-[14px] leading-relaxed" style={{ color: theme.muted }}>L'interpretazione dei numeri spetta a Carlotta.</p>
      )}
    </div>
  );
}

// Peso nel tempo: una linea, punti pieni per i controlli con Carlotta e vuoti per le misure personali.
// L'ultimo punto è "adesso" e prende l'accento; toccando un punto se ne legge il valore.
function WeightChart({ weights, theme, delta }) {
  const [sel, setSel] = useState(weights.length - 1);
  const W = 358, H = 168, L = 34, R = 14, T = 16, B = 26;
  const vals = weights.map((r) => +r.weight);
  // tre righe di griglia a passo intero uguale
  const lo = Math.floor(Math.min(...vals) - .5) - 1; // margine sotto il valore più basso
  const step = Math.max(1, Math.ceil((Math.ceil(Math.max(...vals)) + 1 - lo) / 2));
  const hi = lo + 2 * step;
  const ticks = [lo, lo + step, hi];
  const x = (i) => (weights.length === 1 ? (L + W - R) / 2 : L + (i * (W - L - R)) / (weights.length - 1));
  const y = (v) => T + ((hi - v) * (H - T - B)) / (hi - lo);
  const both = weights.some((r) => r.source === 'carlotta') && weights.some((r) => r.source !== 'carlotta');
  const s = weights[sel];
  const lastI = weights.length - 1;

  return (
    <section className="mt-6" aria-labelledby="peso">
      <div className="flex justify-between items-baseline pb-2" style={{ borderBottom: `1px solid ${theme.line}` }}>
        <h2 id="peso" className="label m-0" style={{ color: theme.muted }}>Peso</h2>
        <span className="label" style={{ color: theme.muted }}>{signed(delta)} kg dall'inizio</span>
      </div>
      <p className="m-0 mt-3 flex items-baseline gap-2" aria-live="polite">
        <span className="font-display font-bold text-[40px] leading-none" style={{ color: sel === lastI ? theme.acc : theme.text }}>{fmt(s.weight)}</span>
        <span className="font-display font-bold text-[19px]">kg</span>
        <span className="text-[15px]" style={{ color: theme.muted }}>{label(s)} · {s.source === 'carlotta' ? 'controllo con Carlotta' : 'misura tua'}</span>
      </p>
      <div className="relative mt-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full h-auto" role="img"
        aria-label={'Andamento del peso: ' + weights.map((r) => `${label(r)} ${fmt(r.weight)} kg`).join(', ')}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke={theme.line} strokeWidth="1" />
            <text x={L - 8} y={y(t) + 4} textAnchor="end" fill={theme.muted} style={{ font: '600 13px Rajdhani, sans-serif' }}>{t}</text>
          </g>
        ))}
        <line x1={x(sel)} x2={x(sel)} y1={T - 6} y2={H - B} stroke={theme.edge} strokeWidth="1" strokeDasharray="2 3" />
        <polyline fill="none" stroke={theme.text} strokeWidth="2" strokeLinejoin="round" points={weights.map((r, i) => `${x(i)},${y(+r.weight)}`).join(' ')} />
        {weights.map((r, i) => {
          const c = i === lastI ? theme.acc : theme.text;
          const filled = r.source === 'carlotta';
          return (
            <g key={r.id}>
              <rect x={x(i) - 5} y={y(+r.weight) - 5} width="10" height="10"
                fill={filled ? c : theme.bg} stroke={i === sel ? theme.acc : c} strokeWidth={i === sel ? 2.5 : 2}
                // anello del colore di fondo: separa il punto dalla linea
                paintOrder="stroke" />
              <text x={x(i)} y={H - 8} textAnchor="middle" fill={i === sel ? theme.text : theme.muted} style={{ font: '600 12px Rajdhani, sans-serif' }}>
                {label(r).replace('Mese ', 'M')}
              </text>
            </g>
          );
        })}
      </svg>
      {/* bersagli di tocco a tutta altezza sopra il grafico, uno per misura (più grandi dei punti) */}
      <div className="absolute inset-y-0 grid" role="group" aria-label="Scegli una misura"
        style={{ left: `${((L - (W - L - R) / Math.max(weights.length - 1, 1) / 2) / W) * 100}%`, right: `${((R - (W - L - R) / Math.max(weights.length - 1, 1) / 2) / W) * 100}%`, gridTemplateColumns: `repeat(${weights.length}, minmax(0, 1fr))` }}>
        {weights.map((r, i) => (
          <button key={r.id} onClick={() => setSel(i)} aria-pressed={i === sel} aria-label={`${label(r)}: ${fmt(r.weight)} kg`}
            className="bg-transparent border-0 p-0" />
        ))}
      </div>
      </div>
      {both && (
        <p className="m-0 mt-1 flex gap-4 text-[14px]" style={{ color: theme.muted }}>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5" style={{ background: theme.text }} />Controllo con Carlotta</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5" style={{ border: `2px solid ${theme.text}` }} />Misura tua</span>
        </p>
      )}
      <details className="mt-2">
        <summary className="label min-h-11 inline-flex items-center gap-2 px-3 cursor-pointer list-none" style={{ color: theme.text, border: `1px solid ${theme.edge}` }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="square" aria-hidden="true" className="details-chevron"><path d="M9 5l7 7-7 7" /></svg>
          Vedi i dati
        </summary>
        <table className="w-full text-[15px] mt-1" style={{ borderCollapse: 'collapse' }}>
          <tbody>
            {[...weights].reverse().map((r) => (
              <tr key={r.id} style={{ borderBottom: `1px solid ${theme.line}` }}>
                <td className="py-2">{label(r)}</td>
                <td className="py-2" style={{ color: theme.muted }}>{r.source === 'carlotta' ? 'Carlotta' : 'Tua'}</td>
                <td className="py-2 text-right font-display font-semibold">{fmt(r.weight)} kg</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  );
}

// Tabella in stile tabellone: intestazioni di colonna in etichetta, righe divise da filetti
function Board({ title, head, rows, theme }) {
  return (
    <section className="mt-6" aria-label={title}>
      <h2 className="label m-0 pb-2" style={{ color: theme.muted, borderBottom: `1px solid ${theme.line}` }}>{title}</h2>
      <table className="w-full" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr className="label text-[11px]" style={{ color: theme.muted }}>
            {head.map((h, i) => <th key={h} className={`font-[inherit] pt-2 pb-1 ${i ? 'text-right w-28' : 'text-left'}`}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map(([a, b, c]) => (
            <tr key={a} style={{ borderBottom: `1px solid ${theme.line}` }}>
              <td className="py-2.5 font-display font-bold uppercase tracking-wide text-[19px]">{a}</td>
              <td className="py-2.5 text-right font-display font-semibold text-[19px]">{b}</td>
              <td className="py-2.5 text-right text-[15px]" style={{ color: theme.muted }}>{c}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
