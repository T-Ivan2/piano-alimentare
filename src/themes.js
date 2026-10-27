// Temi stagionali e personali: scelti in automatico in base alla data.
// Priorità: personali > ricorrenze > stagioni > base.
// Il mondo è unico (scuro, stile cyberpunk): ogni tema cambia solo il colore d'accento e il saluto.

// Neutri condivisi: fondo, superfici, testo. "edge" è il contorno dei controlli (almeno 3:1 sulle superfici).
const NEUTRAL = {
  bg: '#0B0F14', surf: '#121A22', surf2: '#1C2630', nav: '#0E1319',
  text: '#E6EDF2', muted: '#8FA0AE', line: '#24303B', edge: '#5E7180',
  done: '#04DAF6', danger: '#FF4D5E', glow: 'transparent'
};

const T = {
  base:         { name: 'Base',           acc: '#FCEE0A', greet: null, tag: 'Stai andando bene' },
  autunno:      { name: 'Autunno',        acc: '#FF9F1C', greet: 'Buon autunno, {n}', tag: 'Passo dopo passo' },
  inverno:      { name: 'Inverno',        acc: '#A8C8FF', greet: 'Stai al caldo, {n}', tag: 'Costanza anche al freddo' },
  primavera:    { name: 'Primavera',      acc: '#FF6FB5', greet: 'Buona primavera, {n}', tag: 'Tutto rifiorisce' },
  estate:       { name: 'Estate',         acc: '#FFB627', greet: 'Buona estate, {n}', tag: 'Idratati bene oggi' },
  settembre:    { name: 'Settembre',      acc: '#D4F24A', greet: 'Si ricomincia, {n}', tag: 'Nuova stagione, stesse buone abitudini' },
  halloween:    { name: 'Halloween',      acc: '#FF7A1A', greet: 'Dolcetto o scherzetto, {n}', tag: 'Niente paura, sei in pista' },
  natale:       { name: 'Natale',         acc: '#FF3D57', greet: 'Buone feste, {n}', tag: 'Goditi la giornata' },
  capodanno:    { name: 'Capodanno',      acc: '#FFD966', greet: 'Buon anno, {n}', tag: 'Che anno!' },
  epifania:     { name: 'Epifania',       acc: '#B18CFF', greet: 'Buona Epifania, {n}', tag: 'Si riparte con calma' },
  valentino:    { name: 'San Valentino',  acc: '#FF4F8B', greet: 'Buon San Valentino, {n}', tag: 'Volersi bene, anche a tavola' },
  carnevale:    { name: 'Carnevale',      acc: '#E45BFF', greet: 'Buon Carnevale, {n}', tag: 'Una chiacchiera ci sta' },
  pasqua:       { name: 'Pasqua',         acc: '#C6F36B', greet: 'Buona Pasqua, {n}', tag: 'Festa con equilibrio' },
  ferragosto:   { name: 'Ferragosto',     acc: '#5CFFB0', greet: 'Buon Ferragosto, {n}', tag: 'Acqua, acqua, acqua' },
  compleanno:   { name: 'Compleanno',     acc: '#FF8AD8', greet: 'Buon compleanno, {n}', tag: 'Festeggia senza pensieri' },
  anniversario: { name: 'Anniversario',   acc: '#F2C14E', greet: '{m} mesi di percorso, {n}', tag: 'Guarda quanta strada' }
};

export const PERSON = { name: 'Ivan', birthday: [7, 2], start: new Date(2025, 11, 2) };

// Data di Pasqua (algoritmo di Meeus/Jones/Butcher)
function easter(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(y, month - 1, day);
}

const dayOnly = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const between = (d, a, b) => d >= a && d <= b;

export function themeKeyFor(date) {
  const d = dayOnly(date), y = d.getFullYear(), m = d.getMonth() + 1, day = d.getDate();
  const md = (mm, dd) => new Date(y, mm - 1, dd);

  // Personali
  if (m === PERSON.birthday[0] && day === PERSON.birthday[1]) return { key: 'compleanno' };
  const s = PERSON.start;
  const months = (y - s.getFullYear()) * 12 + (m - 1 - s.getMonth());
  if (day === s.getDate() && months > 0 && months % 6 === 0) return { key: 'anniversario', months };

  // Ricorrenze
  const e = easter(y);
  if (between(d, addDays(e, -52), addDays(e, -47))) return { key: 'carnevale' };
  if (between(d, addDays(e, -6), addDays(e, 1))) return { key: 'pasqua' };
  if (between(d, md(10, 15), md(11, 2))) return { key: 'halloween' };
  if (between(d, md(12, 1), md(12, 26))) return { key: 'natale' };
  if (between(d, md(12, 27), md(12, 31)) || (m === 1 && day === 1)) return { key: 'capodanno' };
  if (between(d, md(1, 2), md(1, 6))) return { key: 'epifania' };
  if (between(d, md(2, 10), md(2, 14))) return { key: 'valentino' };
  if (between(d, md(8, 10), md(8, 16))) return { key: 'ferragosto' };

  // Stagioni
  if (between(d, md(11, 3), md(11, 30))) return { key: 'autunno' };
  if (m === 1 || m === 2) return { key: 'inverno' };
  if (m >= 3 && m <= 5) return { key: 'primavera' };
  if (m >= 6 && m <= 8) return { key: 'estate' };
  if (m === 9 || (m === 10 && day <= 14)) return { key: 'settembre' };
  return { key: 'base' };
}

export function getTheme(date = new Date(), enabled = true) {
  const r = enabled ? themeKeyFor(date) : { key: 'base' };
  const t = T[r.key];
  const h = date.getHours();
  const fallback = h < 13 ? 'Buongiorno, {n}' : h < 18 ? 'Buon pomeriggio, {n}' : 'Buona sera, {n}';
  const greet = (t.greet || fallback).replace('{n}', PERSON.name).replace('{m}', r.months || '');
  return { key: r.key, ...NEUTRAL, ...t, onAcc: '#0B0F14', active: `color-mix(in srgb, ${t.acc} 14%, ${NEUTRAL.surf})`, greet };
}
