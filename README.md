# Strona osobista – Marta Anna Sofron

Gotowy, responsywny szablon wizytówki akademicko-zawodowej na **GitHub Pages**. To statyczna strona — nie wymaga serwera, domeny, instalacji bibliotek ani kompilowania projektu.

## Co zawiera

- Wprowadzenie i biografię zawodowo-naukową
- Obszary zainteresowań badawczych
- Trzy przykładowo opisane projekty i miejsce na następne
- Doświadczenie zawodowe i akademickie
- Sekcję kontaktową i linki do profili naukowych
- Przełącznik polski/angielski, jasny/ciemny motyw oraz układ mobilny

## 1. Uzupełnij przed upublicznieniem

**Najpierw sprawdź treść biogramu i projektów w `index.html`**. Wersja bazuje na znanych informacjach o działalności zawodowej i akademickiej, ale należy zweryfikować nazwy, statusy projektów i informacje, które mają być publiczne. W `script.js` istnieje angielska wersja tekstów — przy zmianach po polsku zaktualizuj również odpowiednie hasła w obiekcie `EN`.

W pliku `script.js`, na samym początku, znajdziesz:

```js
const SITE_CONFIG = {
  email: '',
  github: '',
  orcid: '',
  googleScholar: '',
  linkedin: '',
  researchGate: '',
  project1: '',
  project2: '',
  project3: ''
};
```

Wypełnij wybrane pozycje. Puste pola nie tworzą aktywnych linków. Nie podawaj prywatnego numeru telefonu czy adresu zamieszkania; nie umieszczaj niczego, co nie powinno być publiczne.

## 2. Jak opublikować na GitHub Pages

1. Zaloguj się na [github.com](https://github.com) i wybierz **New repository**.
2. Nazwij repozytorium dokładnie **`TWÓJ-LOGIN.github.io`**, zastępując `TWÓJ-LOGIN` nazwą swojego konta (najlepiej małymi literami). Dla konta darmowego wybierz repozytorium **Public**.
3. Wgraj do głównego katalogu repozytorium wszystkie pliki tego folderu: `index.html`, `styles.css`, `script.js`, `favicon.svg` i `.nojekyll` (README jest opcjonalny). Najprościej: **Add file → Upload files**.
4. Przejdź do **Settings → Pages**.
5. Ustaw **Build and deployment → Source → Deploy from a branch**, następnie **Branch: main** i folder **/(root)**. Kliknij **Save**.
6. Strona będzie dostępna pod adresem **`https://TWÓJ-LOGIN.github.io/`**. Publikacja może zająć kilka minut.

Możesz również użyć istniejącego repozytorium o innej nazwie: wtedy adres zwykle przyjmie postać `https://TWÓJ-LOGIN.github.io/NAZWA-REPO/`.

Oficjalna dokumentacja: [GitHub Pages – quickstart](https://docs.github.com/en/pages/quickstart).

## 3. Jak edytować tekst i wygląd

- **Treści po polsku:** `index.html`
- **Treści po angielsku:** obiekt `EN` w `script.js`
- **Linki:** obiekt `SITE_CONFIG` na początku `script.js`
- **Kolory, odstępy, czcionki:** `styles.css`, przede wszystkim wartości `:root` na początku pliku
- **Nowy projekt:** skopiuj jeden blok `<article class="project-card">…</article>` z sekcji `#projekty` i uzupełnij nazwę/opis. Jeśli ma mieć osobny przycisk, dostosuj również obsługę linku w `script.js`.

Każdą zmianę można zrobić bezpośrednio w przeglądarce przez przycisk edycji pliku na GitHubie, a następnie **Commit changes**.

## 4. Podgląd lokalny

Otwórz `index.html` w przeglądarce. W tym projekcie nie jest potrzebny lokalny serwer.

## Uwagi

- Brak śledzenia, reklam czy zewnętrznych bibliotek.
- Strona jest świadomie przygotowana bez fotografii — zdjęcie można dodać później.
- Karty projektów nie prowadzą do wymyślonych adresów. Ich przyciski pojawią się automatycznie po wpisaniu prawdziwych URL-i.
- Pamiętaj, że GitHub Pages i publiczne repozytorium są dostępne dla wszystkich.
