import { useState } from 'react';
import { supabase } from '../supabase';
import ThemeBand from '../components/ThemeBand';
import { fieldStyle, primaryStyle } from '../components/Sheet';

// Messaggi di Supabase tradotti; il resto diventa un errore generico con la causa tra parentesi
const ERRORS = {
  'Invalid login credentials': 'Email o password non corretti.',
  'Email not confirmed': "L'email non è ancora confermata: controlla la posta.",
  'Failed to fetch': 'Non riesco a collegarmi. Controlla la connessione e riprova.',
};

export default function Login({ theme }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(ERRORS[error.message] || `Accesso non riuscito, riprova (${error.message}).`);
    setBusy(false);
  };

  const vars = { '--theme-text': theme.text, '--theme-muted': theme.muted, '--theme-accent': theme.acc, '--theme-on-accent': theme.onAcc,
    '--theme-line': theme.line, '--theme-edge': theme.edge, '--theme-bg': theme.bg };

  return (
    <div className="theme-page min-h-dvh flex flex-col justify-center px-4 py-8 font-sans" style={{ ...vars, backgroundColor: theme.bg, color: theme.text }}>
      <form onSubmit={submit} className="w-full max-w-sm mx-auto flex flex-col">
        <h1 className="font-display text-[40px] leading-none font-bold uppercase m-0" style={{ color: theme.acc }}>Bentornato</h1>
        <p className="m-0 mt-2 text-[16px]" style={{ color: theme.muted }}>Il tuo piano alimentare</p>
        <ThemeBand theme={theme} className="mt-4" />
        <div className="ruler" />
        <label className="flex flex-col gap-1 mt-6 text-[14px]" style={{ color: theme.muted }}>Email
          <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!error} className="h-12 px-3 text-[16px]" style={fieldStyle(theme, !!error)} />
        </label>
        <label className="flex flex-col gap-1 mt-3 text-[14px]" style={{ color: theme.muted }}>Password
          <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!error} className="h-12 px-3 text-[16px]" style={fieldStyle(theme, !!error)} />
        </label>
        {error && <p role="alert" className="m-0 mt-3 text-[15px]" style={{ color: theme.danger }}>{error}</p>}
        <button type="submit" disabled={busy} className="cut-br theme-action label min-h-12 px-8 mt-5 self-end text-[17px] disabled:opacity-60" style={primaryStyle(theme)}>
          {busy ? 'Accesso…' : 'Entra'}
        </button>
      </form>
    </div>
  );
}
