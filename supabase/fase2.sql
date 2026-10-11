-- Piano Alimentare · fase 2 (Spesa, Sostituzioni, Progressi)
-- Da incollare in Supabase → SQL Editor → New query → Run. Si può rieseguire senza danni.

-- Sostituzioni scelte nei pasti del giorno
alter table public.day_logs add column if not exists subs jsonb not null default '{}'::jsonb;

-- Spunte della lista della spesa, una riga per settimana
create table if not exists public.shopping (
  user_id    uuid not null references auth.users (id) on delete cascade default auth.uid(),
  week_start date not null,
  checks     jsonb not null default '{}'::jsonb,
  primary key (user_id, week_start)
);
alter table public.shopping enable row level security;
drop policy if exists "spesa personale" on public.shopping;
create policy "spesa personale" on public.shopping
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Misure: etichetta del controllo (es. "Mese 6"), data facoltativa
alter table public.measurements add column if not exists label text;
alter table public.measurements alter column taken_on drop not null;

-- Storico dal report di Carlotta (solo se non già caricato)
insert into public.measurements (user_id, label, source, weight, fat_plica, fat_bia, waist, hips, thigh, arm)
select u.id, v.label, 'carlotta', v.weight, v.fat_plica, v.fat_bia, v.waist, v.hips, v.thigh, v.arm
from (select id from auth.users order by created_at limit 1) u,
(values
  ('Mese 1', 83.3, null::numeric, null::numeric, 90.0, 105.0, 63.0, 31.0),
  ('Mese 2', 85.9, null, null, null, null, null, null),
  ('Mese 3', 87.3, null, null, null, null, null, null),
  ('Mese 4', 85.0, null, null, null, null, null, null),
  ('Mese 5', 88.0, null, null, null, null, null, null),
  ('Mese 6', 89.3, 22.6, 25.3, 94.0, 106.0, 65.0, 32.5)
) as v(label, weight, fat_plica, fat_bia, waist, hips, thigh, arm)
where not exists (select 1 from public.measurements where source = 'carlotta');

-- Lista della spesa e sostituzioni nel piano attivo
update public.plans set data = data || $json$
{
  "spesa": [
    { "gruppo": "Proteine", "voci": [
      ["Carne magra", "600 g", "lun, mer, ven pranzo"], ["Pesce", "2 porzioni", "gio cena, sab pranzo"],
      ["Uova", "4", "gio pranzo, dom cena"], ["Legumi", "2 porzioni", "lun, mer cena"],
      ["Proteine in polvere", "60 g", "mar spuntino, dom colazione"] ] },
    { "gruppo": "Latticini", "voci": [
      ["Latte o bevanda vegetale", "4 bicchieri", "lun, mar, gio, ven colazione"], ["Formaggio", "2 porzioni", "mar pranzo e cena"],
      ["Skyr bianco", "150 g", "mer spuntino"], ["Yogurt Milk Pro bianco", "180 g", "ven spuntino"],
      ["Yogurt", "125 g", "mer colazione"], ["Budino proteico vaniglia", "200 g", "lun spuntino"],
      ["Grana", "30 g", "gio spuntino"], ["Pancake Milk-Pro", "2", "sab colazione"] ] },
    { "gruppo": "Pane e cereali", "voci": [
      ["Pane", "350 g", "7 pasti da 50 g"], ["Pasta", "240 g", "lun, mar, mer cena"],
      ["Pasta di legumi", "100 g", "ven cena"], ["Pasta ripiena", "125 g", "dom pranzo"],
      ["Muesli", "60 g", "mer, ven spuntino"], ["Cereali soffiati / cornflakes", "50 g", "lun colazione"],
      ["Avena", "50 g", "dom colazione"], ["Fette biscottate", "4", "mar colazione"], ["Biscotti", "4", "mer colazione"],
      ["Gallette al cioccolato fondente", "4", "gio, ven colazione"], ["Patate", "300 g", "gio cena"] ] },
    { "gruppo": "Frutta e verdura", "voci": [
      ["Frutta", "5", "spuntini di lun, mar, gio, sab, dom"], ["Verdure miste", "circa 10 porzioni", "quasi ogni pasto"],
      ["Vellutata", "300 g", "mar pranzo"] ] },
    { "gruppo": "Dispensa", "voci": [
      ["Marmellata solo frutta", "1 vasetto", "mar, sab colazione"], ["Crema di frutta secca 100%", "1 vasetto", "dom colazione"],
      ["Creatina", "4 g al giorno", "indicazione del mese"], ["Olio extravergine", "2 cucchiai al giorno", "condimento"] ] }
  ],
  "sostituzioni": [
    { "id": "pane", "titolo": "50 g pane", "parole": ["pane"], "nota": "Pesi a crudo e al netto degli scarti.", "sezioni": [
      { "nome": "Equivalenti", "opzioni": [["Grissini", "40 g"], ["Triangolini di mais", "40 g"], ["Taralli", "40 g"], ["Patate", "150 g"], ["Frisella grande", "1"], ["Frutto grande", "1"]] } ] },
    { "id": "pasta", "titolo": "80 g pasta", "parole": ["pasta", "patate"], "nota": "Cereali vari: riso, farro, orzo, cous-cous, miglio, quinoa… Prediligi gli integrali.", "sezioni": [
      { "nome": "Equivalenti", "opzioni": [["Altro cereale", "80 g"], ["Pane", "100 g"], ["Pasta fresca", "100 g"], ["Patate", "300 g"], ["Gnocchi", "200 g"]] } ] },
    { "id": "frutto", "titolo": "1 frutto", "parole": ["frutto"], "nota": "", "sezioni": [
      { "nome": "Equivalenti", "opzioni": [["Frutto grande (es. banana)", "1"], ["Frutti piccoli (es. albicocche)", "2"], ["Mirtilli, lamponi, fragole", "150 g"], ["Melone o anguria", "200 g"]] } ] },
    { "id": "secondo", "titolo": "Secondo piatto", "parole": ["carne", "pesce", "uova", "formaggio", "legumi"], "nota": "Se unisci due fonti proteiche nello stesso pasto, dimezza la quantità di una delle due. Frequenza settimanale: carne 3, uova 3, formaggi 3, pesce 4 o più, legumi 4 o più.", "sezioni": [
      { "nome": "Pesce", "opzioni": [["Pesce magro (merluzzo, branzino, sarde, alici, pesce spada)", "200 g"], ["Orata, sgombro", "150 g"], ["Tonno o sgombro in scatola", "1 grande o 2 piccole"], ["Salmone affumicato", "100 g"]] },
      { "nome": "Carne", "opzioni": [["Carne, tagli magri (fesa, filetto, petto, coscia senza pelle)", "150 g"], ["Hamburger (ogni tanto)", "1"], ["Bresaola, cotto, crudo o speck sgrassati, carpaccio", "100 g"]] },
      { "nome": "Uova e formaggi", "opzioni": [["Uova", "2"], ["Ricotta", "100 g"], ["Mozzarella", "1"], ["Fiocchi di latte", "1 vasetto"], ["Formaggio molle (robiola, taleggio, primosale) — ogni tanto", "100 g"], ["Tomino, philadelphia, feta, stagionato — ogni tanto", "50 g"]] },
      { "nome": "Legumi e vegetale", "opzioni": [["Legumi secchi", "50 g"], ["Legumi in barattolo", "1 scatola"], ["Legumi surgelati", "150 g"], ["Hummus", "100 g"], ["Tofu", "125 g"], ["Seitan", "100 g"], ["Tempeh", "75 g"], ["Granulare di soia", "40 g"], ["Burger o straccetti di soia", "100 g"], ["Sugo proteico (carne, pesce o legumi)", "150 g"]] } ] }
  ]
}
$json$::jsonb
where active = true;
