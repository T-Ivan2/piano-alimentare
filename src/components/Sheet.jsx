import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

// Pannello condiviso per i flussi secondari.
// - "sheet": sale dal basso, per compiti brevi (sostituzioni, promemoria); tocco fuori = chiudi.
// - "full": a tutto schermo, per compiti lunghi (gestione e revisione del piano).
// Esc chiude, il focus resta dentro e torna dov'era, la pagina sotto non scorre ed è inerte.
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), summary';
let open = 0;

export default function Sheet({ theme, title, subtitle, onClose, variant = 'sheet', footer, children }) {
  const box = useRef(null);
  const titleId = useId();
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    const before = document.activeElement;
    const root = document.getElementById('root');
    open += 1;
    if (root) root.inert = true;
    document.body.style.overflow = 'hidden';
    box.current?.focus();

    const onKey = (e) => {
      if (!box.current?.contains(document.activeElement) && e.key !== 'Escape') return;
      if (e.key === 'Escape') { e.stopPropagation(); close.current?.(); return; }
      if (e.key !== 'Tab') return;
      const items = [...box.current.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === box.current)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    // solo il pannello più in alto risponde ai tasti
    const depth = open;
    const guarded = (e) => { if (depth === open) onKey(e); };
    document.addEventListener('keydown', guarded);
    return () => {
      document.removeEventListener('keydown', guarded);
      open -= 1;
      if (!open) {
        if (root) root.inert = false;
        document.body.style.overflow = '';
      }
      before?.focus?.();
    };
  }, []);

  const vars = { '--theme-text': theme.text, '--theme-muted': theme.muted, '--theme-accent': theme.acc, '--theme-on-accent': theme.onAcc,
    '--theme-line': theme.line, '--theme-edge': theme.edge, '--theme-bg': theme.bg };
  const full = variant === 'full';

  return createPortal(
    <div className={`fixed inset-0 z-30 flex ${full ? '' : 'items-end'} justify-center`}
      style={{ ...vars, background: full ? theme.bg : 'rgba(4, 6, 9, .72)' }}
      onClick={full ? undefined : onClose}>
      <div ref={box} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md flex flex-col outline-none font-sans ${full ? 'h-dvh' : 'max-h-[88dvh]'}`}
        style={{ background: theme.bg, color: theme.text, borderTop: full ? 'none' : `1px solid ${theme.edge}` }}>
        <header className="px-4 sm:px-5 pt-5 flex justify-between items-start gap-3 shrink-0">
          <div className="min-w-0">
            <h2 id={titleId} className="font-display text-[26px] leading-[1.1] font-bold m-0">{title}</h2>
            {subtitle && <p className="m-0 mt-1 text-[15px]" style={{ color: theme.muted }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label="Chiudi" className="w-11 h-11 shrink-0 flex items-center justify-center bg-transparent"
            style={{ border: `1px solid ${theme.edge}`, color: theme.text }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" /></svg>
          </button>
        </header>
        <div className="ruler mt-4 shrink-0" />
        <div className="flex-1 overflow-y-auto px-4 sm:px-5 pt-4 pb-6">{children}</div>
        {footer && (
          <div className="shrink-0 px-4 sm:px-5 pt-3" style={{ borderTop: `1px solid ${theme.line}`, background: theme.nav, paddingBottom: 'max(14px, env(safe-area-inset-bottom))' }}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

// Stili condivisi dei controlli dentro i pannelli (DESIGN.md › Components)
export const fieldStyle = (theme, bad) => ({ background: theme.surf, color: theme.text, border: `1px solid ${bad ? theme.danger : theme.edge}`, colorScheme: 'dark' });
export const outlineStyle = (theme, color) => ({ background: 'transparent', color: color || theme.text, border: `1px solid ${color || theme.edge}` });
export const primaryStyle = (theme) => ({ background: theme.acc, color: theme.onAcc, border: 0 });
