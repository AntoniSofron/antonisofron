#!/usr/bin/env python3
"""Sofron Pack: periodically collect Modrinth followers/downloads and
CurseForge project favorites/downloads. Runs on GitHub Actions.

A missing field NEVER counts as zero; previously valid values survive failures.
CurseForge public site is used for the project-level favorites value,
with optional official API fallback if a CURSEFORGE_API_KEY secret is set.
"""
from __future__ import annotations
import datetime as dt
import json
import logging
import os
from pathlib import Path
import re
import time
from urllib.parse import quote
import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'stats' / 'sofron-pack.json'
UA = 'AntoniSofron-ProjectStats/1.0 (+https://antonisofron.github.io/antonisofron/; contact: antonisofron@gmail.com)'
SESSION = requests.Session()
SESSION.headers.update({'User-Agent': UA, 'Accept': 'application/json, text/html;q=0.9'})
class PublicNotFound(Exception):
    pass
API_KEY = (os.getenv('CURSEFORGE_API_KEY') or '').strip()
PROJECTS = {
    'sofron16': {'modrinth': ['sofron16'], 'curseforge': [('1563902','minecraft/texture-packs/sofron16')]},
    'sofronocd': {'modrinth': ['sofronocd'], 'curseforge': [('269923','minecraft/texture-packs/sofronocd')]},
    'sofrongen': {'modrinth': ['sofrongen','sofron-pack'], 'curseforge': [('sofrongen-mod','minecraft/mc-mods/sofron-pack-gen'),('1712000','minecraft/data-packs/sofron-pack')]},
    'sofronlight': {'modrinth': ['sofronlight'], 'curseforge': [('1745496','minecraft/mc-mods/sofron-pack-light')]},
}


def now():
    return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace('+00:00','Z')


def request(url, *, headers=None):
    for trial in range(2):
        try:
            response=SESSION.get(url, timeout=16, headers=headers or {}, allow_redirects=True)
            if response.status_code == 404:
                raise PublicNotFound(url)
            if response.status_code == 403:
                raise RuntimeError('HTTP 403 — public access blocked')
            response.raise_for_status()
            return response
        except PublicNotFound:
            raise
        except Exception:
            if trial == 1: raise
            time.sleep(1.3)


def count(value):
    if isinstance(value, bool): return None
    if isinstance(value, int) and value >= 0: return value
    if isinstance(value, float) and value >= 0 and value.is_integer(): return int(value)
    if not isinstance(value, str): return None
    s=value.strip().replace('\u00a0','').replace(' ','').replace(',','')
    if re.fullmatch(r'\d+',s): return int(s)
    # Do not use rounded K/M values in precise totals.
    return None


def modrinth(slug):
    d=request('https://api.modrinth.com/v2/project/'+quote(slug)).json()
    return {'downloads':count(d.get('downloads')),'followers':count(d.get('followers'))}


def curse_api(project_id):
    if not API_KEY or not project_id.isdigit(): return {}
    d=request(f'https://api.curseforge.com/v1/mods/{project_id}',headers={'x-api-key':API_KEY}).json().get('data',{})
    # API describes thumbsUpCount as thumbs-ups; do not equate to Favorites
    # until they can be independently matched with the visible project counter.
    return {'downloads':count(d.get('downloadCount')), 'thumbs_up':count(d.get('thumbsUpCount'))}


def curse_public(path):
    url='https://www.curseforge.com/'+path
    html=request(url, headers={'Accept':'text/html'}).text
    soup=BeautifulSoup(html,'html.parser')
    for unwanted in soup(['script','style','noscript']): unwanted.decompose()
    text=' '.join(soup.stripped_strings)
    # Use the precise total from the Details box, not the rounded "735.8K".
    d=re.search(r'\bDetails\s+Downloads\s+([\d,\s]+?)\s+Created\b',text,re.I)
    # Project-level favorite number is displayed between Install/Download and Details.
    f=re.search(r'\b(?:Install\s+via\s+App|Download)\s+([\d,]+)\s+Details\b',text,re.I)
    # Some pages include a separator or carousel between the two values.
    if f is None:
        f=re.search(r'\b(?:Install\s+via\s+App|Download)\s+([\d,]+)\s+(?:More Details|Details)\b',text,re.I)
    return {'downloads':count(d.group(1)) if d else None,'favorites':count(f.group(1)) if f else None}


def curse_widget(project_id, path):
    # Unofficial but publicly documented CFWidget download cache. Never
    # substitute file downloads for the project total.
    target=project_id if project_id.isdigit() else path
    d=request('https://api.cfwidget.com/'+target).json()
    totals=d.get('downloads')
    if isinstance(totals,dict):
        for key in ('total','all_time','total_downloads'):
            v=count(totals.get(key))
            if v is not None: return {'downloads':v}
    v=count(totals)
    return {'downloads':v}


def merge(old, new):
    # Keep known-good numbers when an API temporarily fails.
    return {key:new[key] if new.get(key) is not None else old.get(key) for key in ('downloads','followers','favorites') if new.get(key) is not None or old.get(key) is not None}


def main():
    try: stats=json.loads(OUT.read_text(encoding='utf-8'))
    except (OSError,ValueError): stats={}
    stats.setdefault('projects',{})
    log=[]
    for project, ids in PROJECTS.items():
        data=stats['projects'].setdefault(project,{'modrinth':{},'curseforge':{}})
        data['expected_curseforge']=len(ids['curseforge'])
        for slug in ids['modrinth']:
            try:
                fresh=modrinth(slug)
                data['modrinth'][slug]=merge(data['modrinth'].get(slug,{}),fresh)
            except PublicNotFound:
                # A project that does not exist publicly contributes no public stats.
                data['modrinth'][slug]={'downloads':0,'followers':0}
                log.append(f'Modrinth {slug}: 404 — no public listing; counted as zero')
            except Exception as exc:
                log.append(f'Modrinth {slug}: {exc}')
        for project_id,path in ids['curseforge']:
            existing=data['curseforge'].get(project_id,{})
            result={'downloads':None,'favorites':None}
            official={}
            try:
                official=curse_api(project_id)
                if official.get('downloads') is not None: result['downloads']=official['downloads']
            except Exception as exc: log.append(f'CurseForge API {path}: {exc}')
            try:
                public=curse_public(path)
                if public['downloads'] is not None and result['downloads'] is None: result['downloads']=public['downloads']
                result['favorites']=public['favorites']
            except PublicNotFound:
                result['favorites']=0
                if result['downloads'] is None: result['downloads']=0
                log.append(f'CurseForge WWW {path}: 404 — no public listing; counted as zero')
            except Exception as exc: log.append(f'CurseForge WWW {path}: {exc}')
            if result['downloads'] is None:
                try: result['downloads']=curse_widget(project_id,path)['downloads']
                except Exception as exc: log.append(f'CFWidget {path}: {exc}')
            # An API "thumbs up" is not automatically a "favorite".
            # Allow its use only if it has been VERIFIED to equal the visible
            # project's Favorites counter during an earlier successful crawl.
            if result['favorites'] is not None and official.get('thumbs_up') is not None:
                existing['api_favorites_verified']=(result['favorites']==official['thumbs_up'])
            elif result['favorites'] is None and existing.get('api_favorites_verified') and official.get('thumbs_up') is not None:
                result['favorites']=official['thumbs_up']
            data['curseforge'][project_id]=merge(existing,result) | ({'api_favorites_verified':existing['api_favorites_verified']} if 'api_favorites_verified' in existing else {})
            # Avoid bursting requests against free services.
            time.sleep(.35)
    # Record timestamp only when numeric stats change (prevents hundreds of
    # unnecessary Git history commits on unchanged counters).
    compact={k:v for k,v in stats.items() if k!='updated_at'}
    try: old_compact=json.loads(OUT.read_text(encoding='utf-8')) if OUT.is_file() else {}
    except ValueError: old_compact={}
    old_compact.pop('updated_at',None)
    if compact!=old_compact:
        stats['updated_at']=now()
        OUT.parent.mkdir(parents=True,exist_ok=True)
        OUT.write_text(json.dumps(stats,ensure_ascii=False,indent=2,sort_keys=True)+'\n',encoding='utf-8')
        print('Updated', OUT)
    else:
        print('No metric changes')
    for message in log: print('NOTE:',message)

if __name__=='__main__': main()
