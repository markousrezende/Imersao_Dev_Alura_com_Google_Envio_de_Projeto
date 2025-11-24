# Catálogo de Filmes — Projeto

Este repositório contém um catálogo de filmes estático (HTML/CSS/JS) com os dados em `data.json`.

Passos rápidos para rodar localmente:

- Requisitos: Python 3 (para servidor simples) ou qualquer servidor estático.

1. Abra um terminal na raiz do projeto.
2. Execute um servidor local simples (porta 8000 por padrão):

```bash
python3 -m http.server
```

3. Abra no navegador: `http://localhost:8000`

Observações importantes:

- Os dados do catálogo estão centralizados em `data.json`. Não existe mais um fallback JSON embutido em `index.html`.
- Se preferir abrir o arquivo diretamente com `file://`, o carregamento via `fetch('data.json')` pode falhar por restrições do navegador. Use o servidor local acima.

Enriquecimento via TMDb

- Existe um script em `scripts/enrich_tmdb.py` que substitui placeholders em `data.json` consultando a API do TMDb.
- Antes de rodar, exporte sua chave TMDb:

```bash
export TMDB_API_KEY="sua_chave_aqui"
python3 scripts/enrich_tmdb.py
```

- O script cria um backup em `data.json.enriched.bak` antes de sobrescrever `data.json`.

Próximos passos sugeridos

- Rodar verificação visual no navegador e ajustar responsividade.
- Refatorar `script.js` e consolidar variáveis em `style.css` (já em andamento como parte da organização).
- Mover/organizar assets (já movidos para `assets/`).

Se quiser, eu posso:
- Rodar a refatoração do `script.js` para torná-lo ainda mais legível;
- Padronizar `style.css` e remover regras duplicadas;
- Executar uma verificação de acessibilidade básica.

Diga qual desses itens você quer que eu faça a seguir.