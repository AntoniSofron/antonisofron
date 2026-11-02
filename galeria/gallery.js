/* AntoniSofron — Galeria: albumy z galeria/albums.json.
 * Dodawanie albumów nie wymaga zmian w JS ani CSS.
 * Format: {"albums":[{"id":"nazwa","title":"Album","description":"Opis",
 *   "photos":[{"src":"zdjecia/nazwa/01.jpg","alt":"Opis zdjęcia","caption":"Podpis"}]}]}
 */
(() => {
  'use strict';

  const grid = document.getElementById('gallery-albums');
  const viewer = document.getElementById('gallery-viewer');
  if (!grid || !viewer) return;

  const mainImage = document.getElementById('gallery-main-image');
  const fallback = document.getElementById('gallery-photo-error');
  const albumTitle = document.getElementById('gallery-viewer-title');
  const photoCaption = document.getElementById('gallery-photo-caption');
  const photoCount = document.getElementById('gallery-photo-count');
  const thumbs = document.getElementById('gallery-thumbnails');
  const closeButton = document.getElementById('gallery-close');
  const prevButton = document.getElementById('gallery-prev');
  const nextButton = document.getElementById('gallery-next');
  const stage = document.getElementById('gallery-stage');

  const nf = new Intl.NumberFormat('pl-PL', {useGrouping: true});
  const folderIcon = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M5 13h15l5 6h18v19H5zM5 19V11h16l5 8"/></svg>';
  let activeAlbum = null;
  let activeIndex = 0;
  let buttons = [];
  let focusBefore = null;
  let touchX = null;
  let touchY = null;

  function imageUrl(candidate) {
    if (typeof candidate !== 'string' || !candidate.trim()) return null;
    try {
      const u = new URL(candidate.trim(), document.baseURI);
      // Galerie są publikowane z repozytorium tej strony; bez skryptów i zewnętrznego hotlinkingu.
      return u.origin === location.origin && /^https?:$/.test(u.protocol) ? u.href : null;
    } catch (_) {
      return null;
    }
  }

  function cleanAlbum(data, i) {
    if (!data || typeof data !== 'object' || !Array.isArray(data.photos)) return null;
    const photos = data.photos.map((photo, n) => {
      if (!photo || typeof photo !== 'object') return null;
      const src = imageUrl(photo.src);
      if (!src) return null;
      return {
        src,
        thumb: imageUrl(photo.thumb) || src,
        alt: typeof photo.alt === 'string' ? photo.alt : '',
        caption: typeof photo.caption === 'string' ? photo.caption : ''
      };
    }).filter(Boolean);
    if (!photos.length) return null;
    return {
      id: typeof data.id === 'string' && data.id.trim() ? data.id : String(i + 1),
      title: typeof data.title === 'string' && data.title.trim() ? data.title.trim() : 'Album bez tytułu',
      description: typeof data.description === 'string' ? data.description : '',
      cover: imageUrl(data.cover) || photos[0].thumb,
      photos
    };
  }

  function make(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (typeof text === 'string') el.textContent = text;
    return el;
  }

  function showEmpty(isFailure) {
    grid.replaceChildren();
    const empty = make('div', 'gallery-empty');
    const icon = make('span', 'gallery-empty-icon');
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML = folderIcon;
    const title = make('h2', '', isFailure ? 'Galeria chwilowo niedostępna' : 'Tutaj pojawią się albumy');
    const message = make('p', '',
      isFailure
        ? 'Nie udało się odczytać listy albumów. Spróbuj odświeżyć stronę.'
        : 'Przygotowujemy pierwsze foldery ze zdjęciami. Gdy pojawią się albumy, będzie można otwierać je i przeglądać zdjęcia za pomocą strzałek oraz miniatur.');
    empty.append(icon, title, message);
    grid.append(empty);
  }

  function renderAlbums(albums) {
    if (!albums.length) {
      showEmpty(false);
      return;
    }
    grid.replaceChildren();
    albums.forEach(album => {
      const card = make('button', 'gallery-album');
      card.type = 'button';
      card.setAttribute('aria-label', 'Otwórz album ' + album.title + ', zdjęć: ' + album.photos.length);
      const cover = make('span', 'gallery-album-cover');
      const image = make('img', '');
      image.src = album.cover;
      image.alt = '';
      image.loading = 'lazy';
      image.decoding = 'async';
      image.addEventListener('error', () => {
        image.remove();
        if (!cover.querySelector('svg')) cover.innerHTML = folderIcon;
      }, {once:true});
      cover.append(image);
      const copy = make('span', 'gallery-album-copy');
      const count = make('span', 'gallery-album-topline', 'ALBUM · ' + nf.format(album.photos.length) + (album.photos.length === 1 ? ' ZDJĘCIE' : ' ZDJĘĆ'));
      const name = make('span', 'gallery-album-name', album.title);
      const description = make('span', 'gallery-album-description', album.description);
      const cta = make('span', 'gallery-album-cta', 'Zobacz album');
      const arrow = make('span', '', '↗');
      arrow.setAttribute('aria-hidden', 'true');
      cta.append(arrow);
      copy.append(count, name);
      if (album.description) copy.append(description);
      copy.append(cta);
      card.append(cover, copy);
      card.addEventListener('click', () => openAlbum(album, card));
      grid.append(card);
    });
  }

  function openAlbum(album, trigger) {
    activeAlbum = album;
    activeIndex = 0;
    focusBefore = trigger;
    albumTitle.textContent = album.title;
    thumbs.replaceChildren();
    buttons = album.photos.map((photo, i) => {
      const btn = make('button', 'gallery-thumb');
      btn.type = 'button';
      btn.setAttribute('aria-label', 'Pokaż zdjęcie ' + (i + 1) + ' z ' + album.photos.length);
      const img = make('img', '');
      img.src = photo.thumb;
      img.alt = '';
      img.loading = 'lazy';
      img.decoding = 'async';
      const number = make('span', '', String(i + 1));
      btn.append(img, number);
      btn.addEventListener('click', () => showPhoto(i));
      thumbs.append(btn);
      return btn;
    });
    if (!viewer.open) viewer.showModal();
    document.body.classList.add('gallery-modal-open');
    showPhoto(0);
    closeButton.focus();
  }

  function showPhoto(i) {
    if (!activeAlbum || !activeAlbum.photos.length) return;
    const photos = activeAlbum.photos;
    activeIndex = (i + photos.length) % photos.length;
    const photo = photos[activeIndex];
    mainImage.hidden = false;
    fallback.hidden = true;
    mainImage.alt = photo.alt || ('Zdjęcie ' + (activeIndex + 1) + ' z albumu ' + activeAlbum.title);
    // Weryfikuj, czy nie wyświetla się poprzedni niezaładowany obraz.
    mainImage.removeAttribute('src');
    mainImage.src = photo.src;
    photoCaption.textContent = photo.caption || '\u00a0';
    photoCount.textContent = nf.format(activeIndex + 1) + ' / ' + nf.format(photos.length);
    prevButton.disabled = photos.length < 2;
    nextButton.disabled = photos.length < 2;
    buttons.forEach((btn, index) => {
      btn.setAttribute('aria-current', String(index === activeIndex));
      if (index === activeIndex) btn.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});
    });
  }

  mainImage.addEventListener('error', () => {
    mainImage.hidden = true;
    fallback.hidden = false;
    fallback.textContent = 'Nie udało się wczytać tego zdjęcia.';
  });

  function closeAlbum() {
    if (viewer.open) viewer.close();
  }

  prevButton.addEventListener('click', () => showPhoto(activeIndex - 1));
  nextButton.addEventListener('click', () => showPhoto(activeIndex + 1));
  closeButton.addEventListener('click', closeAlbum);
  viewer.addEventListener('close', () => {
    document.body.classList.remove('gallery-modal-open');
    activeAlbum = null;
    if (focusBefore && focusBefore.isConnected) focusBefore.focus();
    focusBefore = null;
  });
  viewer.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      showPhoto(activeIndex + 1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      showPhoto(activeIndex - 1);
    }
  });
  stage.addEventListener('touchstart', event => {
    if (event.touches.length !== 1) return;
    touchX = event.touches[0].clientX;
    touchY = event.touches[0].clientY;
  }, {passive:true});
  stage.addEventListener('touchend', event => {
    if (touchX === null || touchY === null || !event.changedTouches.length) return;
    const dx = event.changedTouches[0].clientX - touchX;
    const dy = event.changedTouches[0].clientY - touchY;
    touchX = null;
    touchY = null;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.3) showPhoto(activeIndex + (dx < 0 ? 1 : -1));
  }, {passive:true});

  fetch('albums.json', {cache:'no-store'})
    .then(response => {
      if (!response.ok) throw new Error('albums.json ' + response.status);
      return response.json();
    })
    .then(data => {
      const albums = Array.isArray(data.albums) ? data.albums.map(cleanAlbum).filter(Boolean) : [];
      renderAlbums(albums);
    })
    .catch(() => showEmpty(true));
})();
