import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { isoDay } from '../dates';

const fmt = (v) => (v == null ? '–' : Number(v).toLocaleString('it-IT', { maximumFractionDigits: 1 }));
const signed = (v) => (v > 0 ? '+' : v < 0 ? '−' : '±') + fmt(Math.abs(v));
const MEASURES = [['waist', 'Vita', '#E39A72'], ['hips', 'Fianchi', '#B4CB86'], ['thigh', 'Coscia', '#E2B866'], ['arm', 'Braccio', '#8FBFCD']];
const FIELDS = [['weight', 'Peso (kg)'], ['fat_plica', 'Massa grassa plica (%)'], ['fat_bia', 'Massa grassa BIA (%)'], ['waist', 'Vita (cm)'], ['hips', 'Fianchi (cm)'], ['thigh', 'Coscia (cm)'], ['arm', 'Braccio (cm)']];

const latest = (rows, k) => [...rows].reverse().find((r) => r[k] != null);
const first = (rows, k) => rows.find((r) => r[k] != null);
const label = (r) => r.label || (r.taken_on ? new Date(r.taken_on + 'T12:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }) : '');

export default function Progressi({ theme }) {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(null);
  const [err, setErr] = useState('');

  const load = () => supabase.from('measurements').select('*')
    .order('taken_on', { ascending: true, nullsFirst: true }).order('id')
    .then(({ data, error }) => { if (error) setErr(error.message); else setRows(data || []); });
  useEffect(() => { load(); }, []);

  const weights = rows.filter((r) => r.weight != null);
  const wMin = Math.min(...weights.map((r) => +r.weight)) - 2;
  const wMax = Math.max(...weights.map((r) => +r.weight));
  const lastW = weights[weights.length - 1];
  const firstW = weights[0];

  const submit = async (e) => {
    e.preventDefault();
    const rec = { taken_on: form.taken_on, source: 'personale' };
    FIELDS.forEach(([k]) => { if (form[k] !== '' && form[k] != null) rec[k] = parseFloat(String(form[k]).replace(',', '.')); });
    const { error } = await supabase.from('measurements').insert(rec);
    if (error) { setErr('Non sono riuscito a salvare: ' + error.message); return; }
    setForm(null); setErr(''); load();
  };

  const card = { background: theme.surf, border: `1px solid ${theme.line}`, boxShadow: '0 10px 32px rgba(0,0,0,.10)' };
  const tile = { background: theme.surf2 };

  return (
    <div className="flex flex-col gap-3.5">
      <header className="flex justify-between items-end">
        <div>
          <p className="text-muted m-0 text-sm">{lastW ? `Ultimo controllo · ${label(lastW)}` : 'Nessuna misura ancora'}</p>
          <h1 className="font-display text-[30px] font-semibold m-0">Progressi</h1>
        </div>
        <button onClick={() => setForm(form ? null : { taken_on: isoDay(new Date()) })} aria-expanded={!!form}
          className="h-11 px-4 rounded-full border-0 font-bold text-sm" style={{ background: theme.acc, color: theme.onAcc }}>
          {form ? 'Chiudi' : '+ Misura'}
        </button>
      </header>

      {form && (
        <form onSubmit={submit} className="rounded-[24px] p-4 flex flex-col gap-3" style={card}>
          <label className="flex flex-col gap-1 text-sm">Data
            <input type="date" required value={form.taken_on} onChange={(e) => setForm({ ...form, taken_on: e.target.value })}
              className="h-11 rounded-xl px-3 text-base border-0" style={{ ...tile, color: theme.text, colorScheme: 'dark' }} />
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {FIELDS.map(([k, l]) => (
              <label key={k} className="flex flex-col gap-1 text-[13px]">{l}
                <input inputMode="decimal" value={form[k] || ''} onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  className="h-11 rounded-xl px-3 text-base border-0" style={{ ...tile, color: theme.text }} />
              </label>
            ))}
          </div>
          <p className="m-0 text-xs text-muted">Compila solo quello che hai misurato.</p>
          <button type="submit" className="h-12 rounded-full border-0 font-bold" style={{ background: theme.acc, color: theme.onAcc }}>Salva misura</button>
        </form>
      )}

      {weights.length > 0 && (
        <section className="rounded-[24px] p-4 flex flex-col gap-3" style={card}>
          <div className="flex justify-between items-baseline">
            <h2 className="font-display font-semibold text-[17px] m-0">Peso</h2>
            <span className="text-muted text-sm"><b className="text-lg" style={{ color: theme.text }}>{fmt(lastW.weight)} kg</b> · {signed(lastW.weight - firstW.weight)} dall'inizio</span>
          </div>
          <div className="flex items-end gap-2 h-[150px] overflow-x-auto" role="img"
            aria-label={'Andamento del peso: ' + weights.map((r) => `${label(r)} ${fmt(r.weight)} kg`).join(', ')}>
            {weights.map((r, i) => {
              const isLast = i === weights.length - 1;
              const h = 20 + ((r.weight - wMin) / Math.max(wMax - wMin, 1)) * 100;
              return (
                <div key={r.id} className="flex-1 min-w-[38px] flex flex-col items-center justify-end gap-1.5 h-full">
                  <span className="text-xs" style={{ color: theme.muted }}>{fmt(r.weight)}</span>
                  <div className="w-full" style={{ height: h, borderRadius: '10px 10px 4px 4px', background: isLast ? theme.acc : r.source === 'carlotta' ? theme.surf2 : `${theme.acc}55`, outline: r.source === 'personale' ? `1.5px dashed ${theme.acc}` : 'none' }} />
                  <span className="text-xs text-muted whitespace-nowrap">{label(r).replace('Mese ', 'M')}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {(latest(rows, 'fat_plica') || latest(rows, 'fat_bia')) && (
        <section className="rounded-[24px] p-4 flex flex-col gap-2.5" style={card}>
          <h2 className="font-display font-semibold text-[17px] m-0">Massa grassa</h2>
          <div className="grid grid-cols-2 gap-2.5">
            {[['fat_plica', 'Plicometria'], ['fat_bia', 'BIA']].map(([k, l]) => (
              <div key={k} className="rounded-[18px] px-3.5 py-3" style={tile}>
                <p className="m-0 text-[13px] text-muted">{l}</p>
                <p className="m-0 font-display text-2xl font-semibold">{fmt(latest(rows, k)?.[k])}%</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {MEASURES.some(([k]) => latest(rows, k)) && (
        <section className="rounded-[24px] p-4 flex flex-col gap-2.5" style={card}>
          <h2 className="font-display font-semibold text-[17px] m-0">Misure</h2>
          <div className="grid grid-cols-2 gap-2.5">
            {MEASURES.map(([k, l, c]) => {
              const a = first(rows, k), b = latest(rows, k);
              if (!b) return null;
              return (
                <div key={k} className="rounded-[18px] px-3.5 py-3" style={tile}>
                  <p className="m-0 text-[13px] font-bold" style={{ color: c }}>{l}</p>
                  <p className="m-0 font-display text-[22px] font-semibold">{fmt(b[k])} cm</p>
                  {a && a !== b && <p className="m-0 text-[13px] text-muted">{signed(b[k] - a[k])} cm dall'inizio</p>}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <p className="rounded-[22px] px-4 py-3.5 m-0 text-sm leading-relaxed" style={{ border: `1.5px dashed ${theme.surf2}`, color: theme.muted }}>
        Le barre scure sono i controlli con Carlotta, quelle tratteggiate le tue misure personali. L'interpretazione dei numeri spetta a lei.
      </p>
      {err && <p className="m-0 text-sm" style={{ color: '#F0A08A' }}>{err}</p>}
    </div>
  );
}
