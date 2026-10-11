// Illustrazioni dei temi: un file SVG per tema in src/decor
const files = import.meta.glob('./decor/*.svg', { query: '?raw', import: 'default', eager: true });

export const illustrations = Object.fromEntries(
  Object.entries(files).map(([path, svg]) => [path.split('/').pop().replace('.svg', ''), svg])
);
