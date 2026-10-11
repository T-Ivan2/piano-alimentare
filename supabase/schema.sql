-- Piano Alimentare · schema del database
-- Da incollare una volta in Supabase → SQL Editor → New query → Run.

-- 1. Piani alimentari (uno per mese; uno solo è attivo)
create table if not exists public.plans (
  id          bigint generated always as identity primary key,
  title       text not null,
  month_label text not null,
  goal        text,
  active      boolean not null default false,
  data        jsonb not null,
  created_at  timestamptz not null default now()
);

-- 2. Diario giornaliero: pasti fatti, acqua, indicazioni del mese
create table if not exists public.day_logs (
  user_id  uuid not null references auth.users (id) on delete cascade default auth.uid(),
  day      date not null,
  meals    jsonb not null default '{}'::jsonb,
  water    int  not null default 0,
  checks   jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

-- 3. Misure corporee
create table if not exists public.measurements (
  id        bigint generated always as identity primary key,
  user_id   uuid not null references auth.users (id) on delete cascade default auth.uid(),
  taken_on  date not null,
  source    text not null default 'personale',  -- 'carlotta' | 'personale'
  weight    numeric(5,1),
  fat_plica numeric(4,1),
  fat_bia   numeric(4,1),
  waist     numeric(5,1),
  hips      numeric(5,1),
  thigh     numeric(5,1),
  arm       numeric(5,1),
  created_at timestamptz not null default now()
);

-- Sicurezza: ogni riga è visibile solo al proprio utente
alter table public.plans        enable row level security;
alter table public.day_logs     enable row level security;
alter table public.measurements enable row level security;

drop policy if exists "piani leggibili da utenti autenticati" on public.plans;
create policy "piani leggibili da utenti autenticati" on public.plans
  for select to authenticated using (true);

drop policy if exists "diario personale" on public.day_logs;
create policy "diario personale" on public.day_logs
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "misure personali" on public.measurements;
create policy "misure personali" on public.measurements
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 4. Piano attuale (dal PDF di Carlotta)
update public.plans set active = false;
insert into public.plans (title, month_label, goal, active, data) values (
  'Piano di ottobre 2026', 'Mese 7', 'Perdita di peso e successivo aumento della massa muscolare', true,
  $json$
  {
    "indicazioni": ["Creatina 4 g al giorno"],
    "giorni": [
      { "nome": "Lunedì",    "pasti": ["1 bicchiere di latte o bev. veg + 50 g cereali soffiati / cornflakes / muesli", "Verdure + 50 g pane + 200 g carne", "1 frutto + 200 g budino proteico vaniglia", "80 g pasta + verdure + legumi"] },
      { "nome": "Martedì",   "pasti": ["1 bicchiere di latte o bev. veg + 4 fette biscottate + 1 cucchiaio di marmellata solo frutta", "Vellutata 300 g + 50 g pane + formaggio", "30 g proteine in polvere + 1 frutto", "80 g pasta + verdure + formaggio"] },
      { "nome": "Mercoledì", "pasti": ["125 g yogurt + 4 biscotti", "Verdure + 50 g pane + 200 g carne", "150 g skyr bianco + 30 g muesli", "80 g pasta + verdure + legumi"] },
      { "nome": "Giovedì",   "pasti": ["1 bicchiere di latte o bev. veg + 2 gallette con cioccolato fondente", "Verdure + 50 g pane + uova", "1 frutto + 30 g grana", "300 g patate + verdure + pesce"] },
      { "nome": "Venerdì",   "pasti": ["1 bicchiere di latte o bev. veg + 2 gallette con cioccolato fondente", "Verdure + 50 g pane + 200 g carne", "180 g yogurt Milk Pro bianco + 30 g muesli", "Verdure + 100 g pasta di legumi (es. De Cecco High Protein)"] },
      { "nome": "Sabato",    "pasti": ["2 pancake Milk-Pro + 1 cucchiaio di marmellata", "Verdure + 50 g pane + pesce", "1 frutto", "Pasto libero (si può spostare)"] },
      { "nome": "Domenica",  "pasti": ["Porridge: 30 g proteine in polvere + 50 g avena + 150 ml acqua + 1 cucchiaio crema di frutta secca 100%", "125 g pasta ripiena + verdure", "1 frutto", "Verdure + 50 g pane + uova"] }
    ],
    "consigli": [
      "Pranzo e cena si possono invertire.",
      "Se salti lo spuntino, recuperalo più tardi o aggiungilo a uno dei pasti principali.",
      "Acqua almeno 2,5 litri al giorno. Massimo 1 energy drink a settimana.",
      "2 cucchiai di olio al giorno. Aceto e sale con moderazione.",
      "Pesi a crudo e al netto degli scarti. Pasta, cereali e legumi pesati da cotti: moltiplica per 2."
    ],
    "acqua_ml": 2500
  }
  $json$
);
