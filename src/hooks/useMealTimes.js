import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { MEAL_TIMES } from '../dates';

// Orari dei pasti: quelli dei promemoria attivi, altrimenti i predefiniti
export default function useMealTimes() {
  const [times, setTimes] = useState(MEAL_TIMES);
  useEffect(() => {
    supabase.from('push_subscriptions').select('reminders').eq('enabled', true).limit(1).maybeSingle()
      .then(({ data }) => { if (data?.reminders?.pasti?.length) setTimes(data.reminders.pasti); });
  }, []);
  return times;
}
