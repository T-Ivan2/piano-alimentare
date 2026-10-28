-- Piano Alimentare · fase 6 (attivazione del piano in un'unica operazione)
-- Da incollare in Supabase → SQL Editor → New query → Run. Si può rieseguire senza danni.
-- Prima l'app disattivava tutti i piani e poi attivava quello scelto con due scritture separate:
-- se la seconda falliva restava senza piano attivo. Ora è una sola istruzione, tutto o niente.

create or replace function public.activate_plan(p_id bigint)
returns void
language plpgsql
security invoker
as $$
begin
  if not exists (select 1 from public.plans where id = p_id) then
    raise exception 'Piano % non trovato', p_id;
  end if;
  update public.plans
     set active = (id = p_id),
         status = case when id = p_id then 'ok' else status end
   where active or id = p_id;
end;
$$;

grant execute on function public.activate_plan(bigint) to authenticated;
