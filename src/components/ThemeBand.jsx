import Illustration from './Illustration';

const channels = (hex) => [1, 3, 5].map((k) => (parseInt(hex.slice(k, k + 2), 16) / 255).toFixed(3));

// Fascia illustrata del tema: l'illustrazione sempre intera, in bicromia fredda
// (ombre e toni medi sul fondo, solo le luci prendono l'accento del tema)
export default function ThemeBand({ theme, className = '' }) {
  const d = channels(theme.bg), l = channels(theme.acc);
  return (
    <div className={`band-art h-[72px] ${className}`} aria-hidden="true">
      <svg width="0" height="0" className="absolute">
        <filter id="duo" colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values=".3 .59 .11 0 0  .3 .59 .11 0 0  .3 .59 .11 0 0  0 0 0 1 0" />
          <feComponentTransfer>
            <feFuncR type="table" tableValues={`${d[0]} ${d[0]} ${l[0]}`} />
            <feFuncG type="table" tableValues={`${d[1]} ${d[1]} ${l[1]}`} />
            <feFuncB type="table" tableValues={`${d[2]} ${d[2]} ${l[2]}`} />
          </feComponentTransfer>
        </filter>
      </svg>
      <Illustration name={theme.key} />
    </div>
  );
}
