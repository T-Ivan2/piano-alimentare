// Icone a tratto squadrato, come chiede il mondo visivo (DESIGN.md › Shapes)
export function SwapIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="square" aria-hidden="true" className="shrink-0 mt-[3px]">
      <path d="M4 8h14l-4-4M20 16H6l4 4" />
    </svg>
  );
}

export function CheckIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" aria-hidden="true">
      <path d="M4 12l5 5L20 6" />
    </svg>
  );
}
