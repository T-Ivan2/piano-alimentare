/**
 * Piano Alimentare · import automatico dalle mail di Carlotta
 *
 * Gira sul tuo account Google (script.google.com), ogni ora:
 * cerca le mail con etichetta "Piano Carlotta" e un PDF allegato non ancora importate,
 * manda il PDF all'app e mette l'etichetta "Piano importato".
 *
 * Impostazione (una volta sola):
 * 1. Incolla questo file in un nuovo progetto su script.google.com
 * 2. Impostazioni progetto (ingranaggio) → Proprietà script → aggiungi IMPORT_SECRET con il valore ricevuto
 * 3. Esegui "configura" una volta e accetta i permessi: crea le etichette e il controllo orario
 */

const APP_URL = 'https://pianoalimentareivan.netlify.app/.netlify/functions/importa-piano-background';
const LABEL_IN = 'Piano Carlotta';
const LABEL_DONE = 'Piano importato';

function configura() {
  GmailApp.getUserLabelByName(LABEL_IN) || GmailApp.createLabel(LABEL_IN);
  GmailApp.getUserLabelByName(LABEL_DONE) || GmailApp.createLabel(LABEL_DONE);
  ScriptApp.getProjectTriggers().forEach((t) => {
    if (t.getHandlerFunction() === 'importaPiani') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('importaPiani').timeBased().everyHours(1).create();
  importaPiani();
}

function importaPiani() {
  const secret = PropertiesService.getScriptProperties().getProperty('IMPORT_SECRET');
  if (!secret) throw new Error('Manca la proprietà IMPORT_SECRET nelle impostazioni del progetto');
  const done = GmailApp.getUserLabelByName(LABEL_DONE) || GmailApp.createLabel(LABEL_DONE);
  const threads = GmailApp.search(`label:"${LABEL_IN}" -label:"${LABEL_DONE}" has:attachment filename:pdf newer_than:60d`);

  threads.forEach((thread) => {
    let sentAll = true;
    thread.getMessages().forEach((msg) => {
      msg.getAttachments({ includeInlineImages: false }).forEach((att, i) => {
        if (!/\.pdf$/i.test(att.getName()) && att.getContentType() !== 'application/pdf') return;
        const res = UrlFetchApp.fetch(APP_URL, {
          method: 'post',
          contentType: 'application/json',
          headers: { 'x-import-secret': secret },
          payload: JSON.stringify({
            pdf_base64: Utilities.base64Encode(att.getBytes()),
            filename: att.getName(),
            ref: `${msg.getId()}-${i}`,
          }),
          muteHttpExceptions: true,
        });
        const code = res.getResponseCode();
        console.log(`${att.getName()}: ${code}`);
        if (code >= 300) sentAll = false;
      });
    });
    if (sentAll) thread.addLabel(done);
  });
}
