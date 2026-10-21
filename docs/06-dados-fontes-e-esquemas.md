# 06 · Dados, fontes e esquemas

## Fontes primárias

| Fonte | Instituição | O que fornece | Licença |
|---|---|---|---|
| World Development Indicators (WDI) | Banco Mundial | 33 dos 40 indicadores (um deles, patentes por milhão, calculado com a população), mais população e classificação de renda | CC BY 4.0 |
| Worldwide Governance Indicators (WGI) | Banco Mundial | 6 indicadores de governança (distribuídos junto com o WDI) | CC BY 4.0 |
| Human Development Report | PNUD | IDH | CC BY 3.0 IGO |

Por trás do WDI estão produtores especializados: FMI (inflação, juros, balanço de pagamentos, finanças públicas), OIT (trabalho), UNESCO (P&D, educação), OMS/UNICEF (água, saneamento, saúde), UNODC (homicídios), União Interparlamentar (parlamento), OMPI (patentes), FAO (florestas), EDGAR/JRC (emissões) e a Poverty and Inequality Platform do próprio Banco Mundial (pobreza e Gini). A coluna "Fonte" em `dados/indicadores.json` registra o produtor original.

## Links oficiais de cada indicador

`scripts/fontes.py` guarda o código oficial de cada indicador e gera dois links, gravados em `indicadores.json` (`codigo_oficial`, `url_fonte`, `url_api`) e mostrados na aba Metodologia do site e no doc 04:

- **Página:** `https://data.worldbank.org/indicator/{CÓDIGO}` (para o WGI, a página do projeto; para o IDH, a central de dados do PNUD).
- **API:** `https://api.worldbank.org/v2/country/BRA/indicator/{CÓDIGO}?format=json&per_page=100`, já filtrada para o Brasil. Para os indicadores de governança, acrescente `&source=3`. Para outro país, troque `BRA` pelo código ISO3. Para todos os países, use `all`.

A aba Metodologia também lista as bases e APIs oficiais (Banco Mundial, WGI, PNUD, Poverty and Inequality Platform), os repositórios do espelho e os produtores originais de cada dado (FMI, OIT, UNESCO, OMPI, UIP, UNODC, OMS/UNICEF, ONU, EDGAR, FAO).

## Espelho usado

As APIs do Banco Mundial (`api.worldbank.org`) e do PNUD não estavam acessíveis no ambiente de construção. Por isso o projeto lê os espelhos em formato DDF mantidos pela Gapminder no GitHub, que reproduzem as bases oficiais:

| Repositório | Conteúdo |
|---|---|
| [`open-numbers/ddf--open_numbers--world_development_indicators`](https://github.com/open-numbers/ddf--open_numbers--world_development_indicators) | WDI e WGI completos (≈1.500 indicadores), um CSV por indicador em `datapoints/` |
| [`open-numbers/ddf--gapminder--systema_globalis`](https://github.com/open-numbers/ddf--gapminder--systema_globalis) | Compilação da Gapminder com IDH e outras séries |

Cada CSV tem três colunas: `geo` (código do país), `time` (ano) e o código do indicador. A versão usada na v1 tinha dados até 2025 para a maioria das séries.

**Para trocar pela API oficial** (recomendado quando houver acesso): `https://api.worldbank.org/v2/country/all/indicator/{CÓDIGO}?format=json&per_page=20000&date=1985:2025`. O código oficial de cada indicador está no doc 04.

## Arquivos brutos (`brutos/`, fora do git)

Gerados por `scripts/baixar_brutos.py`:
- `{codigo}.csv`: 40 séries do WDI. São 38 indicadores usados diretamente, mais `ip_pat_resd.csv` (pedidos de patente) e `sp_pop_totl.csv` (população), que formam o indicador derivado de patentes por milhão
- `countries.csv`: entidades de país, com classificação de renda (`income_groups`) e marcação de Estado-membro da ONU (`un_state`)
- `hdi.csv`: IDH

## Conjuntos de dados gerados (`dados/`)

Todos são arrays JSON de objetos (uma linha por objeto), em UTF-8. O pipeline grava uma cópia idêntica em `site/data/`, que é a que o site carrega.

### `indicadores.json` (40 linhas): metadados

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | texto | Código interno do indicador |
| `nome` | texto | Nome em português |
| `unidade` | texto | Unidade de medida |
| `tema` | texto | Id do macrotema |
| `direcao` | texto | Sentido no escore (ex.: "menor é melhor") |
| `fonte` | texto | Produtor original |
| `ultimo_ano` | inteiro | Último ano com dado para qualquer país |
| `entra_no_escore` | booleano | Falso para indicadores de contexto |
| `explicacao` | objeto | Texto para leigos usado no botão "i" do site: `o_que_e`, `como_ler`, `por_que_importa`, `atencao` (vem de `scripts/explicacoes.py`) |

### `series.json` (≈24 mil linhas): valores observados

| Campo | Tipo | Descrição |
|---|---|---|
| `ind` | texto | Código do indicador |
| `pais` | texto | Código ISO3 do país |
| `ano` | inteiro | 1995–2025 |
| `valor` | número | Valor publicado (sem imputação) |

### `coortes.json` (≈5,8 mil linhas): estatísticas por coorte

| Campo | Tipo | Descrição |
|---|---|---|
| `chave` | texto | `ind\|coorte\|ano` (identificador único da linha) |
| `ind`, `coorte`, `ano` | | Dimensões |
| `n` | inteiro | Países com dado |
| `mean`, `median`, `p25`, `p75`, `sd`, `min`, `max` | número | Estatísticas da coorte |
| `brasil` | número ou nulo | Valor do Brasil no ano |
| `z_brasil` | número ou nulo | Escore z do Brasil frente à coorte |
| `n_comp` | inteiro ou nulo | Países da coorte com dado, sem contar o Brasil |
| `n_supera` | número ou nulo | Quantos desses o Brasil supera, levando em conta o sentido do indicador (empates contam meio; nos indicadores de contexto, quantos estão abaixo do Brasil) |
| `pct_supera` | número ou nulo | `n_supera / n_comp × 100`. Alimenta a régua "Posição do Brasil em cada grupo" da aba Coortes |

### `periodos.json` (≈6,7 mil linhas): estatísticas por mandato

| Campo | Tipo | Descrição |
|---|---|---|
| `ind`, `pais` | texto | Dimensões |
| `periodo` | texto | Mandato, ex.: `2019–2022` |
| `n` | inteiro | Anos com dado no mandato |
| `media`, `mediana`, `desvio`, `min`, `max` | número | Estatísticas do mandato |
| `tendencia_ano` | número ou nulo | Inclinação de mínimos quadrados (n ≥ 3) |

### `escores.json` (≈3,6 mil linhas): escores por país

| Campo | Tipo | Descrição |
|---|---|---|
| `pais` | texto | 23 países do painel |
| `tema` | texto | `macro`, `prod`, `social`, `inst`, `bem` ou `geral` |
| `ano` | inteiro | 2000–2025 |
| `escore` | número | 0–100, 1 casa decimal |

### `escores_coortes.json` (780 linhas): distribuição dos escores por coorte

| Campo | Tipo | Descrição |
|---|---|---|
| `chave` | texto | `tema\|coorte\|ano` |
| `coorte`, `tema`, `ano` | | Dimensões |
| `n`, `media`, `mediana`, `p25`, `p75`, `desvio`, `min`, `max` | número | Estatísticas dos escores dos países da coorte |
| `n_comp` | inteiro ou nulo | Países da coorte com dado, sem contar o Brasil |
| `n_supera` | número ou nulo | Quantos desses o Brasil supera, no escore (empates contam meio) |
| `pct_supera` | número ou nulo | `n_supera / n_comp × 100`. Alimenta a régua "Posição do Brasil em cada grupo" da aba Coortes |

### `histogramas.json` (2.638 linhas): distribuição em faixas, para os histogramas

Gerado para as coortes grandes (`mundo` e `umic`), para cada indicador e ano com dado do Brasil, e para os escores de cada tema.

| Campo | Tipo | Descrição |
|---|---|---|
| `chave` | texto | `ind\|coorte\|ano`, ou `escore:<tema>\|coorte\|ano` para os escores |
| `ind`, `coorte`, `ano` | | Dimensões |
| `bins` | lista | Faixas `{de, ate, n}`: limites da faixa e número de países nela |
| `abre_esq`, `abre_dir` | lógico | Se a primeira (ou a última) faixa também inclui os valores extremos abaixo (ou acima) dela |
| `bin_brasil` | inteiro ou nulo | Índice da faixa onde o Brasil cai |

**Como as faixas são feitas.** Os indicadores usam 14 faixas de mesma largura entre o percentil 2 e o percentil 98 da coorte naquele ano; os poucos países fora desse intervalo entram na primeira ou na última faixa (por isso `abre_esq`/`abre_dir`). Isso impede que um único caso extremo, como uma hiperinflação, espremesse todos os outros países numa só barra. Os escores usam 10 faixas fixas de 0 a 100.

### `percentis_brasil.json` (≈970 linhas)

| Campo | Tipo | Descrição |
|---|---|---|
| `ind` | texto | Indicador que entra no escore |
| `ano` | inteiro | 2000–2025 |
| `percentil` | número | Posto percentil global do Brasil (0–100) |

### `ranking_brasil.json` (26 linhas)

| Campo | Tipo | Descrição |
|---|---|---|
| `ano` | inteiro | 2000–2025 |
| `posicao` | inteiro | Posição do Brasil no escore geral (1 = melhor) |
| `paises` | inteiro | Total de países com escore geral no ano |
| `pos_econ` | inteiro | Posição do Brasil por tamanho da economia, PIB total em US$ correntes (1 = maior economia do mundo) |
| `paises_econ` | inteiro | Total de países com PIB no ano |
| `pib_usd` | inteiro | PIB do Brasil no ano, em US$ correntes |

A posição por tamanho da economia usa `ny_gdp_mktp_cd` (PIB a preços de mercado, US$ correntes), baixado por `baixar_brutos.py` junto com as outras séries, restrito aos países membros da ONU — os mesmos usados no resto do painel. Essa série não entra nos 40 indicadores: serve só para esse ranking.

## Dados da aba Vida do Cidadão

Vêm de fontes fora do Banco Mundial e são coletados por `scripts/coletar_consumo.py`, que roda no GitHub Actions (workflow `dados-consumo.yml`, todo dia 12 e quando disparado à mão), porque precisa acessar os sites do governo. Gera `consumo.json`.

| Fonte | O que traz | Como é obtida |
|---|---|---|
| DIEESE, Pesquisa Nacional da Cesta Básica de Alimentos | Gasto mensal da cesta em cada capital | Ipeadata, série `CESBTOTAL` (mensal, por município) |
| ANP, Levantamento de Preços de Combustíveis | Preço médio de revenda no Brasil de gasolina comum, etanol hidratado, óleo diesel e GLP | Duas planilhas mensais da ANP: 2001–2012 e de janeiro de 2013 em diante |
| Salário mínimo | Valor nominal vigente em cada mês | Ipeadata, série `MTE12_SALMIN12` |
| IPCA (número-índice) | Correção dos preços | Ipeadata, série `PRECOS12_IPCA12` |
| IBGE, PNAD Contínua anual | Rendimento médio mensal real domiciliar per capita | SIDRA, tabela 7395, variável 4196 |

### `consumo.json`

| Campo | Descrição |
|---|---|
| `coletado_em` | Data da coleta |
| `base_ipca` | Mês mais recente do IPCA; é a base para corrigir os preços |
| `itens.<id>` | Um por item (`cesta`, `gasolina`, `etanol`, `diesel`, `gas`), com `titulo`, `unidade` e `pontos[]` |
| `itens.<id>.pontos[]` | `mes` (`AAAA-MM`), `v` (preço em reais da época), `real` (corrigido para `base_ipca`) e `sm` (quantas unidades um salário mínimo compra naquele mês) |
| `cesta_capitais` | Gasto da cesta por capital e mês, como vem do DIEESE |
| `salario_minimo[]` | `mes`, `v` (nominal) e `real` (corrigido), desde dezembro de 1994 |
| `renda_per_capita[]` | `ano` e `valor` (já em valores reais, como o IBGE publica) |
| `ipca[]` | `mes` e `indice` (número-índice do IPCA), desde dezembro de 1994, usado para calcular a inflação de cada mandato |

**Cesta básica do Brasil.** O DIEESE pesquisa capital por capital e não publica uma média nacional. O painel usa a **média simples das capitais pesquisadas no mês**, só para os meses com pelo menos 3 capitais, e guarda também a série de cada capital em `cesta_capitais`.

**Correção pela inflação.** `real = v × IPCA(base) ÷ IPCA(mês)`, com o IPCA do mês em que o preço foi medido. É o mesmo critério para preços e para o salário mínimo.

**Poder de compra (`sm`).** Salário mínimo vigente no mês dividido pelo preço do item. Para os meses em que o Ipeadata não traz o salário, repete-se o último valor conhecido (o salário muda uma vez por ano).

**Cobertura.** A cesta básica tem dados desde 1959, mas a aba começa em 2001 para acompanhar a série da ANP, que é mensal desde julho de 2001. A renda per capita da PNAD Contínua anual começa em 2016 e não tem 2020, porque a pandemia interrompeu a coleta.

## Cálculos feitos no navegador

Três conjuntos são derivados em `site/assets/js/app.js`:

| Função | Entrada | Saída |
|---|---|---|
| `calcVariacaoMandatos` | `escores` | Para cada país, tema e mandato: escore no fim do mandato menos o do ano anterior à posse |
| `calcRankingUltimo` | `escores` | Tabela larga com os seis escores de cada país no último ano |
| `calcVariacaoPeriodos` | `periodos` | Para cada par de mandatos (A < B), indicador e país: médias, `delta`, `delta_pct`, mediana e desvio de B, tendências de A e B |

## Atribuição exigida

Ao publicar números deste projeto, cite: *"Fonte: Banco Mundial (World Development Indicators e Worldwide Governance Indicators) e PNUD (IDH), via Gapminder/open-numbers. Cálculos: Monitora Brasil (github.com/ChrisBerenguer/Monitora-Brasil)."*
