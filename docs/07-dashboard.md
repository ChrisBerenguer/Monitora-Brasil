# 07 · Dashboard

O dashboard está publicado como artifact do tipo **Dashboard** no Claude: https://claude.ai/artifact/1VN97WbaUYChpm2aESA54X. A página fica em `dashboard/index.html` e os dados em `dados/`.

## Arquitetura

```
┌─────────────────────────── Artifact "Dashboard" (Claude) ───────────────────────────┐
│  dash/meta              título                                                       │
│  datasets/<id>          8 fontes do tipo "arquivo" → JSON enviados ao artifact       │
│  files/index.html       a página (este repositório: dashboard/index.html)            │
│                                                                                      │
│  Em tempo de execução o tipo fornece:                                                │
│    dash.data(id)    → linhas de um conjunto de dados                                 │
│    dash.calc(...)   → cálculos derivados, visíveis no painel Fontes                  │
│    dash.onData(fn)  → redesenha quando dados ou largura mudam                        │
│    dash.setLink(id) → âncora da aba atual na URL                                     │
│    dash.colors      → paleta de séries (claro e escuro)                              │
│    d3 (v7)          → escalas, formas, eixos                                         │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

| Id do conjunto | Arquivo |
|---|---|
| `indicadores` | `dados/indicadores.json` |
| `series` | `dados/series.json` |
| `coortes` | `dados/coortes.json` |
| `periodos` | `dados/periodos.json` |
| `escores` | `dados/escores.json` |
| `escores_coortes` | `dados/escores_coortes.json` |
| `percentis_br` | `dados/percentis_brasil.json` |
| `ranking_br` | `dados/ranking_brasil.json` |

**Regra de rastreabilidade:** nenhum número está escrito no HTML. Todo número vem de um conjunto de dados ou de um `dash.calc` e é marcado com `data-source` / `data-field` / `data-where` (ou com `data-row-key` nas tabelas). Assim, clicar num número no modo Dados mostra de onde ele veio.

## Abas

### Visão geral (`#visao`)
- **Resumo:** frase com o escore geral, a posição no ranking e os temas mais forte e mais fraco do último ano.
- **Controles:** coorte de comparação e ano-base da variação (2000, 2010, 2015, 2020).
- **Cartões de tema (6):** escore do Brasil no último ano, variação desde o ano-base (verde se subiu mais de 0,5, vermelho se caiu mais de 0,5), mediana da coorte e minigráfico de 2000 a 2025 (Brasil em linha cheia, coorte tracejada, ano-base pontilhado). **Clicar num cartão** muda o tema dos dois gráficos abaixo.
- **Escore ao longo do tempo:** Brasil contra a mediana da coorte, com a faixa do 1º ao 3º quartil.
- **O que puxa o escore:** barras com o percentil do Brasil em cada indicador do tema (verde ≥ 60, vermelho < 40). O traço vertical mostra o percentil no ano-base.
- **Países comparados:** tabela com os 6 escores dos 23 países, ordenável por coluna e com cor de calor.

### Séries temporais (`#series`)
- **Controles:** indicador (agrupado por tema), faixa da coorte, ano inicial e final, e botões dos países (vários ao mesmo tempo).
- **Gráfico de linhas:** valores observados, com rótulo no fim de cada linha. Pontos isolados aparecem como círculos. Passar o mouse mostra os valores do ano.
- **Comparar dois mandatos:** escolha os mandatos A e B. A tabela mostra, para o Brasil e os países selecionados, as médias A e B, a variação absoluta e percentual (colorida pelo sentido do indicador), a mediana e o desvio de B e as tendências anuais.

### Coortes (`#coortes`)
- **Controles:** indicador e ano (o ano padrão é o mais recente com dado para pelo menos 60% dos países).
- **Distribuição por coorte:** box plots das 5 coortes com o Brasil marcado.
- **Escore por coorte:** box plots dos escores do tema escolhido no último ano.
- **Tabela de tendência central e dispersão:** n, média, mediana, desvio, quartis, mínimo, máximo, valor do Brasil e Z do Brasil.

### Metodologia (`#metodo`)
Resumo do cálculo, composição das coortes, limitações e a tabela de indicadores.

## Estado e interação

O estado da interface fica num objeto `st` no script (aba, coorte, ano-base, tema, indicador, países, anos, mandatos). Mudar um controle altera `st` e chama `render()`, que redesenha só a aba visível. Os controles não disparam novas consultas, porque todos os dados são arquivos carregados uma vez.

Links diretos para as abas: acrescente `#visao`, `#series`, `#coortes` ou `#metodo` ao endereço do dashboard.

## Componentes de gráfico (reutilizáveis)

| Função | O que desenha |
|---|---|
| `lineChart(box, {series, band, yfmt, xdomain})` | Linhas com faixa opcional, grade, rótulos finais sem sobreposição, régua e tooltip ao passar o mouse |
| `spark(box, a, b, base)` | Minigráfico de duas séries com marcação do ano-base |
| `boxPlot(box, rows, fmt)` | Box plots horizontais com média (losango), Brasil (ponto) e tooltip |

Todas as cores vêm de tokens do tema (`--color-*`, `--cds-chart-*`, `dash.colors`), o que garante legibilidade nos modos claro e escuro.

## Como modificar

1. Edite `dashboard/index.html`.
2. Peça ao Claude para publicar a nova versão no artifact (o arquivo vai para `files/index.html` no banco do artifact), ou use a ferramenta de dados do artifact (`ArtifactData`, operação `set` em `files/index.html` com `{text: <conteúdo>}`).
3. Para um novo indicador: inclua-o em `IND` no `scripts/build_dados.py` (código, nome, unidade, tema, sentido, fonte) e em `CODES` no `scripts/baixar_brutos.py`, regenere os dados e reenvie os JSON (doc 09). Os seletores do dashboard se atualizam sozinhos a partir de `indicadores.json`.
4. Para uma nova coorte: inclua-a em `COHORTS` no `build_dados.py` e em `COORTES` no `index.html`.
