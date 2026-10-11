// Palette stagionali e personali: scelte in automatico in base alla data.
// Priorità: personali > ricorrenze > stagioni > base.
// Ogni palette mantiene la stessa gerarchia di superfici e contrasto.

const T = {
  base:         { name: 'Base',           bg: '#171C18', surf: '#222A23', surf2: '#303B30', nav: '#1D251F', acc: '#C1D98A', glow: 'rgba(152, 180, 104, .15)', text: '#F2F3E8', muted: '#B5C1AA', line: 'rgba(193, 217, 138, .14)', greet: null, tag: 'Stai andando bene' },
  autunno:      { name: 'Autunno',        bg: '#201710', surf: '#302219', surf2: '#433025', nav: '#281C14', acc: '#F0A45E', glow: 'rgba(214, 116, 54, .17)', text: '#F7EEE3', muted: '#C8AA91', line: 'rgba(240, 164, 94, .16)', greet: 'Buon autunno, {n}', tag: 'Passo dopo passo' },
  inverno:      { name: 'Inverno',        bg: '#111A24', surf: '#1D2935', surf2: '#2A3948', nav: '#17222D', acc: '#A9D5F2', glow: 'rgba(103, 163, 202, .18)', text: '#EDF5FA', muted: '#A9BDCC', line: 'rgba(169, 213, 242, .16)', greet: 'Stai al caldo, {n}', tag: 'Costanza anche al freddo' },
  primavera:    { name: 'Primavera',      bg: '#201820', surf: '#302531', surf2: '#423345', nav: '#281F29', acc: '#F3A9C4', glow: 'rgba(208, 124, 159, .17)', text: '#F8EDF3', muted: '#C9B2C0', line: 'rgba(243, 169, 196, .17)', greet: 'Buona primavera, {n}', tag: 'Tutto rifiorisce' },
  estate:       { name: 'Estate',         bg: '#1D1911', surf: '#2C2518', surf2: '#3D3320', nav: '#252014', acc: '#F5B45E', glow: 'rgba(233, 157, 60, .16)', text: '#F8F1E3', muted: '#C6B79A', line: 'rgba(245, 180, 94, .16)', greet: 'Buona estate, {n}', tag: 'Idratati bene oggi' },
  settembre:    { name: 'Settembre',      bg: '#191B15', surf: '#272A1E', surf2: '#373B29', nav: '#202218', acc: '#E2C36D', glow: 'rgba(184, 157, 73, .16)', text: '#F2F1E5', muted: '#BBB99D', line: 'rgba(226, 195, 109, .16)', greet: 'Si ricomincia, {n}', tag: 'Nuova stagione, stesse buone abitudini' },
  halloween:    { name: 'Halloween',      bg: '#191321', surf: '#282034', surf2: '#392D49', nav: '#211A2B', acc: '#FF9B52', glow: 'rgba(163, 87, 218, .19)', text: '#F5EFF9', muted: '#BBAFC9', line: 'rgba(255, 155, 82, .18)', greet: 'Dolcetto o scherzetto, {n}', tag: 'Niente paura, sei in pista' },
  natale:       { name: 'Natale',         bg: '#151D1A', surf: '#202D27', surf2: '#2D4036', nav: '#1A2621', acc: '#E9C875', glow: 'rgba(91, 151, 107, .18)', text: '#F4F2E8', muted: '#B6C2B3', line: 'rgba(233, 200, 117, .17)', greet: 'Buone feste, {n}', tag: 'Goditi la giornata' },
  capodanno:    { name: 'Capodanno',      bg: '#181621', surf: '#252333', surf2: '#353247', nav: '#1E1C29', acc: '#F0D18B', glow: 'rgba(127, 108, 190, .18)', text: '#F3F0FA', muted: '#B9B4CA', line: 'rgba(240, 209, 139, .17)', greet: 'Buon anno, {n}', tag: 'Che anno!' },
  epifania:     { name: 'Epifania',       bg: '#121A2B', surf: '#1D2740', surf2: '#2B3854', nav: '#182238', acc: '#F0D276', glow: 'rgba(91, 134, 206, .2)', text: '#EEF2FB', muted: '#AEBBD5', line: 'rgba(140, 180, 240, .17)', greet: 'Buona Epifania, {n}', tag: 'Si riparte con calma' },
  valentino:    { name: 'San Valentino',  bg: '#21151B', surf: '#322129', surf2: '#472D38', nav: '#291C23', acc: '#F49BAF', glow: 'rgba(218, 95, 129, .19)', text: '#F9EDF0', muted: '#CCAFB8', line: 'rgba(244, 155, 175, .17)', greet: 'Buon San Valentino, {n}', tag: 'Volersi bene, anche a tavola' },
  carnevale:    { name: 'Carnevale',      bg: '#1A1724', surf: '#292438', surf2: '#39324D', nav: '#211D2D', acc: '#F3C96A', glow: 'rgba(118, 91, 195, .2)', text: '#F4F0FA', muted: '#BEB5D0', line: 'rgba(243, 201, 106, .18)', greet: 'Buon Carnevale, {n}', tag: 'Una chiacchiera ci sta' },
  pasqua:       { name: 'Pasqua',         bg: '#1B1D15', surf: '#292D1D', surf2: '#3A4027', nav: '#232519', acc: '#E9DC82', glow: 'rgba(147, 170, 92, .18)', text: '#F4F2E6', muted: '#BCC09F', line: 'rgba(233, 220, 130, .18)', greet: 'Buona Pasqua, {n}', tag: 'Festa con equilibrio' },
  ferragosto:   { name: 'Ferragosto',     bg: '#111E20', surf: '#1B2D30', surf2: '#294145', nav: '#172629', acc: '#73D8D5', glow: 'rgba(65, 176, 176, .2)', text: '#EAF7F5', muted: '#A8C9C7', line: 'rgba(115, 216, 213, .17)', greet: 'Buon Ferragosto, {n}', tag: 'Acqua, acqua, acqua' },
  compleanno:   { name: 'Compleanno',     bg: '#201720', surf: '#302431', surf2: '#433246', nav: '#281E29', acc: '#F2A8D0', glow: 'rgba(187, 104, 173, .2)', text: '#F8EDF5', muted: '#C8B0C2', line: 'rgba(242, 168, 208, .18)', greet: 'Buon compleanno, {n}', tag: 'Festeggia senza pensieri' },
  anniversario: { name: 'Anniversario',   bg: '#191A16', surf: '#28291F', surf2: '#39392A', nav: '#212219', acc: '#E8C17D', glow: 'rgba(149, 128, 74, .16)', text: '#F3F0E6', muted: '#BEB8A5', line: 'rgba(232, 193, 125, .17)', greet: '{m} mesi di percorso, {n}', tag: 'Guarda quanta strada' }
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
  return { key: r.key, ...t, onAcc: '#171713', active: `color-mix(in srgb, ${t.acc} 15%, ${t.surf})`, greet };
}
