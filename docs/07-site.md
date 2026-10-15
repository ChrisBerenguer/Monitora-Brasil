# 07 · Site (painel web)

O painel é um **site estático**: HTML, CSS e JavaScript puros, sem etapa de build, sem servidor de aplicação e sem banco de dados. Tudo fica na pasta `site/` e pode ser hospedado em qualquer serviço que sirva arquivos (GitHub Pages, Netlify, Cloudflare Pages, Vercel, Apache/cPanel, Nginx, S3). Como publicar num domínio próprio está no [doc 10](10-publicacao.md).

## Estrutura

```
site/
├── index.html                  marcação das 4 abas, cabeçalho e rodapé
├── assets/
│   ├── css/styles.css          tokens de design (claro/escuro), layout e componentes
│   ├── js/app.js               aplicação: carga dos dados, cálculos, gráficos, interação
│   ├── js/d3.v7.9.0.min.js     biblioteca d3 (cópia local, ISC License)
│   └── favicon.svg
├── data/                       os 8 JSON gerados por scripts/build_dados.py
├── _headers                    cabeçalhos de cache e segurança (Netlify, Cloudflare Pages; na Vercel, ver vercel.json na raiz)
├── .htaccess                   o mesmo para Apache
├── .nojekyll                   impede o GitHub Pages de processar a pasta com Jekyll
└── robots.txt
```

Dependências externas em tempo de execução: só as fontes do Google Fonts (IBM Plex Sans, IBM Plex Mono e Source Serif 4). Se elas não carregarem, a página usa as fontes do sistema. A d3 é servida pelo próprio site.

## Como roda

1. O navegador carrega `index.html`, o CSS, a d3 e `app.js`.
2. `app.js` busca os 8 arquivos de `data/` em paralelo (`fetch`). São cerca de 4,2 MB sem compressão e menos de 1 MB com gzip/brotli, que as hospedagens aplicam automaticamente.
3. Monta índices em memória (`d3.group`) e faz três cálculos derivados (abaixo).
4. Desenha a aba atual. Trocar de aba ou de controle só redesenha, sem novas requisições.

**É preciso servir por HTTP.** Abrir `index.html` direto do disco (`file://`) não funciona, porque o navegador bloqueia o `fetch` de arquivos locais. Para testar localmente:

```bash
cd site
python -m http.server 8000
# abra http://localhost:8000
```

## Cálculos feitos no navegador

As mesmas fórmulas do [doc 03](03-metodologia.md), implementadas em `app.js`:

| Função | Entrada | Saída |
|---|---|---|
| `calcVariacaoEscores` | `escores.json` | Escore do último ano menos o escore dos anos-base 2000, 2010, 2015 e 2020, por país e tema |
| `calcRankingUltimo` | `escores.json` | Tabela com os seis escores de cada país no último ano |
| `calcVariacaoPeriodos` | `periodos.json` | Para cada par de mandatos (A < B), indicador e país: médias, `delta`, `delta_pct`, mediana e desvio de B, tendências de A e B |

Todos os outros números exibidos vêm diretamente dos JSON. Nenhum número está escrito no HTML.

## Abas

### Visão geral (`#visao`)
- **Resumo** no topo: escore geral, posição no ranking, temas mais forte e mais fraco do último ano.
- **Controles:** coorte de comparação e ano-base da variação.
- **6 cartões de tema:** escore no último ano, variação desde o ano-base (verde se subiu mais de 0,5, vermelho se caiu mais de 0,5), mediana da coorte e minigráfico de 2000 a 2025. **Clicar num cartão** muda o tema dos dois gráficos abaixo.
- **Escore ao longo do tempo:** Brasil contra a mediana da coorte, com a faixa do 1º ao 3º quartil.
- **O que puxa o escore:** percentil do Brasil em cada indicador do tema (verde ≥ 60, vermelho < 40), com um traço no ano-base.
- **Países comparados:** tabela ordenável dos 23 países, com cor de calor e botão **Baixar CSV**.

### Séries temporais (`#series`)
- Indicador, faixa da coorte, ano inicial e final, e botões de países (vários ao mesmo tempo).
- Gráfico de linhas com rótulo no fim de cada série e tooltip por ano. Botão **Baixar CSV** com as séries exibidas.
- **Comparar dois mandatos:** tabela com médias, variação absoluta e percentual (colorida pelo sentido do indicador), mediana e desvio do mandato B e tendências anuais.

### Coortes (`#coortes`)
- Indicador e ano (o padrão é o ano mais recente com dado para pelo menos 60% dos países).
- Box plots por coorte para o indicador e para o escore do tema escolhido, com o Brasil marcado.
- Tabela de tendência central e dispersão: n, média, mediana, desvio, quartis, mínimo, máximo, valor do Brasil e Z do Brasil.

### Metodologia (`#metodo`)
Resumo do cálculo, composição das coortes, limitações e a tabela dos 40 indicadores.

**Links diretos:** acrescente `#series`, `#coortes` ou `#metodo` ao endereço.

## Organização do `app.js`

| Bloco | Conteúdo |
|---|---|
| config | Arquivos de dados, temas, coortes, países, mandatos |
| estado | Objeto `st` com tudo o que o usuário escolheu (aba, coorte, ano-base, tema, indicador, países, anos, mandatos, ordenação) |
| utilidades | Formatação pt-BR (`f0`, `f1`, `f2`, `fmtv`, `sgn`), leitura de tokens CSS (`css`, `cor`) |
| tema claro/escuro | Botão do cabeçalho. A escolha fica no `localStorage` (`mb-tema`). Sem escolha, segue o sistema |
| tooltip | Um único elemento `#tip`, de posição fixa, que nunca sai da tela |
| CSV | `baixarCSV()`: separador `;` e vírgula decimal, com BOM UTF-8 para abrir certo no Excel |
| carga e índices | `carregar()` e os três cálculos derivados |
| componentes de gráfico | `lineChart`, `spark`, `boxPlot` |
| abas | `drawResumo`, `drawCartoes`, `drawEvolucao`, `drawDecomp`, `drawRanking`, `drawSeries`, `drawPeriodos`, `drawCoortes`, `drawMetodo` |
| navegação | `show(page)` com o hash da URL, `render()` e o `ResizeObserver`, que redesenha ao mudar a largura |

## Design

- **Tokens** em `:root` (`--bg`, `--panel`, `--fg`, `--muted`, `--line`, `--accent` etc.), com versão escura em `@media (prefers-color-scheme: dark)` e em `[data-theme="dark"]`. Todos os gráficos leem as cores dos tokens na hora de desenhar, então a troca de tema redesenha certo.
- **Paleta de séries** `--s0` a `--s7`. O Brasil é sempre `--s0` (verde), e os demais países seguem a ordem fixa da lista, então cada país mantém a mesma cor em todos os gráficos.
- **Tipografia:** Source Serif 4 no título e nos números grandes, IBM Plex Sans no texto, IBM Plex Mono em rótulos técnicos.
- **Responsivo:** grade de 6, 3 ou 2 cartões conforme a largura. Gráficos medem a largura do contêiner e redesenham. Colunas secundárias das tabelas (`.some-p`) somem abaixo de 640 px. Nos box plots, os nomes das coortes encurtam abaixo de 560 px.
- **Acessibilidade:** link "pular para o conteúdo", abas com `role="tab"`/`aria-selected`, foco visível, `aria-sort` nas tabelas e animação de carregamento desligada com `prefers-reduced-motion`.

## Como modificar

| Quero... | Onde |
|---|---|
| Mudar cores ou fontes | Tokens no topo de `styles.css` (e o link do Google Fonts em `index.html`) |
| Mudar textos fixos | `index.html` |
| Adicionar um indicador | `IND` em `scripts/build_dados.py` + `CODES` em `scripts/baixar_brutos.py`. Regere os dados. Os seletores do site se atualizam sozinhos a partir de `indicadores.json` |
| Adicionar uma coorte | `COHORTS` em `build_dados.py` + `COORTES` em `app.js` |
| Adicionar um país às séries | `COHORTS` (ou uma coorte nova) em `build_dados.py` + `PAIS` em `app.js` |
| Mudar os mandatos | `PERIODS` em `build_dados.py` + `PERIODOS` e `MANDATO` em `app.js` |

## Versão no Claude

Existe também uma versão do painel publicada como artifact do Claude (https://claude.ai/artifact/1VN97WbaUYChpm2aESA54X), feita antes deste site. Ela usa os mesmos dados, mas não é mantida junto com este repositório: a referência daqui em diante é a pasta `site/`.
