-- Piano Alimentare · fase 3 (promemoria e notifiche)
-- Da incollare in Supabase → SQL Editor → New query → Run. Si può rieseguire senza danni.

create table if not exists public.push_subscriptions (
  id           bigint generated always as identity primary key,
  user_id      uuid not null references auth.users (id) on delete cascade default auth.uid(),
  endpoint     text not null unique,
  subscription jsonb not null,
  reminders    jsonb not null default '{}'::jsonb,
  last_sent    jsonb not null default '{}'::jsonb,
  enabled      boolean not null default true,
  created_at   timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
drop policy if exists "notifiche personali" on public.push_subscriptions;
create policy "notifiche personali" on public.push_subscriptions
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
