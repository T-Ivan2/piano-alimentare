// Copia locale di piano e diario: senza rete l'app mostra l'ultima versione letta invece di una pagina vuota
export function readCache(key) {
  try { return JSON.parse(localStorage.getItem(`piano:${key}`)); } catch { return null; }
}

export function writeCache(key, value) {
  try { localStorage.setItem(`piano:${key}`, JSON.stringify(value)); } catch { /* memoria piena o bloccata: si va avanti senza */ }
}
