---
name: Piano Alimentare
description: Il piano della nutrizionista come pannello da interfaccia cyberpunk, scuro e pulito, letto a una mano ai pasti.
colors:
  accent: "#FCEE0A"
  on-accent: "#0B0F14"
  done: "#04DAF6"
  danger: "#FF4D5E"
  bg: "#0B0F14"
  surf: "#121A22"
  surf2: "#1C2630"
  nav: "#0E1319"
  text: "#E6EDF2"
  muted: "#8FA0AE"
  line: "#24303B"
  edge: "#5E7180"
typography:
  display:
    fontFamily: "Rajdhani, Barlow, system-ui, sans-serif"
    fontSize: "48px"
    fontWeight: 700
    lineHeight: 0.9
  display-close:
    fontFamily: "Rajdhani, Barlow, system-ui, sans-serif"
    fontSize: "40px"
    fontWeight: 700
    lineHeight: 1
  headline:
    fontFamily: "Rajdhani, Barlow, system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 700
    lineHeight: 1.1
  title:
    fontFamily: "Rajdhani, Barlow, system-ui, sans-serif"
    fontSize: "19px"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "0.025em"
  time:
    fontFamily: "Rajdhani, Barlow, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1
    fontFeature: "\"tnum\""
  body-lg:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.4
  body:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.375
  body-md:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.375
  body-sm:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.375
  label:
    fontFamily: "Rajdhani, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 700
    letterSpacing: "0.16em"
  label-sm:
    fontFamily: "Rajdhani, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 700
    letterSpacing: "0.16em"
  label-lg:
    fontFamily: "Rajdhani, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 700
    letterSpacing: "0.16em"
rounded:
  none: "0px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "28px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 28px"
    height: "48px"
  button-outline:
    backgroundColor: "{colors.surf}"
    textColor: "{colors.text}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 16px"
    height: "48px"
  state-toggle:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.text}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    width: "96px"
    height: "44px"
  state-toggle-focus:
    backgroundColor: "{colors.surf}"
    textColor: "{colors.accent}"
    typography: "{typography.label}"
    width: "96px"
    height: "44px"
  state-toggle-done:
    backgroundColor: "{colors.done}"
    textColor: "{colors.on-accent}"
    typography: "{typography.label}"
    width: "96px"
    height: "44px"
  now-panel:
    backgroundColor: "{colors.surf}"
    textColor: "{colors.text}"
    rounded: "{rounded.none}"
    padding: "12px 16px"
  water-segment:
    backgroundColor: "{colors.surf}"
    height: "44px"
  water-segment-on:
    backgroundColor: "{colors.done}"
    height: "44px"
  nav-item:
    backgroundColor: "{colors.nav}"
    textColor: "{colors.muted}"
    typography: "{typography.label}"
    height: "48px"
  nav-item-active:
    backgroundColor: "{colors.nav}"
    textColor: "{colors.accent}"
    typography: "{typography.label}"
    height: "48px"
---

# Design System: Piano Alimentare

## Overview

**Creative North Star: "Il terminale del pasto"**

Un'interfaccia da Cyberpunk 2077, ma pulita: fondo quasi nero e freddo, filetti da 1px, angoli tagliati a 45°, etichette tecniche in maiuscolo con tracking largo, un solo accento acido. Il mondo è sempre scuro (`color-scheme: dark`); un tema chiaro non è previsto. Il pasto di adesso è la schermata: un pannello a cornice tagliata ne occupa il centro e la giornata scorre sotto come un tabellone orario. L'app si legge in pochi secondi, a una mano, e il pollice trova l'azione principale in basso a destra.

La densità è da cruscotto, non da app del benessere: niente saluto gigante, niente anelli, niente pile di card tutte uguali. Il carattere viene dalla geometria (tagli, righello a tacche, griglia a colonne fisse) e dalla tipografia condensata, non da effetti di luce. I temi stagionali cambiano solo il colore d'accento, il saluto e la fascia illustrata; i neutri, i ruoli fissi e la forma restano identici in tutti i 16 temi.

Il mondo rifiuta in modo esplicito: veli a gradiente, bagliori e aloni neon, bordi sinistri colorati come accento, etichette-kicker sopra i titoli, ciano fuori da "fatto" e acqua.

**Key Characteristics:**
- Scuro sempre, freddo, con superfici a due livelli e filetti da 1px.
- Un solo accento per tema, riservato al pasto di adesso, all'azione principale e alla voce di nav attiva.
- Angoli tagliati a 45° al posto degli arrotondamenti; raggio zero ovunque.
- Rajdhani per nomi, orari e controlli; Barlow per i testi.
- Profondità piatta: nessuna ombra, nessun bagliore.
- Un solo gesto di movimento: l'ingresso a glitch quando cambia il pasto di adesso.

## Colors

Neutri freddi quasi neri, un accento acido che cambia col tema e due ruoli fissi (ciano e rosso) che non cambiano mai.

### Primary
- **Giallo Acido** (accent): il tema base. È il colore del pasto di adesso (nome, orario, stato), della lastra "Fatto", della voce di nav attiva, dell'anello di focus e della selezione testo. Gli altri 15 accenti (Autunno, Halloween, Natale, Inverno...) stanno in `src/themes.js` e sostituiscono soltanto questo valore; il testo sopra l'accento è sempre **Nero Terminale** (on-accent).

### Secondary
- **Ciano Fatto** (done): solo per lo stato "fatto" (pulsante di stato pieno, casella spuntata dei consigli) e per l'acqua (segmenti accesi, contatore in litri). Non cambia col tema.

### Tertiary
- **Rosso Allarme** (danger): solo errori di salvataggio, il loro "Riprova" e la voce "Esci". Mai decorativo.

### Neutral
- **Nero Terminale** (bg): fondo di pagina, `theme-color` del browser e del manifest, testo sopra accento e ciano.
- **Lavagna Notte** (surf): superficie di primo livello: interno del pannello del pasto, riga a fuoco del tabellone, segmenti d'acqua spenti, menu del profilo.
- **Lavagna Alta** (surf2): secondo livello, per piccoli controlli pieni come il pulsante profilo.
- **Fondo Nav** (nav): barra di navigazione in basso, appena sopra il fondo.
- **Bianco Freddo** (text): testo principale.
- **Grigio Strumento** (muted): etichette, colonne del tabellone, menù dei pasti non a fuoco, pasti già fatti, voci di nav inattive.
- **Filetto** (line): divisori da 1px tra le righe, il righello a tacche. Solo struttura, mai contorno di controlli.
- **Contorno Controlli** (edge): bordo da 1px di ogni controllo interattivo e cornice del pannello; tiene almeno 3:1 sulle superfici.

### Named Rules
**La Regola dell'Accento Unico.** L'accento segna una cosa sola: ciò che conta adesso (il pasto di adesso, la sua azione, la scheda attiva). Se compare su un elemento che non è "adesso" o "azione principale", è sbagliato.

**La Regola del Ciano Riservato.** Il ciano significa "fatto" o "acqua", nient'altro. Non è un secondo accento e non decora.

**La Regola del Contorno Leggibile.** I controlli hanno il bordo in Contorno Controlli (edge), non in Filetto (line): il filetto separa, il contorno si tocca.

## Typography

**Display Font:** Rajdhani (con Barlow, system-ui), pesi 500/600/700, self-hosted via @fontsource
**Body Font:** Barlow (con system-ui), pesi 400/500/600, self-hosted via @fontsource

**Character:** Rajdhani è il carattere della macchina: condensato, squadrato, sempre in grassetto e spesso maiuscolo, per nomi dei pasti, orari, etichette e controlli. Barlow è la voce leggibile per il menù e le frasi. Le cifre sono tabellari in tutta l'app.

### Hierarchy
- **Display** (Rajdhani 700, 48px, interlinea 0.9, maiuscolo): il nome del pasto di adesso nel pannello, nell'accento. Uno per schermata.
- **Display chiusura** (Rajdhani 700, 40px, interlinea 1, maiuscolo): il titolo del pannello a giornata finita ("Giornata completa").
- **Headline** (Rajdhani 700, 26px, interlinea 1.1): il saluto del tema in testa a Oggi.
- **Orario** (Rajdhani 700, 22px, interlinea 1): l'orario nel pannello. Nel tabellone l'orario è Rajdhani 600 a 19px.
- **Title** (Rajdhani 700, 19px, maiuscolo, tracking 0.025em): il nome del pasto nelle righe del tabellone.
- **Body grande** (Barlow 400, 18px, interlinea 1.4): il menù del pasto di adesso, in testo pieno.
- **Body** (Barlow 400, 16-17px): frasi, voci di menu, consigli del mese.
- **Body piccolo** (Barlow 400, 14-15px): menù delle righe del tabellone (una riga, troncato), tag del tema, note.
- **Label** (Rajdhani 700, 13px, tracking 0.16em, maiuscolo): intestazioni di sezione, data e ora, testo dei pulsanti, contatori. Varianti osservate: 11px per le intestazioni di colonna del tabellone, 14px per la nav, 17px per la lastra "Fatto".

### Named Rules
**La Regola della Macchina e della Voce.** Rajdhani per ciò che si legge come strumento (nomi, orari, stati, comandi), Barlow per ciò che si legge come frase. Il menù di un pasto non va mai in Rajdhani.

**La Regola dell'Etichetta come Intestazione.** L'etichetta maiuscola è il titolo della sezione stessa ("La giornata", "Acqua"), mai un occhiello sopra un altro titolo.

## Layout

Colonna unica da telefono: larghezza massima 448px centrata, margini laterali 16px (20px da 640px in su), spazio in alto 24px e 112px in basso per la nav fissa. Le fasce a tutta larghezza (fascia illustrata, righello) escono dai margini con margine negativo.

Il ritmo verticale è stretto e regolare: 12px tra i blocchi principali, 16px prima del tabellone, 8px tra intestazione e contenuto di una sezione. Il pannello ha padding interno 12px × 16px.

Il tabellone è una griglia a tre colonne fisse (52px orario, flessibile pasto, 96px stato) con 12px di spazio tra le colonne; la stessa griglia regge l'intestazione ORA / PASTO / STATO. L'acqua è una griglia di segmenti uguali (uno per bicchiere da 250ml, 10 per 2,5L) con 4px di spazio.

Ogni area toccabile è alta almeno 44px; le azioni principali 48px. L'azione principale del pannello sta in basso a destra, nella zona del pollice.

## Elevation & Depth

Piatto per scelta. Nessuna `box-shadow` di profondità, nessun bagliore. La profondità viene dal tono (fondo → Lavagna Notte → Lavagna Alta) e dalle cornici da 1px. L'unica ombra nel codice è un filetto inset di 2px nell'accento sopra la voce di nav attiva: è un segno di stato, non un rilievo.

### Named Rules
**La Regola Senza Aloni.** Niente glow, niente aloni neon, niente veli a gradiente: il cyberpunk qui è geometria e contrasto, non luce diffusa.

## Shapes

Raggio zero ovunque. La forma distintiva è l'angolo tagliato a 45° ottenuto con `clip-path`: in basso a destra per il pannello del pasto (taglio 20px) e per la lastra "Fatto" (12px), in alto a sinistra per il pulsante profilo (10px). Una cornice su una forma tagliata non si fa con `border` (verrebbe mozzata): si disegna con due strati, quello esterno nel colore edge con 1px di padding e quello interno in superficie con un taglio di 19.6px, così il filetto segue anche la diagonale.

Le altre linee del mondo: filetti da 1px, il righello a tacche (filetto superiore più tacche verticali da 1px ogni 8px, alto 6px) che chiude la testata, le caselle quadrate da 12px negli stati non fatti, la spunta a tratto squadrato (`stroke-linecap: square`). Le icone sono SVG inline a tratto, squadrate.

### Named Rules
**La Regola del Taglio.** Gli angoli si tagliano, non si arrotondano. Il taglio va sull'elemento che porta l'azione o l'identità (pannello, lastra, profilo), non su ogni contenitore.

## Components

### Buttons
Comandi da terminale: piatti, a spigolo vivo, testo in etichetta maiuscola.
- **Forma:** raggio zero; la lastra principale ha l'angolo in basso a destra tagliato (12px).
- **Primario ("Fatto"):** lastra piena nell'accento, testo Nero Terminale, etichetta a 17px, alta 48px, padding orizzontale 28px. Uno per schermata.
- **A contorno ("Sostituisci", "Riprova"):** fondo trasparente, bordo 1px edge (o danger per "Riprova"), etichetta, alto 48px.
- **Hover / Active / Focus:** hover schiarisce (`brightness(1.1)`), pressione rimpicciolisce a 0.97 in 180ms; focus con contorno 2px nell'accento a 3px di distanza.

### Pannello del pasto di adesso (signature)
Il cuore della schermata. Cornice 1px edge su due strati tagliati (20px in basso a destra), interno Lavagna Notte. In alto il nome del pasto in Display nell'accento e, sulla stessa riga a destra, l'orario e lo stato ("Adesso" o "Prossimo") in etichetta nell'accento. Sotto il menù in Body grande, la sostituzione scelta (se c'è) nell'accento con l'icona di scambio, poi la riga d'azione: "Sostituisci" a contorno a sinistra, "Fatto" a destra. A giornata finita il pannello diventa la chiusura ("Giornata completa" / "Per oggi è tutto") con l'anteprima della colazione di domani sotto un filetto.

**Ingresso a glitch.** Quando il pasto di adesso cambia (dopo una spunta), il pannello entra con un glitch a fette: 300ms, `steps(5, end)`, `clip-path: inset()` che scopre fasce orizzontali, scarti laterali di pochi pixel e un lampo di luminosità. Mai all'apertura dell'app, mai su altri elementi; spento con `prefers-reduced-motion`.

### Tabellone (signature)
La giornata come un tabellone delle partenze. Intestazione di sezione in etichetta con contatore "oggi · sett.", poi le colonne ORA / PASTO / STATO in etichetta da 11px. Ogni riga: orario in Rajdhani, nome del pasto in Title maiuscolo con il menù sotto in Body piccolo su una riga, e nella colonna Stato una parola che è anche il tasto da 44px per segnare il pasto.
- **Stati:** FATTO (pieno ciano, spunta, testo scuro; riga in muted), ADESSO e PROSSIMO (contorno e testo nell'accento, casella quadrata), DOPO e APERTO (contorno edge, testo chiaro). APERTO è un pasto passato non segnato: nessun colore di colpa.
- **Riga a fuoco:** fondo Lavagna Notte e contorno 1px nell'accento; orario nell'accento; il menù non si ripete (sta nel pannello).
- **Righe normali:** divise da filetti in line.

### Acqua
Riga di segmenti rettangolari alti 44px, uno per bicchiere. Spento: Lavagna Notte con bordo edge. Acceso: pieno ciano. Il contatore in litri sta a destra dell'intestazione, in etichetta ciano. Toccare l'ultimo segmento acceso lo spegne.

### Fascia illustrata (signature)
Fascia alta 72px a tutta larghezza sotto la testata, chiusa dal righello. L'illustrazione del tema è sempre intera a 216×72 (rapporto 3:1), centrata e appoggiata in basso, con opacità 0.8. Un filtro SVG in bicromia (scala di grigi, poi `feComponentTransfer`) porta ombre e toni medi al colore di fondo e solo le luci all'accento del tema: l'illustrazione diventa una sagoma luminosa dentro il fondo, senza riquadro.

### Lista dei consigli (Settimana)
Righe a tutta larghezza alte almeno 48px, divise da filetti, con una casella quadrata da 24px: contorno edge se aperta, piena ciano con spunta se fatta. Intestazione in etichetta muted con filetto sotto.

### Navigation
Barra fissa in basso su Fondo Nav, filetto superiore in line, quattro voci solo testuali in etichetta da 14px (Oggi, Settimana, Spesa, Progressi), alte 48px, rispetta la safe area. Inattiva in muted; attiva nell'accento con un filetto di 2px nell'accento sul bordo superiore. Alla pressione la voce rimpicciolisce a 0.96.

### Menu del profilo
Il pulsante profilo è un quadrato da 44px su Lavagna Alta con l'angolo in alto a sinistra tagliato e le iniziali in Rajdhani. Il menu si apre sotto la testata: Lavagna Notte, bordo 1px edge, voci di testo alte 48px, un filetto prima di "Esci" (in rosso).

### Selettore dei giorni (Settimana)
Sette schede a colonne uguali, alte almeno 64px: giorno abbreviato in etichetta da 11px ("Oggi" al posto del giorno corrente), numero del giorno in Rajdhani 22px e, per i giorni già iniziati, quattro quadratini da 6px (uno per pasto: pieno ciano se fatto, contorno edge se no). Scheda attiva: Lavagna Notte, testo e filetto superiore da 2px nell'accento; le altre hanno solo un filetto inferiore in line. Frecce sinistra/destra, Home e Fine spostano la scheda.

### Diario del giorno (Settimana)
Lo stesso tabellone di Oggi in sola lettura. Giorni futuri: colonne ORA / PASTO con il menù intero (si legge per organizzarsi). Giorni passati e oggi: anche la colonna STATO con un'etichetta non toccabile (FATTO pieno ciano; ADESSO, DOPO, APERTO col filetto in line), il riepilogo "n/4 fatti" accanto al titolo del giorno e i litri d'acqua in ciano. Una sostituzione registrata mostra il pasto scelto con l'icona di scambio e il menù originale barrato in muted.

### Lista della spesa (Spesa)
Gruppi con intestazione in etichetta e contatore "presi/totale" (ciano quando il gruppo è completo). Ogni voce è una riga toccabile alta almeno 56px: casella quadrata da 24px (contorno edge, piena ciano con spunta se presa), nome in Barlow 16px con il motivo sotto in muted, quantità in Rajdhani 19px a destra; una voce presa passa in muted e barrata. In testa un contatore "n di N presi" in ciano e una barra a segmenti, uno per voce, nello stesso ordine della lista.

### Annulla temporaneo
Le azioni che cancellano in blocco (es. "Azzera" la spesa) agiscono subito e mostrano per 6 secondi una barra sopra la nav: Lavagna Alta, bordo edge, testo dell'esito e "Annulla" in etichetta nell'accento. Niente finestre di conferma.

### In sospeso
Progressi, i fogli secondari (gestione del piano, promemoria, sostituzioni, revisione) e i campi di inserimento usano ancora le forme del vecchio sistema (arrotondate) e verranno portati in questo mondo più avanti. Le illustrazioni dei 16 temi verranno ridisegnate in stile cyberpunk; la bicromia è la soluzione nel frattempo. Nessuna di queste forme vecchie è parte del sistema.

## Do's and Don'ts

### Do:
- **Do** usa l'accento solo per il pasto di adesso, l'azione principale e la voce di nav attiva.
- **Do** usa il ciano (#04DAF6) solo per "fatto" e per l'acqua, e il rosso (#FF4D5E) solo per errori e "Esci".
- **Do** dai a ogni controllo un bordo da 1px in edge (#5E7180), che tiene almeno 3:1; i filetti in line servono solo a separare.
- **Do** taglia gli angoli a 45° con `clip-path` (20px il pannello, 12px la lastra, 10px il profilo) e disegna la cornice di una forma tagliata con due strati.
- **Do** scrivi nomi, orari, stati e comandi in Rajdhani maiuscolo; menù e frasi in Barlow.
- **Do** tieni ogni area toccabile ad almeno 44px e l'azione principale in basso a destra.
- **Do** cambia solo l'accento, il saluto e la fascia illustrata da un tema all'altro; i neutri restano condivisi.
- **Do** mostra l'illustrazione del tema sempre intera (216×72) e in bicromia fondo/accento.
- **Do** limita il glitch (300ms, steps(5)) al cambio del pasto di adesso.

### Don't:
- **Don't** usare veli a gradiente sulle superfici o sulla fascia illustrata.
- **Don't** usare bagliori, aloni neon o ombre di profondità.
- **Don't** usare bordi sinistri colorati come accento su righe o card.
- **Don't** mettere etichette-kicker sopra i titoli: l'etichetta maiuscola è il titolo.
- **Don't** usare il ciano fuori da "fatto" e acqua.
- **Don't** arrotondare gli angoli nelle superfici nuove.
- **Don't** introdurre un tema chiaro: il mondo è sempre scuro.
- **Don't** marcare i pasti saltati con colori di colpa: restano in tono neutro come APERTO.
