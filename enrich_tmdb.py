#!/usr/bin/env python3
"""Enriquece placeholders em data.json usando a API TMDb.

Uso: definir a variável de ambiente TMDB_API_KEY antes de executar.
Ex.: export TMDB_API_KEY="sua_chave" && python3 scripts/enrich_tmdb.py
"""
import json
import os
import sys
import time
from urllib import request, parse, error

TMDB_API_KEY = os.getenv('TMDB_API_KEY')
if not TMDB_API_KEY:
    print('TMDB_API_KEY não encontrada no ambiente. Exporte-a e tente novamente.')
    sys.exit(1)

BASE = 'https://api.themoviedb.org/3'

def tmdb_get(path, params=None):
    if params is None:
        params = {}
    params['api_key'] = TMDB_API_KEY
    url = BASE + path + '?' + parse.urlencode(params)
    max_retries = 3
    for attempt in range(max_retries):
        try:
            with request.urlopen(url, timeout=15) as resp:
                return json.load(resp)
        except error.HTTPError as e:
            # Se houver rate limit, tenta novamente com backoff
            code = getattr(e, 'code', None)
            if code == 429 and attempt < max_retries - 1:
                wait = (attempt + 1) * 1.0
                print(f'Rate limit recebido (429). Retry em {wait}s...')
                time.sleep(wait)
                continue
            print('Erro ao consultar TMDb:', e)
            return None
        except Exception as e:
            print('Erro de rede/parsing:', e)
            if attempt < max_retries - 1:
                time.sleep(0.5 * (attempt + 1))
                continue
            return None

def build_movie_from_tmdb(details, credits, vote_average):
    title = details.get('title') or details.get('original_title') or ''
    overview = details.get('overview') or ''
    release_date = details.get('release_date') or ''
    year = 0
    if release_date:
        try:
            year = int(release_date.split('-')[0])
        except Exception:
            year = 0
    director = ''
    for person in credits.get('crew', []) if credits else []:
        if person.get('job') == 'Director':
            director = person.get('name')
            break
    genres = details.get('genres') or []
    category = genres[0]['name'] if genres else 'Filme'
    imdb_id = details.get('imdb_id') or ''
    link = f'https://www.imdb.com/title/{imdb_id}/' if imdb_id else ''
    poster_path = details.get('poster_path')
    poster = f'https://image.tmdb.org/t/p/w500{poster_path}' if poster_path else ''
    return {
        'titulo': title,
        'descricao': overview,
        'ano': year,
        'diretor': director,
        'categoria': category,
        'avaliacao': float(vote_average or 0.0),
        'link': link,
        'poster': poster,
    }

def main():
    # Carrega data.json
    with open('data.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    # Guarda backup em memória do estado original (será escrito em disco antes de sobrescrever)
    original_data = data

    # Identificar placeholders: categoria == 'Placeholder' ou titulo começa com 'Filme Placeholder' ou link vazio
    placeholder_idxs = [i for i,m in enumerate(data) if (m.get('categoria')=='Placeholder' or str(m.get('titulo','')).startswith('Filme Placeholder') or not m.get('link'))]
    print('Placeholders encontrados:', len(placeholder_idxs))
    if not placeholder_idxs:
        print('Nenhum placeholder para substituir.')
        return

    # Buscar filmes populares do TMDb (varias páginas até termos candidatos suficientes)
    candidates = []
    page = 1
    while len(candidates) < len(placeholder_idxs) and page <= 5:
        resp = tmdb_get('/movie/popular', {'language':'pt-BR', 'page': page})
        if not resp:
            break
        results = resp.get('results', [])
        for r in results:
            candidates.append(r)
        page += 1
        time.sleep(0.25)

    if not candidates:
        print('Nenhum filme novo obtido do TMDb. Verifique a chave/API ou tente novamente.')
        return

    replaced = 0
    ci = 0
    for idx in placeholder_idxs:
        # encontrar próximo candidato válido
        while ci < len(candidates):
            cand = candidates[ci]
            ci += 1
            movie_id = cand.get('id')
            if not movie_id:
                continue
            details = tmdb_get(f'/movie/{movie_id}', {'language':'pt-BR'})
            if not details:
                continue
            credits = tmdb_get(f'/movie/{movie_id}/credits', {'language':'pt-BR'}) or {}
            newobj = build_movie_from_tmdb(details, credits, cand.get('vote_average'))
            # substitui
            data[idx] = newobj
            replaced += 1
            time.sleep(0.2)
            break


    # Salva backup do conteúdo original e escreve arquivo atualizado
    try:
        with open('data.json.enriched.bak','w',encoding='utf-8') as bf:
            json.dump(original_data, bf, ensure_ascii=False, indent=2)
    except Exception as e:
        print('Não foi possível salvar backup:', e)

    with open('data.json','w',encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f'Substituídos {replaced} placeholders. Backup salvo em data.json.enriched.bak')

if __name__ == '__main__':
    main()
