// Temi stagionali: scelti in automatico in base alla data.
// Priorità: personali > ricorrenze > stagioni > base.

const T = {
  base:        { name: 'Base',          bg: '#1E1916', surf: '#2A2320', surf2: '#3A312B', nav: '#26201C', acc: '#B4CB86', greet: null,                         tag: 'Stai andando bene' },
  autunno:     { name: 'Autunno',       bg: '#1F1712', surf: '#2C211A', surf2: '#3D2E24', nav: '#271D17', acc: '#E0954F', greet: 'Buon autunno, {n}',          tag: 'Passo dopo passo' },
  inverno:     { name: 'Inverno',       bg: '#151A20', surf: '#1F262E', surf2: '#2D3640', nav: '#1B2128', acc: '#A9CDEB', greet: 'Stai al caldo, {n}',         tag: 'Costanza anche al freddo' },
  primavera:   { name: 'Primavera',     bg: '#1E1A1C', surf: '#2A2427', surf2: '#3A3236', nav: '#251F22', acc: '#F2A7BF', greet: 'Buona primavera, {n}',       tag: 'Tutto rifiorisce' },
  estate:      { name: 'Estate',        bg: '#1D1814', surf: '#2A221C', surf2: '#3B3027', nav: '#251E19', acc: '#F5A35C', greet: 'Buona estate, {n}',          tag: 'Idratati bene oggi' },
  settembre:   { name: 'Settembre',     bg: '#1C1A14', surf: '#29261D', surf2: '#39352A', nav: '#24211A', acc: '#D9B85C', greet: 'Si ricomincia, {n}',         tag: 'Nuova stagione, stesse buone abitudini' },
  halloween:   { name: 'Halloween',     bg: '#1A1420', surf: '#261D2C', surf2: '#372B3F', nav: '#211927', acc: '#F08A3C', greet: 'Dolcetto o scherzetto, {n}', tag: 'Niente paura, sei in pista' },
  natale:      { name: 'Natale',        bg: '#1C1514', surf: '#2A1E1C', surf2: '#3B2A27', nav: '#241A18', acc: '#E0B85A', greet: 'Buone feste, {n}',           tag: 'Goditi la giornata' },
  capodanno:   { name: 'Capodanno',     bg: '#17151C', surf: '#23202A', surf2: '#332E3C', nav: '#1D1B23', acc: '#E8C77A', greet: 'Buon anno, {n}',             tag: 'Che anno!' },
  epifania:    { name: 'Epifania',      bg: '#13172A', surf: '#1D2236', surf2: '#2B3249', nav: '#181C2F', acc: '#E6C46A', greet: 'Buona Epifania, {n}',        tag: 'Si riparte con calma' },
  valentino:   { name: 'San Valentino', bg: '#1E1517', surf: '#2B1F22', surf2: '#3C2B30', nav: '#251B1E', acc: '#EE8FA0', greet: 'Buon San Valentino, {n}',    tag: 'Volersi bene, anche a tavola' },
  carnevale:   { name: 'Carnevale',     bg: '#1A1720', surf: '#26222E', surf2: '#36303F', nav: '#201D27', acc: '#F2C14E', greet: 'Buon Carnevale, {n}',        tag: 'Una chiacchiera ci sta' },
  pasqua:      { name: 'Pasqua',        bg: '#1C1B17', surf: '#29271F', surf2: '#39362B', nav: '#23211B', acc: '#F3DE7E', greet: 'Buona Pasqua, {n}',          tag: 'Festa con equilibrio' },
  ferragosto:  { name: 'Ferragosto',    bg: '#121C20', surf: '#1B2A2F', surf2: '#283C42', nav: '#162327', acc: '#6FCFD6', greet: 'Buon Ferragosto, {n}',       tag: 'Acqua, acqua, acqua' },
  compleanno:  { name: 'Compleanno',    bg: '#1C1619', surf: '#2A2126', surf2: '#3B2F35', nav: '#241C20', acc: '#F2A7BF', greet: 'Buon compleanno, {n}',       tag: 'Festeggia senza pensieri' },
  anniversario:{ name: 'Anniversario',  bg: '#1A1916', surf: '#27251F', surf2: '#37342B', nav: '#211F1A', acc: '#E2B866', greet: '{m} mesi di percorso, {n}',  tag: 'Guarda quanta strada' }
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
  return { key: r.key, ...t, greet };
}
