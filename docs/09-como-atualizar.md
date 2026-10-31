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
- [ ] Os 9 arquivos de `build_dados.py` em `dados/` e em `site/data/` foram regravados (confira a data de modificação).
- [ ] `indicadores.json` mostra `ultimo_ano` coerente (a maioria 2024 ou 2025).
- [ ] O PIB per capita PPC do Brasil no último ano bate com o site do Banco Mundial (`NY.GDP.PCAP.PP.KD`).
- [ ] O número de países no ranking (`ranking_brasil.json`) está perto de 175.
- [ ] Nenhum tema do Brasil ficou sem escore no último ano.

### Dados da aba Vida do Cidadão

Não passam pelo pipeline acima. O workflow **Atualizar dados de consumo básico** (`.github/workflows/dados-consumo.yml`) roda todo dia 12 e grava `consumo.json` no repositório. Para rodar na hora: GitHub → **Actions** → esse workflow → **Run workflow**. Leva poucos minutos. No próprio computador: `pip install openpyxl` e `python scripts/coletar_consumo.py`.

Se a ANP mudar o endereço das planilhas, o script falha com "não consegui baixar": basta atualizar `ANP_URLS` em `scripts/coletar_consumo.py`.

### Dados da aba Estatais

O workflow **Atualizar lucro das estatais federais** (`.github/workflows/dados-estatais.yml`) roda todo dia 16 e grava `estatais.json`. Para rodar na hora: GitHub → **Actions** → esse workflow → **Run workflow**. No próprio computador: `python scripts/coletar_estatais.py` (só a biblioteca padrão do Python).

Se o gov.br recusar o download (já aconteceu fora do Brasil e em redes com bloqueio), baixe à mão os arquivos **Dados Financeiros** e **Identificação das Empresas Estatais** da página de dados abertos da SEST, ponha os dois `.zip` numa pasta e rode `python scripts/coletar_estatais.py --zips PASTA`.

Confira: o total do último ano fechado deve ficar perto do que o Ministério da Gestão anuncia no relatório agregado das estatais (doc 06, "Conferência").

### Dados da aba Indústria

O workflow **Atualizar crescimento por segmento (Indústria)** (`.github/workflows/dados-industria.yml`) roda toda segunda-feira, porque as pesquisas do IBGE saem em datas diferentes ao longo do mês, e grava `industria.json` só quando algo mudou. Para rodar na hora: GitHub → **Actions** → esse workflow → **Run workflow**. No próprio computador: `python scripts/coletar_industria.py` (só a biblioteca padrão do Python).

A API do IBGE às vezes recusa conexões vindas de fora do Brasil, como as do GitHub Actions. Nesse caso o script avisa (alerta amarelo no Actions), mantém o `industria.json` atual e tenta de novo na semana seguinte. Para atualizar na hora, rode o script de um computador no Brasil, ou salve as respostas das consultas listadas em `CONSULTAS` (no script) como `PASTA/<chave>.json` e rode `python scripts/coletar_industria.py --cache PASTA`.

Confira: o crescimento do PIB e das categorias no último ano deve bater com o comunicado das Contas Nacionais do IBGE (2025: PIB +2,3%, agropecuária +11,7%).

### Dados da aba Leis e votação

O workflow **Atualizar votações da Câmara (Leis e votação)** (`.github/workflows/dados-votacoes.yml`) roda às quartas e aos sábados, baixa os arquivos anuais da Câmara de 2019 em diante e grava `votacoes.json` e `votos/AAAA.json` quando há votação nova. Para rodar na hora: GitHub → **Actions** → esse workflow → **Run workflow**. No próprio computador: `python scripts/coletar_votacoes.py` (só a biblioteca padrão do Python). Se a Câmara recusar a conexão, o script avisa e mantém os dados atuais.

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
