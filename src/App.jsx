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
  const [pending, setPending] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('oggi');
  const [themesOn, setThemesOn] = useState(() => {
    try { return localStorage.getItem('temi') !== 'off'; } catch { return true; }
  });
  const theme = useMemo(() => getTheme(new Date(), themesOn), [themesOn]);
  const themeVars = {
    '--theme-text': theme.text,
    '--theme-muted': theme.muted,
    '--theme-accent': theme.acc,
    '--theme-on-accent': theme.onAcc,
    '--theme-line': theme.line,
    '--theme-glow': theme.glow,
    '--theme-active': theme.active,
    '--theme-bg': theme.bg,
    '--theme-edge': theme.edge,
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const [planVersion, setPlanVersion] = useState(0);
  useEffect(() => {
    if (!session) return;
    supabase.from('plans').select('*').eq('active', true).limit(1).maybeSingle()
      .then(({ data, error }) => {
        if (error) setError('Non riesco a leggere il piano: ' + error.message);
        else if (!data) setError('Nessun piano attivo nel database.');
        else { setError(''); setPlan(data); }
      });
    supabase.from('plans').select('*').eq('status', 'review').order('created_at', { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => setPending(data || null));
  }, [session, planVersion]);

  useEffect(() => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.bg);
    document.body.style.background = theme.bg;
  }, [theme]);

  const toggleThemes = () => {
    const v = !themesOn;
    setThemesOn(v);
    try { localStorage.setItem('temi', v ? 'on' : 'off'); } catch { /* ignora */ }
  };

  if (session === undefined) return <div className="theme-page min-h-dvh" style={{ ...themeVars, backgroundColor: theme.bg }} />;
  if (!session) return <Login theme={theme} />;

  return (
    <div className="theme-page min-h-dvh flex flex-col font-sans" style={{ ...themeVars, backgroundColor: theme.bg }}>
      <main className="flex-1 w-full max-w-md mx-auto px-4 sm:px-5 pt-6 sm:pt-7 pb-28">
        {error && <p role="alert" className="m-0 mb-4 px-3 py-3 text-[16px]" style={{ background: theme.surf, border: `1px solid ${theme.danger}` }}>{error}</p>}
        {!plan && !error && <p className="text-muted">Caricamento…</p>}
        {plan && tab === 'oggi' && (
          <Oggi key={plan.id} plan={plan} theme={theme} user={session.user} themesOn={themesOn} onToggleThemes={toggleThemes} pending={pending} onPlanChanged={() => setPlanVersion((v) => v + 1)} />
        )}
        {plan && tab === 'settimana' && <Settimana plan={plan} theme={theme} user={session.user} />}
        {plan && tab === 'spesa' && <Spesa plan={plan} theme={theme} user={session.user} />}
        {tab === 'progressi' && <Progressi theme={theme} />}
      </main>
      <Nav tab={tab} setTab={setTab} theme={theme} />
    </div>
  );
}
