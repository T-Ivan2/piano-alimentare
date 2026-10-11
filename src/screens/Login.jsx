import { useState } from 'react';
import { supabase } from '../supabase';
import Illustration from '../components/Illustration';

export default function Login({ theme }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message === 'Invalid login credentials' ? 'Email o password non corretti.' : error.message);
    setBusy(false);
  };

  const field = { background: theme.surf, color: '#F3EADD', border: `1.5px solid ${theme.surf2}` };

  return (
    <div className="min-h-dvh flex items-center justify-center px-5 font-sans" style={{ background: theme.bg }}>
      <form onSubmit={submit} className="w-full max-w-sm flex flex-col gap-4">
        <Illustration name={theme.key} />
        <div>
          <p className="text-muted m-0 text-sm">Il tuo piano alimentare</p>
          <h1 className="font-display text-[32px] font-semibold m-0">Bentornato</h1>
        </div>
        <label className="flex flex-col gap-1.5 text-sm">
          Email
          <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="h-12 rounded-2xl px-4 text-base outline-none" style={field} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          Password
          <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="h-12 rounded-2xl px-4 text-base outline-none" style={field} />
        </label>
        {error && <p className="m-0 text-sm" style={{ color: '#F0A08A' }}>{error}</p>}
        <button type="submit" disabled={busy} className="h-13 py-3.5 rounded-full border-0 font-bold text-base"
          style={{ background: theme.acc, color: '#1A1512', opacity: busy ? 0.6 : 1 }}>
          {busy ? 'Accesso…' : 'Entra'}
        </button>
      </form>
    </div>
  );
}
