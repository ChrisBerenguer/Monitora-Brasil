# 03 · Metodologia

Este documento descreve, passo a passo, como `scripts/build_dados.py` transforma as séries brutas nos conjuntos de dados do painel. As fórmulas e escolhas aqui são as que estão no código. Se mudar um, mude o outro.

## Visão do pipeline

```
 brutos/*.csv  (formato longo: geo, time, valor)
      │  1. filtro de países e anos
      ▼
 data[indicador][país][ano]
      │  2. indicadores derivados (patentes por milhão)
      ▼
      ├──► 3. séries observadas ───────────────► dados/series.json
      ├──► 4. estatísticas por coorte e ano ───► dados/coortes.json
      ├──► 5. estatísticas por mandato ────────► dados/periodos.json
      │
      │  6. imputação LOCF (≤ 5 anos), só para o escore
      │  7. transformação de sentido
      │  8. posto percentil global por ano
      ▼
 pct[indicador][ano][país] ──► dados/percentis_brasil.json
      │  9. média por tema (regra de cobertura)
      │ 10. escore geral (≥ 4 temas)
      ▼
 escore[país][tema][ano] ──► dados/escores.json, dados/escores_coortes.json
      │ 11. ranking anual
      ▼
 dados/ranking_brasil.json
```

## 1. Universo de países e anos

- **Países:** entidades do arquivo `countries.csv` marcadas como `is--country = TRUE` **e** `un_state = TRUE`, ou seja, Estados-membros da ONU. Agregados regionais (América Latina, Mundo, renda média) do Banco Mundial ficam de fora, porque misturá-los com países distorceria os percentis.
- **Anos lidos:** 1985–2025 (os anos anteriores a 1995 só servem para a imputação dos primeiros escores).
- **Anos exibidos nas séries:** 1995–2025.
- **Anos com escore:** 2000–2025.

## 2. Indicadores derivados

- **Patentes por milhão de habitantes** = `ip_pat_resd` (pedidos de residentes) ÷ `sp_pop_totl` (população) × 1.000.000, calculado apenas quando os dois existem no mesmo ano.

Os demais 39 indicadores entram como publicados pela fonte.

## 3. Séries observadas

Valores arredondados (2 casas decimais, ou inteiro se |x| ≥ 1000) para o Brasil e os 22 países de comparação. **Não há imputação nas séries**: lacunas aparecem como lacunas.

## 4. Estatísticas por coorte

Para cada indicador, coorte e ano, sobre os países da coorte **com dado observado naquele ano**:

| Campo | Fórmula |
|---|---|
| `n` | número de países com dado |
| `mean` | média aritmética |
| `median` | percentil 50 (interpolação linear) |
| `p25`, `p75` | percentis 25 e 75 (interpolação linear: posição p·(n−1)) |
| `sd` | desvio-padrão populacional (divide por n) |
| `min`, `max` | extremos |
| `brasil` | valor observado do Brasil no ano |
| `z_brasil` | (brasil − mean) / sd, quando sd > 0 |

O Brasil **não** é incluído nas coortes América Latina, BRICS e OCDE (é comparado contra elas). Ele **é** incluído nas coortes "renda média-alta" e "mundo", por pertencer a esses grupos.

### Composição das coortes

| Id | Nome | Membros |
|---|---|---|
| `latam` | América Latina | Argentina, Chile, Colômbia, México, Peru, Uruguai |
| `brics` | BRICS | China, Índia, Rússia, África do Sul (Brasil à parte) |
| `ocde` | OCDE (referência) | EUA, Alemanha, França, Reino Unido, Japão, Coreia do Sul, Canadá, Espanha, Itália, Austrália, Portugal, Polônia |
| `umic` | Renda média-alta | Todos os países classificados pelo Banco Mundial como *upper middle income* no arquivo de entidades |
| `mundo` | Mundo | Todos os Estados-membros da ONU com dado |

A coorte BRICS usa os membros originais (até 2023). A expansão de 2024–2025 (Egito, Etiópia, Irã, Emirados, Indonésia) não foi incluída para manter a comparabilidade histórica.

## 5. Estatísticas por mandato presidencial

Os períodos de comparação seguem os mandatos presidenciais brasileiros de quatro anos (posse em 1º de janeiro do ano seguinte à eleição):

| Período | Rótulo no painel |
|---|---|
| 1995–1998 | FHC 1 |
| 1999–2002 | FHC 2 |
| 2003–2006 | Lula 1 |
| 2007–2010 | Lula 2 |
| 2011–2014 | Dilma 1 |
| 2015–2018 | Dilma 2 / Temer (impeachment em agosto de 2016) |
| 2019–2022 | Bolsonaro |
| 2023–2026 | Lula 3 (dados até 2025) |

Para cada indicador, país e mandato, sobre os anos com dado observado: `n`, `media`, `mediana`, `desvio`, `min`, `max` e `tendencia_ano` (inclinação de mínimos quadrados, só com n ≥ 3; ver doc 02, B.6). Para os outros países, os mesmos intervalos de calendário são usados, sem relação com os mandatos deles.

**Cuidados de interpretação:**
- O mandato capta o período, não prova autoria. Indicadores têm defasagem (o resultado de um ano reflete decisões de anos anteriores) e choques externos (crise de 2008, pandemia de 2020, ciclo de commodities).
- Mandatos com menos anos de dado (2023–2026 tem até 3) têm médias menos estáveis.

A variação entre mandatos é calculada no próprio dashboard (`dash.calc('variacao_periodos')`): `delta = media_B − media_A` e `delta_pct = delta / |media_A| × 100`.

## 6. Imputação (somente para o escore)

```
valor_para_escore(país, ano) = primeiro valor encontrado em ano, ano−1, …, ano−5
                               ou "sem dado" se nenhum existir
```

## 7. Transformação de sentido

Antes de ordenar, cada valor é transformado para que **maior = melhor**:

| Sentido | Transformação | Indicadores |
|---|---|---|
| maior é melhor | x | PIB per capita, reservas, IDH, expectativa de vida etc. |
| menor é melhor | −x | dívidas, desemprego, Gini, pobreza, homicídios, CO₂ |
| alvo | −\|x − alvo\| | inflação (alvo 3), juros reais (alvo 2) |
| contexto | não entra | receita tributária, dependência de idosos |

Indicadores que entram no escore com sentido potencialmente discutível (e por quê):
- **Saldo em conta corrente (maior é melhor):** superávits grandes de exportadores de petróleo ficam bem posicionados. Foi mantido porque, para emergentes, déficits persistentes são a vulnerabilidade mais comum.
- **Abertura comercial e IED (maior é melhor):** países pequenos e centros financeiros têm valores naturalmente altos. O efeito é atenuado por serem 2 de 7 indicadores do tema.
- **Gasto em educação e saúde (maior é melhor):** mede esforço, não eficiência.

## 8. Posto percentil global

Para cada indicador e ano com **pelo menos 20 países** com dado:

1. Coletar os valores transformados de todos os países.
2. Ordenar do menor (pior) para o maior (melhor).
3. Atribuir a cada país *P = 100 · k / (n − 1)*, onde *k* é a posição (0 a n−1). Empates recebem a média das posições.

Resultado: 0 = pior país do mundo naquele ano, 100 = melhor, 50 = mediana.

## 9. Escore de tema

```
escore_tema(país, ano) = média( P[i][ano][país] para i nos indicadores do tema com dado )
                         somente se nº de indicadores com dado ≥ ⌈ nº de indicadores do tema / 2 ⌉
```

Pesos iguais para todos os indicadores do tema. Os temas têm números diferentes de indicadores (de 7 a 9), o que não afeta o escore do tema, já que é uma média.

## 10. Escore geral

```
escore_geral(país, ano) = média dos escores de tema disponíveis, se houver ≥ 4 dos 5
```

Pesos iguais entre temas.

## 11. Ranking

Todos os países com escore geral no ano são ordenados do maior para o menor. A posição do Brasil e o total de países vão para `ranking_brasil.json`.

## Arredondamentos

- Séries e estatísticas: 2 casas decimais (inteiro quando |x| ≥ 1000). Tendências: 3 casas.
- Escores e percentis: 1 casa decimal.
- O dashboard formata no padrão brasileiro (vírgula decimal).

## Robustez: o que muda o resultado

| Escolha | Efeito esperado se alterada |
|---|---|
| Limite de LOCF (5 anos) | Menor: mais países sem escore em anos recentes. Maior: escores mais "lentos". |
| Regra de cobertura (metade) | Mais rígida: menos países ranqueados. Mais frouxa: escores baseados em poucos indicadores. |
| Alvos de inflação e juros | Alvos mais altos favorecem emergentes com inflação estruturalmente maior. |
| Pesos iguais | Ponderar por correlação (PCA) daria mais peso aos blocos de indicadores redundantes (os 6 do WGI são muito correlacionados entre si). |
| Universo de países | Restringir a países com população > 1 milhão reduziria o peso de microestados. |

Uma análise de sensibilidade formal (variação do ranking do Brasil sob essas alternativas) está no roadmap (doc 08).
