// Messaggi d'errore sempre in italiano: i testi tecnici di Supabase e del browser non arrivano a chi usa l'app
const KNOWN = [
  [/fetch|network|load failed/i, 'sei offline o la connessione non risponde'],
  [/jwt|token|auth/i, "la sessione è scaduta: esci e rientra"],
  [/permission|policy|rls/i, 'il database non permette questa operazione'],
];

export function italianError(error) {
  const text = String(error?.message || error || '');
  const hit = KNOWN.find(([re]) => re.test(text));
  if (text) console.warn('[piano-alimentare]', text);
  return hit ? hit[1] : 'qualcosa non ha risposto come doveva';
}
