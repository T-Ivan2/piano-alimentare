// Illustrazioni dei temi: nature morte serali generate, ritagliate in 3:1 e già appoggiate sul colore del fondo
// (i prompt sono incorporati negli originali). Si scarica solo quella del tema attivo.
const PAINTED = Object.fromEntries(
  Object.entries(import.meta.glob('../decor-img/*.jpg', { query: '?url', import: 'default', eager: true }))
    .map(([path, url]) => [path.split('/').pop().replace('.jpg', ''), url])
);

// Fascia illustrata del tema: a tutta larghezza, decorazione discreta sopra il pasto di adesso
export default function ThemeBand({ theme, className = '' }) {
  const src = PAINTED[theme.key] || PAINTED.base;
  return (
    <div className={`band-painted ${className}`} aria-hidden="true">
      <img src={src} alt="" decoding="async" />
    </div>
  );
}
