-- Piano Alimentare · fase 5 (piano nuovo dalla mail di Carlotta)
-- Da incollare in Supabase → SQL Editor → New query → Run. Si può rieseguire senza danni.

alter table public.plans add column if not exists status text not null default 'ok';      -- ok | review | discarded
alter table public.plans add column if not exists source_ref text;                         -- id della mail, per non importarla due volte
alter table public.plans add column if not exists review jsonb not null default '{}'::jsonb; -- misure estratte e dubbi dell'AI
create unique index if not exists plans_source_ref_key on public.plans (source_ref) where source_ref is not null;
