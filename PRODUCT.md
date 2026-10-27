# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Oggi l'utente è uno solo: Ivan, che segue il piano alimentare mensile della sua nutrizionista, Carlotta. Usa l'app sul telefono, come PWA installata.

In futuro l'app potrebbe aprirsi ad altre persone che seguono un piano di un nutrizionista. Per ora è una direzione, non un impegno. Il codice oggi è personale: il nome e le date personali stanno in `src/themes.js` (`PERSON`) e "Carlotta" compare nei testi, nell'import e nelle misure. Chi progetta non deve chiudere quella porta, ma nemmeno costruire funzioni multiutente non richieste.

## Product Purpose

L'app trasforma il piano del nutrizionista (un PDF mensile) in uno strumento quotidiano: cosa mangiare oggi, cosa è già fatto, quanta acqua, la settimana, la spesa e i progressi delle misure. Il successo è seguire il piano con costanza e senza fatica, con l'app che accompagna e non giudica.

I quattro momenti d'uso confermati hanno tutti peso:
1. **Controllo rapido ai pasti**: aprire, vedere cosa mangiare adesso, spuntare, chiudere. Pochi secondi, spesso con una mano.
2. **Organizzare settimana e spesa**: consultare i giorni e la lista della spesa in anticipo, a casa o al supermercato.
3. **Motivazione e progressi**: sentire di tenere il passo, attraverso la costanza, le misure e i saluti dei temi.
4. **Controlli con il nutrizionista**: portare dentro il nuovo piano del mese e le misure del controllo, senza errori.

## Positioning

Non è un contatore di calorie né un piano generico. L'app segue il piano di un nutrizionista reale, importato dal suo PDF e verificato dall'utente prima di diventare attivo. L'interpretazione dei numeri spetta al nutrizionista, non all'app.

## Operating Context

- Telefono, PWA installata e utilizzabile offline. Notifiche push per i pasti e l'acqua.
- Il piano arriva via mail come PDF. Uno script Gmail (`tools/gmail-importa-piano.gs`) lo manda a una funzione Netlify, che lo legge con Claude e lo salva come bozza da verificare. Nell'app la schermata di revisione mostra solo le differenze col piano attivo.
- Il controllo periodico con il nutrizionista produce misure: peso, massa grassa (plica e BIA), vita, fianchi, coscia, braccio. Si aggiungono anche misure personali tra un controllo e l'altro.
- Il piano ha 7 giorni con 4 pasti al giorno (colazione, pranzo, spuntino, cena), più sostituzioni, lista della spesa, consigli del mese e obiettivo d'acqua.

## Capabilities and Constraints

- **Stack**: React 18, Vite, Tailwind 4, Supabase (login e database con RLS), Netlify (hosting e funzioni). Lingua solo italiano.
- **Schermate**: Oggi, Settimana, Spesa, Progressi. Flussi secondari: sostituzioni, promemoria, gestione dei piani (nuovo, correzioni, archivio, import da PDF) e revisione del piano importato.
- **Temi stagionali automatici scelti per data** (stagioni, ricorrenze, compleanno, anniversario del percorso): restano, ma sono migliorabili.
- **Decisioni aperte**:
  - Tema scuro, chiaro o quello di sistema: da decidere. Oggi l'app è sempre scura.
  - Apertura ad altri utenti: possibile in futuro, nessun requisito ancora.

## Brand Commitments

- **Temi stagionali**: vanno tenuti, ma possono essere ripensati e migliorati.
- **Illustrazioni dei temi**: vanno tenute come idea. La qualità attuale non basta ("carine ma non belle") e vanno alzate di livello.
- **Tono di voce**: oggi è informale e incoraggiante ("Passo dopo passo", "Stai andando bene"). Non è stato confermato come vincolo e si può rimettere in discussione.

## Evidence on Hand

- I dati reali (piani, diario giornaliero, misure) stanno su Supabase.
- Le illustrazioni dei 16 temi stanno in `src/illustrations.js`.
- Le icone dell'app stanno in `public/`.
- Non esistono testimonianze, utenti esterni, recensioni o dati d'uso aggregati: non vanno inventati.

## Product Principles

1. **Il pasto di adesso prima di tutto**: l'uso più frequente dura pochi secondi e deve riuscire con una mano.
2. **Il nutrizionista decide, l'app accompagna**: niente giudizi sui numeri, niente consigli alimentari propri.
3. **Niente entra nel piano senza verifica**: ciò che arriva dall'import viene mostrato e confermato dall'utente.
4. **Costanza senza colpa**: i progressi motivano. Un giorno incompleto non viene trattato come un fallimento.
5. **Personale oggi, apribile domani**: le scelte non devono legare il prodotto per sempre a un solo utente o a un solo nutrizionista.
