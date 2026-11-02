#!/usr/bin/env python3
"""Cykliczne liczniki mediów AntoniSofron. Nie zamieniaj braku danych na zero.

Discord: przybliżona liczba członków z publicznych zaproszeń.
Pozostałe platformy: oficjalne API z sekretem lub bezpieczna próba publicznego
odczytu. Brak dostępu = brak liczby, a nie fikcyjny wynik.
"""
from __future__ import annotations

import datetime as dt
import json
import os
import re
from pathlib import Path

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "stats" / "media.json"
UA = "Mozilla/5.0 (compatible; AntoniSofronMediaStats/1.0; +https://antonisofron.github.io/antonisofron/)"
SESSION = requests.Session()
SESSION.headers.update({"User-Agent": UA, "Accept": "application/json,text/html;q=0.9"})

PROFILES = {
    "sclavorum": ("discord", "WHVATWdK4y"),
    "sofroniki_tiktok": ("tiktok", "sofroniki_po_koreansku"),
    "sofroniki_instagram": ("instagram", "sofroniki_po_koreansku"),
    "sofroniki_youtube": ("youtube", "Sofroniki"),
    "antoni_youtube": ("youtube", "AntoniSofron"),
    "antoni_x": ("x", "AntonSofron"),
    "sofron_discord": ("discord", "ZtFZ5p4EA5"),
}


def iso_now():
    return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def get(url, **kwargs):
    r = SESSION.get(url, timeout=14, **kwargs)
    r.raise_for_status()
    return r


def valid_number(x):
    return type(x) is int and 0 <= x <= 9007199254740991


def exact_text_number(value):
    """Accept only non-rounded, integer counts; never treat 1.2K as exactly 1200."""
    if not isinstance(value, str):
        return None
    s = value.strip().replace("\u00a0", "").replace("\u202f", "").replace(" ", "")
    if not re.fullmatch(r"\d{1,3}(?:,\d{3})+|\d{1,3}(?:\.\d{3})+|\d+", s):
        return None
    n = int(s.replace(",", "").replace(".", ""))
    return n if valid_number(n) else None


def discord_members(code):
    d = get("https://discord.com/api/v10/invites/" + code, params={"with_counts": "true"}).json()
    n = d.get("approximate_member_count")
    if not valid_number(n):
        raise ValueError("Discord: brak approximate_member_count")
    return n, "Discord", True


def youtube_number_label(text):
    """Wyczytaj publiczną wartość z nagłówka kanału, rozpoznając 1.2K / 15K."""
    if not isinstance(text, str):
        return None
    match = re.search(r"(?<!\w)([\d][\d,]*(?:\.\d+)?)([KMB]?)\s+subscribers?\b", text, re.I)
    if not match:
        return None
    raw, unit = match.group(1), match.group(2).upper()
    try:
        scale = {"": 1, "K": 1000, "M": 1000000, "B": 1000000000}[unit]
        count = round(float(raw.replace(",", "")) * scale)
    except (ValueError, OverflowError):
        return None
    return count if valid_number(count) else None


def channel_header_subscribers(html):
    """Analizuj wyłącznie nagłówek kanału, nie polecane filmy ani komentarze."""
    decoder = json.JSONDecoder()
    for m in re.finditer(r"(?:var\s+)?ytInitialData\s*=\s*", html):
        start = html.find("{", m.end(), m.end() + 80)
        if start < 0:
            continue
        try:
            data, _ = decoder.raw_decode(html[start:])
        except (ValueError, TypeError):
            continue
        header = data.get("header") or {}
        def walk(value):
            if isinstance(value, str):
                result = youtube_number_label(value)
                return result
            if isinstance(value, dict):
                for k, v in value.items():
                    if k in {"trackingParams", "commandMetadata", "loggingDirectives"}:
                        continue
                    found = walk(v)
                    if found is not None:
                        return found
            elif isinstance(value, list):
                for v in value:
                    found = walk(v)
                    if found is not None:
                        return found
            return None
        count = walk(header)
        if count is not None:
            return count
    # Ograniczony fragment bezpośrednio po właściwości nagłówka.
    for m in re.finditer(r'"subscriberCountText"\s*:', html):
        snippet = html[m.end():m.end() + 380]
        count = youtube_number_label(snippet)
        if count is not None:
            return count
    return None


def youtube_subscribers(handle):
    key = os.getenv("YOUTUBE_API_KEY", "").strip()
    if key:
        d = get("https://www.googleapis.com/youtube/v3/channels", params={
            "part": "statistics", "forHandle": "@" + handle, "key": key
        }).json()
        channels = d.get("items") or []
        if not channels:
            raise ValueError("YouTube: brak kanału")
        stats = channels[0].get("statistics", {})
        if stats.get("hiddenSubscriberCount"):
            raise ValueError("YouTube: licznik ukryty")
        n = int(stats["subscriberCount"])
        if not valid_number(n):
            raise ValueError("YouTube: nieprawidłowa liczba")
        return n, "YouTube Data API", n >= 1000

    for suffix in ("", "/about"):
        try:
            html = get("https://www.youtube.com/@" + handle + suffix,
                       params={"hl": "en", "gl": "US"}).text
            count = channel_header_subscribers(html)
            if count is not None:
                return count, "YouTube · publiczny nagłówek", count >= 1000
        except requests.RequestException:
            continue
    raise ValueError("YouTube: licznik niedostępny publicznie; ustaw YOUTUBE_API_KEY")


def tiktok_followers(username):
    token = os.getenv("TIKTOK_RESEARCH_ACCESS_TOKEN", "").strip()
    if token:
        r = SESSION.post(
            "https://open.tiktokapis.com/v2/research/user/info/",
            params={"fields": "follower_count"},
            json={"username": username},
            headers={"Authorization": "Bearer " + token},
            timeout=14
        )
        r.raise_for_status()
        n = r.json().get("data", {}).get("follower_count")
        if not valid_number(n):
            raise ValueError("TikTok: brak uprawnionego odczytu follower_count")
        return n, "TikTok Research API", False

    html = get("https://www.tiktok.com/@" + username).text
    soup = BeautifulSoup(html, "html.parser")
    node = soup.find("script", id="__UNIVERSAL_DATA_FOR_REHYDRATION__")
    if not node or not node.string:
        raise ValueError("TikTok: niedostępne publiczne dane profilu")
    data = json.loads(node.string)
    info = data.get("__DEFAULT_SCOPE__", {}).get("webapp.user-detail", {}).get("userInfo", {})
    if info.get("user", {}).get("uniqueId", "").lower() != username.lower():
        raise ValueError("TikTok: odpowiedź dotyczy innego konta")
    n = info.get("stats", {}).get("followerCount")
    if not valid_number(n):
        raise ValueError("TikTok: brak followerCount")
    return n, "TikTok", False


def instagram_followers(username):
    token = os.getenv("INSTAGRAM_ACCESS_TOKEN", "").strip()
    ig_id = os.getenv("INSTAGRAM_USER_ID", "").strip()
    if token:
        if ig_id:
            # Instagram API z Facebook Login, gdy podano numer użytkownika IG.
            d = get("https://graph.facebook.com/v26.0/" + ig_id, params={
                "fields": "username,followers_count", "access_token": token
            }).json()
        else:
            # Instagram API z Instagram Login: identyfikator nie jest potrzebny.
            d = get("https://graph.instagram.com/v26.0/me", params={
                "fields": "username,followers_count"
            }, headers={"Authorization": "Bearer " + token}).json()
        if (d.get("username") or "").lower() != username.lower():
            raise ValueError("Instagram: wskazany token nie należy do podanego profilu")
        n = d.get("followers_count")
        if not valid_number(n):
            raise ValueError("Instagram: brak followers_count")
        return n, "Instagram Graph API", False

    html = get("https://www.instagram.com/" + username + "/", params={"hl": "en"}).text
    soup = BeautifulSoup(html, "html.parser")
    node = soup.select_one('meta[name="description"]') or soup.select_one('meta[property="og:description"]')
    desc = node.get("content", "") if node else ""
    # Tylko całkowite i jednoznaczne wartości; nie przeliczaj przybliżeń "1.2K".
    m = re.search(r"([\d][\d., ]*)\s+Followers?\b", desc, re.I)
    n = exact_text_number(m.group(1)) if m else None
    if n is None:
        raise ValueError("Instagram: publiczny licznik niedostępny; wymagane uprawnienia API")
    return n, "Instagram", False


def x_followers(username):
    token = os.getenv("X_BEARER_TOKEN", "").strip()
    if not token:
        # Publiczne API FxEmbed, bez klucza. Weryfikujemy nazwę konta przed zapisaniem.
        d = get("https://api.fxtwitter.com/2/profile/" + username).json()
        if d.get("code") != 200 or not isinstance(d.get("user"), dict):
            raise ValueError("FxEmbed: profil niedostępny")
        user = d["user"]
        if str(user.get("screen_name", "")).lower() != username.lower():
            raise ValueError("FxEmbed: odpowiedź dla innego konta")
        n = user.get("followers")
        if not valid_number(n):
            raise ValueError("FxEmbed: brak poprawnej liczby followers")
        return n, "FxEmbed · X", False
    d = get("https://api.x.com/2/users/by/username/" + username,
            params={"user.fields": "public_metrics"},
            headers={"Authorization": "Bearer " + token}).json()
    user = d.get("data") or {}
    if user.get("username", "").lower() != username.lower():
        raise ValueError("X: profil niezgodny z żądanym")
    n = (user.get("public_metrics") or {}).get("followers_count")
    if not valid_number(n):
        raise ValueError("X: brak followers_count")
    return n, "X API", False


# Publiczny agregator profili, używany zapasowo i nie częściej niż raz na 6 h.
# Źródło: https://pulse.walls.sh/docs — anonimowy dostęp do danych publicznych.
PULSE_URLS = {
    "youtube": "https://www.youtube.com/@{handle}",
    "instagram": "https://www.instagram.com/{handle}/",
    "x": "https://x.com/{handle}",
}
PUBLIC_INTERVAL_SECONDS = 6 * 60 * 60


def instagram_public_profile(username):
    """Sprawdź wyłącznie publiczne metadane konta, bez logowania i sesji."""
    d = get("https://www.instagram.com/api/v1/users/web_profile_info/",
            params={"username": username},
            headers={"X-IG-App-ID": "936619743392459",
                     "Referer": "https://www.instagram.com/" + username + "/",
                     "Accept": "application/json"}).json()
    user = (d.get("data") or {}).get("user") or {}
    if str(user.get("username", "")).lower() != username.lower():
        raise ValueError("Instagram: otrzymano inny profil")
    count = user.get("follower_count")
    if not valid_number(count):
        count = (user.get("edge_followed_by") or {}).get("count")
    if not valid_number(count):
        raise ValueError("Instagram: brak publicznej liczby")
    return count, "Instagram · publiczne dane", False


def pulse_followers(platform, handle):
    template = PULSE_URLS.get(platform)
    if not template:
        raise ValueError("Niewspierana platforma")
    url = template.format(handle=handle)
    payload = get("https://pulse.walls.sh/profile", params={"url": url}).json()
    if payload.get("error"):
        raise ValueError("Publiczny odczyt: " + str(payload["error"])[:100])
    reported_platform = str(payload.get("platform", "")).lower()
    if reported_platform not in {platform, "twitter" if platform == "x" else platform}:
        raise ValueError("Agregator zwrócił inny serwis: " + reported_platform)
    reported_handle = str(payload.get("handle") or "").lstrip("@").lower()
    if reported_handle and reported_handle != handle.lower():
        raise ValueError("Agregator zwrócił inny profil: " + reported_handle)
    value = payload.get("followers")
    if not valid_number(value):
        raise ValueError("Publiczny licznik obserwujących niedostępny")
    # YouTube pokazuje jedynie zaokrągloną liczbę od progu 1000.
    return value, "Pulse · " + platform, platform == "youtube" and value >= 1000


def recent_attempt(value):
    try:
        dt_value = dt.datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        if dt_value.tzinfo is None:
            return False
        return 0 <= (dt.datetime.now(dt.timezone.utc) - dt_value).total_seconds() < PUBLIC_INTERVAL_SECONDS
    except (ValueError, TypeError):
        return False


FETCHERS = {
    "discord": discord_members,
    "tiktok": tiktok_followers,
    "instagram": instagram_followers,
    "youtube": youtube_subscribers,
    "x": x_followers,
}


def main():
    try:
        stats = json.loads(OUT.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        stats = {}
    profiles = stats.setdefault("profiles", {})
    public_attempts = stats.setdefault("public_attempts", {})
    dirty = False
    for profile_id, (platform, handle) in PROFILES.items():
        # Anonimowe próby Instagram raz na 6 godzin, zamiast żądań co 10 min.
        # Po skonfigurowaniu oficjalnego tokena sprawdzamy co uruchomienie.
        if (platform == "instagram" and not os.getenv("INSTAGRAM_ACCESS_TOKEN", "").strip()
                and recent_attempt(public_attempts.get(profile_id))):
            print("INSTAGRAM POMINIĘTY", profile_id, "do kolejnej próby anonimowej")
            continue
        try:
            try:
                n, source, approximate = FETCHERS[platform](handle)
            except Exception as primary_exc:
                if platform not in PULSE_URLS:
                    raise
                if recent_attempt(public_attempts.get(profile_id)):
                    print("PUBLICZNY ODCZYT POMINIĘTY", profile_id, "do następnej próby za maksymalnie 6 h")
                    continue
                public_attempts[profile_id] = iso_now()
                dirty = True
                try:
                    if platform == "instagram":
                        try:
                            n, source, approximate = instagram_public_profile(handle)
                        except Exception as instagram_exc:
                            print("INSTAGRAM PUBLIC", profile_id, str(instagram_exc)[:110])
                            n, source, approximate = pulse_followers(platform, handle)
                    else:
                        n, source, approximate = pulse_followers(platform, handle)
                except Exception as pulse_exc:
                    print("PODSTAWOWY ODCZYT", profile_id, str(primary_exc)[:100])
                    raise RuntimeError("publiczny odczyt: " + str(pulse_exc)[:130]) from pulse_exc
            if not valid_number(n):
                raise ValueError("Nieprawidłowa wartość")
            record = {
                "value": n, "source": source, "approximate": approximate,
                "checked_at": iso_now()
            }
            prev = profiles.get(profile_id, {})
            # Odświeżaj znacznik kontroli przynajmniej co 6 godzin.
            # Dzięki temu stale równe liczby nie wyglądają na przeterminowane.
            try:
                checked = dt.datetime.fromisoformat(str(prev.get("checked_at", "")).replace("Z", "+00:00"))
                recent = (dt.datetime.now(dt.timezone.utc) - checked).total_seconds() < 21600
            except (ValueError, TypeError):
                recent = False
            if prev.get("value") == n and prev.get("approximate") == approximate and recent:
                record["checked_at"] = prev["checked_at"]
            if prev != record:
                profiles[profile_id] = record
                dirty = True
            print(profile_id, "=", n, "~" if approximate else "", source)
        except Exception as exc:
            print("NIEDOSTĘPNE", profile_id, str(exc)[:190])
            # Ostatni znany wynik nie jest zerowany przy przejściowym błędzie.
    if dirty or not OUT.is_file():
        stats["updated_at"] = iso_now()
        OUT.parent.mkdir(parents=True, exist_ok=True)
        OUT.write_text(json.dumps(stats, indent=2, ensure_ascii=False, sort_keys=True) + "\n", encoding="utf-8")
        print("Zapisano", OUT)
    else:
        print("Bez zmian liczbowych")


if __name__ == "__main__":
    main()
