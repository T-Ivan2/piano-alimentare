import { supabase } from './supabase';

// Attiva un piano e disattiva gli altri in un'unica operazione nel database (supabase/fase6.sql).
// Finché la funzione non è stata creata, ripiega sulle due scritture separate di prima.
export async function activatePlan(id) {
  const { error } = await supabase.rpc('activate_plan', { p_id: id });
  if (!error) return null;
  if (error.code !== 'PGRST202') return error;
  const { error: e1 } = await supabase.from('plans').update({ active: false }).neq('id', id);
  if (e1) return e1;
  const { error: e2 } = await supabase.from('plans').update({ active: true, status: 'ok' }).eq('id', id);
  return e2 || null;
}
