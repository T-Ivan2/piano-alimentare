const TABS = [['oggi', 'Oggi'], ['settimana', 'Settimana'], ['spesa', 'Spesa'], ['progressi', 'Progressi']];

export default function Nav({ tab, setTab, theme }) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-10" style={{ background: theme.nav, borderRadius: '26px 26px 0 0' }}>
      <div className="max-w-md mx-auto grid grid-cols-4 px-2 pt-2" style={{ paddingBottom: 'max(18px, env(safe-area-inset-bottom))' }}>
        {TABS.map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} aria-current={tab === k ? 'page' : undefined}
            className="py-3 text-[13px] bg-transparent border-0"
            style={{ color: tab === k ? theme.acc : '#B8A998', fontWeight: tab === k ? 700 : 400 }}>
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}
