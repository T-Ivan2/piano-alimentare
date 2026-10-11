# Piano Alimentare

PWA personale per seguire il piano alimentare: pasti del giorno, acqua, indicazioni del mese, settimana, con temi stagionali automatici.

Stack: React + Vite + Tailwind · Supabase (login e database) · Netlify.

## Avvio locale

```bash
npm install
npm run dev
```

## Configurazione

- `supabase/schema.sql`: crea tabelle, regole di sicurezza (RLS) e carica il piano attivo. Si esegue nel SQL Editor di Supabase.
- `src/config.js`: URL del progetto Supabase e publishable key (sovrascrivibili con `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`).
- `src/themes.js`: calendario dei temi stagionali e personali.

## Deploy

Netlify legge `netlify.toml`: build `npm run build`, cartella `dist`.
