import { useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase';
import { getTheme } from './themes';
import Login from './screens/Login';
import Oggi from './screens/Oggi';
import Settimana from './screens/Settimana';
import Spesa from './screens/Spesa';
import Progressi from './screens/Progressi';
import Nav from './components/Nav';

export default function App() {
  const [session, setSession] = useState(undefined);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('oggi');
  const [themesOn, setThemesOn] = useState(() => {
    try { return localStorage.getItem('temi') !== 'off'; } catch { return true; }
  });
  const theme = useMemo(() => getTheme(new Date(), themesOn), [themesOn]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    supabase.from('plans').select('*').eq('active', true).limit(1).maybeSingle()
      .then(({ data, error }) => {
        if (error) setError('Non riesco a leggere il piano: ' + error.message);
        else if (!data) setError('Nessun piano attivo nel database.');
        else setPlan(data);
      });
  }, [session]);

  useEffect(() => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.bg);
    document.body.style.background = theme.bg;
  }, [theme]);

  const toggleThemes = () => {
    const v = !themesOn;
    setThemesOn(v);
    try { localStorage.setItem('temi', v ? 'on' : 'off'); } catch { /* ignora */ }
  };

  if (session === undefined) return <div className="min-h-dvh" style={{ background: theme.bg }} />;
  if (!session) return <Login theme={theme} />;

  return (
    <div className="min-h-dvh flex flex-col font-sans" style={{ background: theme.bg }}>
      <main className="flex-1 w-full max-w-md mx-auto px-5 pt-7 pb-28">
        {error && <p className="rounded-2xl p-4 mb-4" style={{ background: theme.surf }}>{error}</p>}
        {!plan && !error && <p className="text-muted">Caricamento…</p>}
        {plan && tab === 'oggi' && (
          <Oggi plan={plan} theme={theme} user={session.user} themesOn={themesOn} onToggleThemes={toggleThemes} />
        )}
        {plan && tab === 'settimana' && <Settimana plan={plan} theme={theme} />}
        {plan && tab === 'spesa' && <Spesa plan={plan} theme={theme} user={session.user} />}
        {tab === 'progressi' && <Progressi theme={theme} />}
      </main>
      <Nav tab={tab} setTab={setTab} theme={theme} />
    </div>
  );
}
