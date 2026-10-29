/* ====================================================================
   ANTONISOFRON — KONFIGURACJA LINKÓW
   Wpisz prawdziwe adresy. Puste wartości ukrywają nieaktywne odsyłacze.
   Nie publikuj prywatnych informacji bez potrzeby.
   ==================================================================== */
const SITE_CONFIG = {
  email: '',
  github: '',
  orcid: '',
  googleScholar: '',
  linkedin: '',
  project1: '', // Dictionarium
  project2: 'https://www.tiktok.com/@sofroniki_po_koreansku', // Sofroniki po koreańsku
  project3: '', // Etymologie i rekonstrukcje
  tiktok: 'https://www.tiktok.com/@sofroniki_po_koreansku',
  instagram: 'https://www.instagram.com/sofroniki_po_koreansku/',
  youtube: ''  // link do własnego kanału, kiedy będzie znany
};

/* ====================================================================
   JĘZYKI
   Na razie jedynym językiem jest polski, więc przycisk „PL” pozostaje
   wyłączony. Gdy dodasz KOMPLETNE tłumaczenie, np. en: { ... }, przycisk
   automatycznie się odblokuje. Klucze odpowiadają data-i18n i
   data-i18n-html w index.html (można zacząć od ich skopiowania).
   Nie dodawaj tu języka bez pełnego zestawu przekładów.
   ==================================================================== */
const TRANSLATIONS = {
  // en: { skip: 'Skip to content', navBio: 'Biography', ... }
};
const LANGUAGE_LABELS = { pl: 'PL', en: 'EN', ko: 'KO', ru: 'RU', cs: 'CS' };
const fields = [...document.querySelectorAll('[data-i18n], [data-i18n-html]')];
const originalPolish = new Map(fields.map(el => [el, el.hasAttribute('data-i18n-html') ? el.innerHTML : el.textContent]));
const translationKeys = [...new Set(fields.map(el => el.dataset.i18n || el.dataset.i18nHtml))];
const publishedLanguages = ['pl', ...Object.keys(TRANSLATIONS).filter(code =>
  TRANSLATIONS[code] && translationKeys.every(key => typeof TRANSLATIONS[code][key] === 'string')
)];
const languageButton = document.getElementById('language-toggle');
let activeLanguageIndex = 0;

function updateLanguage() {
  const code = publishedLanguages[activeLanguageIndex];
  for (const el of fields) {
    const key = el.dataset.i18n || el.dataset.i18nHtml;
    const value = code === 'pl' ? originalPolish.get(el) : TRANSLATIONS[code][key];
    if (el.hasAttribute('data-i18n-html')) el.innerHTML = value; // Wpisywane wyłącznie ręcznie, zaufane tłumaczenia
    else el.textContent = value;
  }
  document.documentElement.lang = code;
  languageButton.querySelector('span:first-child').textContent = LANGUAGE_LABELS[code] || code.toUpperCase();
  languageButton.disabled = publishedLanguages.length === 1;
  languageButton.querySelector('.lang-lock').hidden = !languageButton.disabled;
  languageButton.setAttribute('aria-label', languageButton.disabled
    ? 'Dostępny język: polski. Inne wersje językowe nie są jeszcze dostępne.'
    : 'Wybierz język. Obecnie: ' + (LANGUAGE_LABELS[code] || code.toUpperCase()));
  languageButton.title = languageButton.disabled ? 'Język polski — inne wersje w przygotowaniu' : 'Zmień język';
}
languageButton.addEventListener('click', () => {
  activeLanguageIndex = (activeLanguageIndex + 1) % publishedLanguages.length;
  updateLanguage();
});
updateLanguage();

function safeUrl(value) {
  if (!value || typeof value !== 'string') return '';
  try {
    const url = new URL(value.trim());
    return ['https:', 'http:'].includes(url.protocol) ? url.href : '';
  } catch (_) { return ''; }
}
function setLink(id, candidate, statusId) {
  const href = safeUrl(candidate);
  if (!href) return;
  const anchor = document.getElementById(id);
  if (!anchor) return;
  anchor.href = href;
  anchor.hidden = false;
  const status = document.getElementById(statusId);
  if (status) status.hidden = true;
}
for (let i = 1; i <= 3; i++) {
  setLink('link-project-' + i, SITE_CONFIG['project' + i], 'status-project-' + i);
}
for (const platform of ['tiktok', 'instagram', 'youtube']) {
  setLink('link-' + platform, SITE_CONFIG[platform], 'status-' + platform);
}
const social = document.getElementById('social-links');
for (const [title, key] of [['GitHub','github'],['ORCID','orcid'],['Google Scholar','googleScholar'],['LinkedIn','linkedin']]) {
  const href = safeUrl(SITE_CONFIG[key]);
  if (!href) continue;
  const a = document.createElement('a');
  a.href = href;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.textContent = title;
  social.append(a);
}
const email = (SITE_CONFIG.email || '').trim();
if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  const emailLink = document.getElementById('email-link');
  emailLink.href = 'mailto:' + email;
  emailLink.hidden = false;
}
if (social.children.length || !document.getElementById('email-link').hidden) {
  document.getElementById('contact-placeholder').hidden = true;
}
document.getElementById('year').textContent = String(new Date().getFullYear());

// Menu mobilne: wszystkie pięć pozycji jest dostępnych również na telefonie.
const menuButton = document.getElementById('menu-toggle');
const nav = document.getElementById('main-navigation');
function closeMenu() {
  nav.classList.remove('is-open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Otwórz menu');
  menuButton.querySelector('span').textContent = '☰';
}
menuButton.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('is-open');
  menuButton.setAttribute('aria-expanded', String(isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Zamknij menu' : 'Otwórz menu');
  menuButton.querySelector('span').textContent = isOpen ? '×' : '☰';
});
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
