-- Piano Alimentare · fase 4 (gestione dei piani dall'app)
-- Da incollare in Supabase → SQL Editor → New query → Run. Si può rieseguire senza danni.
-- Le registrazioni sono chiuse, quindi l'unico utente autenticato sei tu.

drop policy if exists "piani modificabili da utenti autenticati" on public.plans;
create policy "piani modificabili da utenti autenticati" on public.plans
  for insert to authenticated with check (true);

drop policy if exists "piani aggiornabili da utenti autenticati" on public.plans;
create policy "piani aggiornabili da utenti autenticati" on public.plans
  for update to authenticated using (true) with check (true);
