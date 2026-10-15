# 09 · Como atualizar

## 1. Regenerar os dados

Na raiz do repositório:

```bash
python scripts/baixar_brutos.py      # baixa os CSV do espelho para brutos/
python scripts/build_dados.py        # recalcula tudo e grava dados/*.json
python scripts/gerar_dicionario.py   # atualiza docs/04 com a cobertura nova
```

`build_dados.py` imprime no fim um resumo para conferência: o escore geral do Brasil por ano, os escores por tema e a posição no ranking. Compare com a versão anterior antes de publicar. Saltos grandes costumam vir de uma série revisada ou de um país novo no universo.

### Checklist de conferência
- [ ] Os 8 arquivos de `dados/` e de `site/data/` foram regravados (confira a data de modificação).
- [ ] `indicadores.json` mostra `ultimo_ano` coerente (a maioria 2024 ou 2025).
- [ ] O PIB per capita PPC do Brasil no último ano bate com o site do Banco Mundial (`NY.GDP.PCAP.PP.KD`).
- [ ] O número de países no ranking (`ranking_brasil.json`) está perto de 175.
- [ ] Nenhum tema do Brasil ficou sem escore no último ano.

## 2. Publicar

`build_dados.py` grava os JSON em `dados/` e uma cópia em `site/data/`. Para publicar:

1. Teste localmente: `cd site && python -m http.server 8000`.
2. Faça commit e push. Com o GitHub Pages, a Netlify ou o Cloudflare Pages, o site se atualiza sozinho. Em hospedagem cPanel, envie de novo a pasta `site/data/` (ver [doc 10](10-publicacao.md)).

## 3. Mudar regras de cálculo

| Quero mudar... | Onde |
|---|---|
| Lista de indicadores, sentido ou alvo | `IND` em `scripts/build_dados.py` (+ `CODES` em `baixar_brutos.py`) |
| Coortes | `COHORTS` em `build_dados.py` e `COORTES` em `site/assets/js/app.js` |
| Limite de imputação | `FILL` em `build_dados.py` |
| Período dos escores | `SCORE_Y0` em `build_dados.py` |
| Mandatos | `PERIODS` em `build_dados.py` e `PERIODOS` / `MANDATO` em `site/assets/js/app.js` |
| Mínimo de países para calcular percentil | `if n<20` na seção de percentis de `build_dados.py` |

Toda mudança de regra deve ser registrada em `docs/03-metodologia.md` no mesmo commit.

## 4. Versionamento

- Mensagens de commit em português, no imperativo, descrevendo o que mudou nos dados ou no método (ex.: "Atualiza dados até 2026; inclui ICE no tema produtivo").
- Os dados derivados (`dados/`) são versionados para que o site possa ser reconstruído sem rodar o pipeline. Os brutos (`brutos/`) não são.
