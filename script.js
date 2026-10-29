/* ====================================================================
   PERSONALIZACJA — wpisz adresy w cudzysłowie poniżej.
   Puste pola nie tworzą martwych linków na stronie.
   Nie wpisuj tu prywatnych danych, których nie chcesz publikować.
   ==================================================================== */
const SITE_CONFIG = {
  email: '',               // np. 'kontakt@twojadomena.pl'
  github: '',              // np. 'https://github.com/twoj-login'
  orcid: '',               // np. 'https://orcid.org/0000-0000-0000-0000'
  googleScholar: '',       // pełny URL profilu
  linkedin: '',            // pełny URL profilu
  researchGate: '',        // pełny URL profilu
  project1: '',            // pełny URL projektu badawczego
  project2: '',            // pełny URL opisu pracy magisterskiej
  project3: ''             // pełny URL tekstu (dopiero po publikacji)
};

/* Wersja polska jest w index.html; poniżej wersja angielska. */
const EN = {
  skip: 'Skip to content',
  navAbout: 'About', navResearch: 'Research', navProjects: 'Projects', navExperience: 'Experience', navContact: 'Contact',
  heroKicker: 'INDEPENDENT RESEARCHER · EDUCATOR',
  heroTitle: 'Between <em>language</em><br>and its <em>use.</em>',
  heroDesc: 'I am Marta Anna Sofron. I explore how people learn languages and use them beyond the textbook. My work bridges linguistics and more than a decade of teaching experience.',
  heroProjects: 'Explore my projects', heroAbout: 'More about me',
  manifesto: 'Language does not end in the classroom. It comes alive wherever it meets people.',
  secOneTag: 'ABOUT', aboutHeading: 'Linguistics from a <em>human perspective.</em>', aboutKicker: 'A LITTLE ABOUT ME',
  aboutLead: 'I hold an MA in English Philology and work as an English teacher and independent researcher, connecting language theory with everyday educational practice.',
  aboutText1: 'I completed my master’s degree at Jagiellonian University in 2023, specialising in linguistics. My research interests include second language acquisition, cross-linguistic influence, multilingualism and English learning outside formal education.',
  aboutText2: 'I look for research questions that matter to teachers as well as language learners. I am particularly interested in the relationship between language experience, cultural environments and actual communicative choices.',
  factDegreeLabel: 'Education', factDegree: 'MA English Philology · JU, 2023', factWorkLabel: 'Practice', factWork: '10+ years of teaching', factFocusLabel: 'Focus',
  secTwoTag: 'RESEARCH', researchHeading: 'Questions I <em>keep asking.</em>', researchIntro: 'My work spans applied linguistics, psycholinguistics and language education.',
  research1: 'English beyond school: media, books, digital spaces, entertainment and the language practices of young people.',
  research2: 'How previously acquired languages affect English use — from grammatical choices to language transfer.',
  research3: 'How cultural content, texts and media shape language learning, interpretation and communication.',
  secThreeTag: 'PROJECTS', projectsHeading: 'Work, ideas, <em>explorations.</em>', projectsIntro: 'Selected research projects and concepts. Over time, this space will include links to publications, materials and repositories.',
  project1Type: 'ONGOING RESEARCH', project1Desc: 'A research project examining how Polish upper-secondary students engage with English outside formal education — from digital content to self-directed language practices.',
  project2Type: 'ACADEMIC RESEARCH', project2Desc: 'A study of cross-linguistic influence on English preposition use among EFL learners from different linguistic backgrounds. The topic of my MA thesis.',
  project3Type: 'ARTICLE CONCEPT', project3Desc: 'An article concept about popular culture, critical interpretation and the role of cultural content in English language education.',
  projectLink: 'Open project', projectStatus1: 'Details coming soon', projectStatus2: 'Research overview', projectStatus3: 'In preparation',
  addProjectTitle: 'Room for what comes next', addProjectDesc: 'Publications, teaching resources, repositories, field notes — and anything else worth sharing.', addProjectNote: 'This space can grow with new projects.',
  secFourTag: 'EXPERIENCE', experienceHeading: 'Where research <em>meets practice.</em>', experienceQuote: 'The most interesting research questions often begin with something happening in an ordinary classroom.',
  timeline1Date: 'CURRENT', timeline1Title: 'Independent linguistic research', timeline1Desc: 'Projects in applied linguistics, language acquisition and everyday encounters with English.',
  timeline2Date: '10+ YEARS', timeline2Title: 'English language teaching', timeline2Desc: 'Teaching, exam preparation and supporting language competence development.',
  timeline3Title: 'MA in English Philology', timeline3Desc: 'Jagiellonian University · linguistics specialisation · research on cross-linguistic influence.',
  timeline4Title: 'Academic presentation topics', timeline4Desc: '“Między systemami językowymi…” and “Beyond one-size-fits-all language education…” — selected topics in linguistics and education.',
  secFiveTag: 'CONTACT', contactHeading: 'Let’s talk <em>language.</em>', contactDesc: 'About research, collaboration, education and ideas that connect these worlds. I welcome fresh perspectives.',
  contactEmail: 'Get in touch', contactPlaceholder: 'Contact details to be added before publication', footerTagline: 'RESEARCH · LANGUAGE · EDUCATION', backTop: '↑ Back to top'
};

const plText = new Map();
const translatableNodes = [...document.querySelectorAll('[data-i18n], [data-i18n-html]')];
for (const el of translatableNodes) plText.set(el, el.hasAttribute('data-i18n-html') ? el.innerHTML : el.textContent);
let currentLanguage = 'pl';

function setLanguage(language) {
  currentLanguage = language;
  for (const el of translatableNodes) {
    const key = el.dataset.i18n || el.dataset.i18nHtml;
    const value = language === 'en' ? EN[key] : plText.get(el);
    if (typeof value !== 'string') continue;
    if (el.hasAttribute('data-i18n-html')) el.innerHTML = value; // Local, fixed translation strings only.
    else el.textContent = value;
  }
  document.documentElement.lang = language;
  const langButton = document.querySelector('#language-toggle');
  langButton.textContent = language === 'pl' ? 'EN' : 'PL';
  langButton.setAttribute('aria-label', language === 'pl' ? 'Switch language to English' : 'Zmień język na polski');
  document.title = 'Marta Anna Sofron | Research & Language Education';
  try { localStorage.setItem('portfolio-language', language); } catch (_) {}
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const button = document.getElementById('theme-toggle');
  const dark = theme === 'dark';
  button.querySelector('.theme-icon').textContent = dark ? '☼' : '☾';
  button.setAttribute('aria-label', dark ? 'Włącz jasny motyw / Switch to light mode' : 'Włącz ciemny motyw / Switch to dark mode');
  try { localStorage.setItem('portfolio-theme', theme); } catch (_) {}
}

function safeUrl(raw) {
  if (!raw || typeof raw !== 'string') return '';
  try { const u = new URL(raw.trim()); return ['https:', 'http:'].includes(u.protocol) ? u.href : ''; }
  catch (_) { return ''; }
}

function initLinks() {
  const social = document.getElementById('social-links');
  const socialEntries = [
    ['GitHub', SITE_CONFIG.github], ['ORCID', SITE_CONFIG.orcid],
    ['Google Scholar', SITE_CONFIG.googleScholar], ['LinkedIn', SITE_CONFIG.linkedin],
    ['ResearchGate', SITE_CONFIG.researchGate]
  ];
  for (const [label, candidate] of socialEntries) {
    const url = safeUrl(candidate);
    if (!url) continue;
    const a = document.createElement('a');
    a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = label;
    social.append(a);
  }
  const email = SITE_CONFIG.email.trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const emailLink = document.getElementById('email-link');
    emailLink.href = 'mailto:' + encodeURIComponent(email);
    emailLink.hidden = false;
  }
  if (social.children.length || !document.getElementById('email-link').hidden) document.getElementById('contact-placeholder').hidden = true;
  for (let n = 1; n <= 3; n++) {
    const url = safeUrl(SITE_CONFIG['project' + n]);
    if (!url) continue;
    const link = document.getElementById('link-project-' + n);
    link.href = url; link.hidden = false;
    document.getElementById('status-project-' + n).hidden = true;
  }
}

const langButton = document.getElementById('language-toggle');
langButton.addEventListener('click', () => setLanguage(currentLanguage === 'pl' ? 'en' : 'pl'));
document.getElementById('theme-toggle').addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
document.getElementById('year').textContent = new Date().getFullYear().toString();
initLinks();
let savedTheme = 'light', savedLanguage = 'pl';
try { savedTheme = localStorage.getItem('portfolio-theme') || 'light'; savedLanguage = localStorage.getItem('portfolio-language') || 'pl'; } catch (_) {}
setTheme(savedTheme === 'dark' ? 'dark' : 'light');
setLanguage(savedLanguage === 'en' ? 'en' : 'pl');
