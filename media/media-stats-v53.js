/* Media — liczniki uczestników / obserwujących z GitHub Actions. */
(() => {
  const elements = [...document.querySelectorAll('[data-media-stat]')];
  if (!elements.length) return;
  const nf = new Intl.NumberFormat('pl-PL', { useGrouping:true });
  async function refresh() {
    try {
      const response = await fetch('../stats/media.json?nocache=' + Date.now(), {cache:'no-store'});
      if (!response.ok) return;
      const data = await response.json();
      for (const el of elements) {
        const id = el.getAttribute('data-media-stat');
        const rec = data && data.profiles && data.profiles[id];
        const value = rec && rec.value;
        const count = el.querySelector('.media-live-count');
        if (!count) continue;
        const valid = Number.isSafeInteger(value) && value >= 0;
        const checked = rec && Date.parse(rec.checked_at || '');
        const old = !Number.isFinite(checked) || Date.now() - checked > 48*60*60*1000;
        if (!valid || old) {
          count.textContent = '—';
          el.title = 'Aktualna liczba niedostępna. Źródło nie udostępniło ostatnio danych.';
          el.setAttribute('aria-label', 'Aktualna liczba obserwujących lub uczestników jest niedostępna');
          continue;
        }
        count.textContent = (rec.approximate ? '≈ ' : '') + nf.format(value);
        const unit = el.querySelector('.media-live-unit')?.textContent || 'obserwujących';
        const date = new Date(checked).toLocaleString('pl-PL', {dateStyle:'short',timeStyle:'short'});
        el.setAttribute('aria-label', (rec.approximate ? 'Około ' : '') + nf.format(value) + ' ' + unit);
        el.title = (rec.approximate ? 'Liczba przybliżona' : 'Liczba') + ' · ' + (rec.source || 'platforma') + ' · aktualizacja: ' + date;
      }
    } catch (_e) {
      // Nie nadpisuj sprawdzonych danych, jeżeli chwilowo brak dostępu do sieci.
    }
  }
  refresh();
  setInterval(refresh, 60000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refresh();
  });
})();
