const TABS = [['oggi', 'Oggi'], ['settimana', 'Settimana'], ['spesa', 'Spesa'], ['progressi', 'Progressi']];

export default function Nav({ tab, setTab, theme }) {
  return (
    <nav className="theme-nav fixed bottom-0 inset-x-0 z-10" style={{ background: theme.nav }}>
      <div className="max-w-md mx-auto grid grid-cols-4 px-2" style={{ paddingBottom: 'max(14px, env(safe-area-inset-bottom))' }}>
        {TABS.map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} aria-current={tab === k ? 'page' : undefined}
            className="label min-h-12 pt-1 px-1 text-[14px] bg-transparent border-0"
            style={{ color: tab === k ? theme.acc : theme.muted }}>
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}
