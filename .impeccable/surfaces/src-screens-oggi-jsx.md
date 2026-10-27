---
version: 1
slug: "src-screens-oggi-jsx"
primary_target: "src/screens/Oggi.jsx"
related_targets: ["src/App.jsx","src/components/Nav.jsx"]
---

# Oggi

Modalità: Operate. Schermata quotidiana del telefono, usata a una mano per pochi secondi ai pasti.

## Scopo
- Rispondere a "cosa mangio adesso?". Aprire, vedere il pasto di adesso, spuntarlo, chiudere.
- Un pasto è "adesso" dal suo orario fino all'orario del successivo; spuntarlo fa passare subito al pasto dopo. Prima del primo orario si vede la colazione.
- Gli orari vengono dai promemoria (default 08:00, 13:00, 16:30, 20:00).
- I pasti saltati restano piccoli nel tabellone, si possono spuntare in ritardo e non hanno segni di colpa.
- A giornata finita compare un momento di chiusura con l'anteprima della colazione di domani.
- Su Oggi restano acqua, progressi del giorno e della settimana, illustrazione del tema. I consigli del mese passano in Settimana.

## Decisioni aperte
- Ridisegno delle illustrazioni dei 16 temi in stile cyberpunk (lavoro a parte). Nel frattempo sono mostrate in bicromia nel colore del tema.
- Settimana, Spesa e Progressi andranno portate nello stesso mondo in un secondo momento.

## Direction contract

THESIS: il pasto di adesso è la schermata. Un pannello da interfaccia cyberpunk (alla Cyberpunk 2077, ma pulito) ne occupa il centro, e la giornata scorre sotto come un tabellone orario. Rifiuta la pila da app del benessere: saluto, anello, card tutte uguali.

OWN-WORLD: fondo quasi nero freddo (#0B0F14) con superfici a due livelli. Un accento acido per tema (giallo #FCEE0A di base), ciano #04DAF6 per "fatto" e acqua, rosso solo per gli errori. Angoli tagliati a 45°, filetti da 1px, righello a tacche, etichette in maiuscolo con tracking largo. Rajdhani per nomi, orari e controlli; Barlow per i testi. Niente bagliori diffusi, niente gradienti.

STORY: Ivan capisce subito cosa mangiare e a che ora, lo spunta col pollice e vede la giornata avanzare. Se salta un pasto, il pannello passa avanti senza giudicare. Il tema stagionale cambia il colore dell'accento e la fascia illustrata.

FIRST VIEWPORT: in alto una fascia bassa con l'illustrazione del tema in bicromia, il saluto del tema e il pulsante profilo. Poi il pannello del pasto di adesso: nome enorme nell'accento, orario sulla stessa riga, menù in testo pieno, "Sostituisci" a contorno e "Fatto" come lastra piena in basso a destra (zona del pollice). Sotto, il tabellone dei 4 pasti (orario, nome, menù, pulsante di stato da 44px) e la riga dell'acqua a 10 segmenti. Nav a 4 voci testuali in basso.

FORM: direzione fissata dall'utente (cyberpunk, stile 2077 pulito) al posto del tiro; il tabellone orario viene dalla carta "tabellone delle partenze", che l'utente aveva preferito. Gesto distintivo: quando spunti, il pannello entra con un glitch a fette di 300ms e porta il pasto successivo. seed:a661e987524f2995

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
