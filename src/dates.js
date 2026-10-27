// Utility date (giorno della settimana con lunedì = 0, date in formato locale YYYY-MM-DD)
export const weekdayIndex = (d) => (d.getDay() + 6) % 7;

export const isoDay = (d) => {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

export const startOfWeek = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - weekdayIndex(d));

export const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

export const longDate = (d) => {
  const s = d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export const MEAL_TYPES = ['Colazione', 'Pranzo', 'Spuntino', 'Cena'];
export const MEAL_TINTS = ['#E39A72', '#B4CB86', '#E2B866', '#8FBFCD'];
// Orari predefiniti dei pasti (gli stessi dei promemoria)
export const MEAL_TIMES = ['08:00', '13:00', '16:30', '20:00'];
export const toMinutes = (hhmm) => { const [h, m] = String(hhmm).split(':').map(Number); return h * 60 + (m || 0); };
