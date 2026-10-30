/* AntoniSofron — konfiguracja wspólna dla wszystkich podstron.
   Wypełnij tylko dane, które mają być publiczne. */
const SITE_CONFIG = {
  email: 'antonisofron@gmail.com',
  github: '',
  orcid: '',
  googleScholar: '',
  linkedin: '',
  tiktok: 'https://www.tiktok.com/@sofroniki_po_koreansku',
  instagram: 'https://www.instagram.com/sofroniki_po_koreansku/',
  youtube: ''
};

/* Na razie wybór języka jest zablokowany na polskim.
   Aby w przyszłości odblokować przełącznik, dodaj komplet tłumaczeń
   wszystkich kluczy ze zbioru REQUIRED_TRANSLATION_KEYS. */
const TRANSLATIONS = {
  // en: { skip: 'Skip to content', navBio: 'Biography', ... }
};
const REQUIRED_TRANSLATION_KEYS = [
  "backTop",
  "bioChapter1Text",
  "bioChapter2Text",
  "bioChapter3Text",
  "bioChapter4Text",
  "bioChapter5Text",
  "bioChapter6Text",
  "contactDesc",
  "contactHeading",
  "contactSoon",
  "goChannel",
  "goProfile",
  "heroBio",
  "heroDesc",
  "heroKicker",
  "heroProjects",
  "linkSoon",
  "manifesto",
  "mediaHeading",
  "mediaInstagram",
  "mediaIntro",
  "mediaTiktok",
  "mediaYoutube",
  "navBio",
  "navContact",
  "navMedia",
  "navProjects",
  "navPublications",
  "newProjectDesc",
  "newProjectHeading",
  "newProjectNote",
  "openProject",
  "pageIntroKontakt",
  "pageIntroMedia",
  "pageIntroProjekty",
  "pageIntroPublikacje",
  "pageKickerKontakt",
  "pageKickerMedia",
  "pageKickerProjekty",
  "pageKickerPublikacje",
  "pageTitleKontakt",
  "pageTitleMedia",
  "pageTitleProjekty",
  "pageTitlePublikacje",
  "project1Desc",
  "project1Type",
  "project2Desc",
  "project2Type",
  "project3Desc",
  "project3Title",
  "project3Type",
  "projectsHeading",
  "projectsIntro",
  "pubHeading",
  "pubIntro",
  "pubNote",
  "pubSoon",
  "pubState",
  "skip",
  "writeToMe"
];
const LANGUAGE_LABELS = {pl:'PL',en:'EN',ko:'KO',ru:'RU',cs:'CS'};
const fields = [...document.querySelectorAll('[data-i18n], [data-i18n-html]')];
const originalPolish = new Map(fields.map(el => [el, el.hasAttribute('data-i18n-html') ? el.innerHTML : el.textContent]));
const publishedLanguages = ['pl', ...Object.keys(TRANSLATIONS).filter(code =>
  TRANSLATIONS[code] && REQUIRED_TRANSLATION_KEYS.every(k =>
    typeof TRANSLATIONS[code][k] === 'string' && TRANSLATIONS[code][k].trim().length > 0))];
const languageButton = document.getElementById('language-toggle');
let activeLanguageIndex = 0;
try {
  const saved = localStorage.getItem('antonisofron-language');
  if (publishedLanguages.includes(saved)) activeLanguageIndex = publishedLanguages.indexOf(saved);
} catch (_) { /* brak dostępu do pamięci przeglądarki */ }
function updateLanguage() {
  if (!languageButton) return;
  const code = publishedLanguages[activeLanguageIndex];
  for (const el of fields) {
    const key = el.dataset.i18n || el.dataset.i18nHtml;
    const value = code === 'pl' ? originalPolish.get(el) : TRANSLATIONS[code][key];
    if (el.hasAttribute('data-i18n-html')) el.innerHTML = value;
    else el.textContent = value;
  }
  document.documentElement.lang = code;
  languageButton.querySelector('span:first-child').textContent = LANGUAGE_LABELS[code] || code.toUpperCase();
  languageButton.disabled = publishedLanguages.length === 1;
  languageButton.querySelector('.lang-lock').hidden = !languageButton.disabled;
  languageButton.setAttribute('aria-label', languageButton.disabled
    ? 'Dostępny język: polski. Inne wersje językowe nie są jeszcze dostępne.'
    : 'Zmień język. Obecnie: ' + (LANGUAGE_LABELS[code] || code.toUpperCase()));
  languageButton.title = languageButton.disabled ? 'Język polski — inne wersje w przygotowaniu' : 'Zmień język';
}
languageButton?.addEventListener('click', () => {
  activeLanguageIndex = (activeLanguageIndex + 1) % publishedLanguages.length;
  try { localStorage.setItem('antonisofron-language', publishedLanguages[activeLanguageIndex]); } catch (_) {}
  updateLanguage();
});
updateLanguage();

function safeUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return '';
  try { const url = new URL(value.trim()); return ['https:', 'http:'].includes(url.protocol) ? url.href : ''; }
  catch (_) { return ''; }
}
function setLink(id, candidate, statusId) {
  const href = safeUrl(candidate);
  const anchor = document.getElementById(id);
  if (!href || !anchor) return;
  anchor.href = href;
  anchor.hidden = false;
  const status = document.getElementById(statusId);
  if (status) status.hidden = true;
}
// Linki pięciu projektów są przypisane bezpośrednio w projekty/index.html.
for (const platform of ['tiktok', 'instagram', 'youtube'])
  setLink('link-' + platform, SITE_CONFIG[platform], 'status-' + platform);
const social = document.getElementById('social-links');
if (social) for (const [title, key] of [['GitHub','github'],['ORCID','orcid'],['Google Scholar','googleScholar'],['LinkedIn','linkedin']]) {
  const href = safeUrl(SITE_CONFIG[key]);
  if (!href) continue;
  const a = document.createElement('a');
  a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = title;
  social.append(a);
}
const email = (SITE_CONFIG.email || '').trim();
const emailLink = document.getElementById('email-link');
if (emailLink && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  emailLink.href = 'mailto:' + email;
  emailLink.hidden = false;
}
const contactPlaceholder = document.getElementById('contact-placeholder');
if (contactPlaceholder && ((social && social.children.length > 0) || (emailLink && !emailLink.hidden)))
  contactPlaceholder.hidden = true;
document.querySelectorAll('#year').forEach(el => {el.textContent = String(new Date().getFullYear());});

// Mobilna nawigacja po podstronach.
const menuButton = document.getElementById('menu-toggle');
const nav = document.getElementById('main-navigation');
function closeMenu() {
  if (!menuButton || !nav) return;
  nav.classList.remove('is-open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Otwórz menu');
  menuButton.querySelector('span').textContent = '☰';
}
if (menuButton && nav) {
  menuButton.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Zamknij menu' : 'Otwórz menu');
    menuButton.querySelector('span').textContent = open ? '×' : '☰';
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
}

// Stare adresy z kotwicami działają po zmianie z jednej strony na pięć.
if (document.body.dataset.page === 'biografia') {
  const oldAnchors = {'#projekty':'projekty/','#publikacje':'publikacje/','#media':'media/','#kontakt':'kontakt/'};
  const destination = oldAnchors[window.location.hash.toLowerCase()];
  if (destination) window.location.replace(new URL(destination, document.baseURI).href);
}


// Kopiowanie poprawnego opisu bibliograficznego w formie tekstowej.
const apaCopy = document.getElementById('apa-copy-first');
if (apaCopy) apaCopy.addEventListener('click', async () => {
  const value = apaCopy.getAttribute('data-copy-citation');
  const label = apaCopy.querySelector('.apa-copy-label');
  const oldText = label.textContent;
  try {
    const citation = document.querySelector('.apa-citation');
    if (citation && navigator.clipboard.write && typeof ClipboardItem !== 'undefined') {
      const rich = '<p>' + citation.innerHTML + '</p>';
      await navigator.clipboard.write([new ClipboardItem({
        'text/html': new Blob([rich], {type:'text/html'}),
        'text/plain': new Blob([value], {type:'text/plain'})
      })]);
    } else {
      await navigator.clipboard.writeText(value);
    }
    label.textContent = 'Skopiowano';
    apaCopy.setAttribute('aria-label','Cytowanie skopiowane');
    window.setTimeout(() => {
      label.textContent = oldText;
      apaCopy.setAttribute('aria-label','Skopiuj cytowanie APA do schowka');
    },2000);
  } catch (_) {
    label.textContent = 'Zaznacz i skopiuj cytat';
    const p = document.querySelector('.apa-citation');
    if (p && window.getSelection) {
      const range = document.createRange();
      range.selectNodeContents(p);
      const selection = window.getSelection();
      selection.removeAllRanges(); selection.addRange(range);
    }
  }
});
