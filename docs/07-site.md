# 07 · Site (painel web)

O painel é um **site estático**: HTML, CSS e JavaScript puros, sem etapa de build, sem servidor de aplicação e sem banco de dados. Tudo fica na pasta `site/` e pode ser hospedado em qualquer serviço que sirva arquivos (GitHub Pages, Netlify, Cloudflare Pages, Vercel, Apache/cPanel, Nginx, S3). Como publicar num domínio próprio está no [doc 10](10-publicacao.md).

## Estrutura

```
site/
├── index.html                  marcação das 6 abas, cabeçalho e rodapé
├── assets/
│   ├── css/styles.css          tokens de design (claro/escuro), layout e componentes
│   ├── js/app.js               aplicação: carga dos dados, cálculos, gráficos, interação
│   ├── js/d3.v7.9.0.min.js     biblioteca d3 (cópia local, ISC License)
│   ├── js/html-to-image.v1.11.11.min.js  gera a imagem de compartilhamento (cópia local, MIT License)
│   └── favicon.svg
├── data/                       os 9 JSON gerados por scripts/build_dados.py
├── _headers                    cabeçalhos de cache e segurança (Netlify, Cloudflare Pages; na Vercel, ver vercel.json na raiz)
├── .htaccess                   o mesmo para Apache
├── .nojekyll                   impede o GitHub Pages de processar a pasta com Jekyll
└── robots.txt
```

Dependências externas em tempo de execução: as fontes do Google Fonts (IBM Plex Sans, IBM Plex Mono e Source Serif 4) e o Google Analytics (tag `G-8GFHJSPY8T`, no início do `<head>`). Se as fontes não carregarem, a página usa as fontes do sistema. Se o Analytics for bloqueado (por um bloqueador de anúncios, por exemplo), o painel funciona normalmente. A d3 é servida pelo próprio site. Detalhes da política de segurança e do hash da tag em [doc 10](10-publicacao.md).

## Como roda

1. O navegador carrega `index.html`, o CSS, a d3 e `app.js`.
2. `app.js` busca os 9 arquivos de `data/` em paralelo (`fetch`). São cerca de 5,8 MB sem compressão e menos de 1 MB com gzip/brotli, que as hospedagens aplicam automaticamente.
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
| `calcVariacaoMandatos` | `escores.json` | Para cada país, tema e mandato: escore no último ano do mandato (ou no último ano com dado) menos o escore no ano anterior à posse. Os escores começam em 2000, então FHC 2 é medido de 2000 a 2002 |
| `calcRankingUltimo` | `escores.json` | Tabela com os seis escores de cada país no último ano |
| `calcVariacaoPeriodos` | `periodos.json` | Para cada par de mandatos (A < B), indicador e país: médias, `delta`, `delta_pct`, mediana e desvio de B, tendências de A e B |

Todos os outros números exibidos vêm diretamente dos JSON. Nenhum número está escrito no HTML.

## Abas

### Visão geral (`#visao`)
- **Resumo** no topo: escore geral, posição no ranking, temas mais forte e mais fraco do último ano.
- **Placar entre mandatos** (antes dos cartões de tema): para dois mandatos escolhidos (padrão: 2019–2022 e 2023–2026), conta em quantos indicadores cada um teve a média do Brasil melhor, levando em conta o sentido de cada indicador. Mostra dois cartões com os totais, 40 quadrados (um por indicador, com o nome e as duas médias ao passar o mouse) e uma legenda com empates, indicadores sem dado e indicadores só de contexto. Diferenças menores que 3% do desvio-padrão entre os países do mundo (mediana dos anos dos dois mandatos, de `coortes.json`) contam como empate (`EMPATE_SD` em `app.js`). O rodapé traz o placar sem essa regra. Médias de `periodos.json`; função `calcPlacar`.
- **Controles:** coorte de comparação e **mandato presidencial** (intervalos de 4 anos, de FHC 2, 1999–2002, até Lula 3, 2023–2026).
- **6 cartões de tema:** escore no último ano, **variação no mandato escolhido** (escore no fim do mandato menos o do ano anterior à posse; verde se subiu mais de 0,5, vermelho se caiu mais de 0,5; passar o mouse mostra os dois valores), mediana da coorte e minigráfico de 2000 a 2025 com o mandato sombreado. **Clicar num cartão** muda o tema dos dois gráficos abaixo.
- **Escore ao longo do tempo:** Brasil contra a mediana da coorte, com a faixa do 1º ao 3º quartil e o mandato escolhido destacado em verde.
- **O que puxa o escore:** percentil do Brasil em cada indicador do tema no último ano do mandato escolhido (verde ≥ 60, vermelho < 40), com um traço no ano anterior à posse.
- **Países comparados:** tabela ordenável dos 23 países, com cor de calor e botão **Baixar CSV**.

### Séries temporais (`#series`)
- Indicador, faixa da coorte, ano inicial e final, e botões de países (vários ao mesmo tempo).
- Gráfico de linhas com rótulo no fim de cada série e tooltip por ano. Botão **Baixar CSV** com as séries exibidas.
- **Botão "i"** à direita do rótulo "Indicador" e do título do gráfico (ver "Explicações para leigos" abaixo).
- **Comparar dois mandatos:** tabela com médias, variação absoluta e percentual (colorida pelo sentido do indicador), mediana e desvio do mandato B e tendências anuais. Cada coluna tem um "i" que explica o que ela mede e como ler, com um exemplo calculado na hora com os números do Brasil para o indicador e os mandatos escolhidos. Quando o indicador já é uma porcentagem, a coluna se chama **Variação (p.p.)**, de pontos percentuais.

### Coortes (`#coortes`)
- Indicador e ano (o padrão é o ano mais recente com dado para pelo menos 60% dos países). O rótulo "Indicador" e o título têm o botão "i", e uma linha abaixo do título diz o sentido do indicador ("maior é melhor", "menor é melhor"...).
- **Posição do Brasil em cada grupo:** uma régua por coorte com a parcela de países que o Brasil supera e a frase "Supera X de N países (P%)". A barra fica verde a partir de 60%, vermelha abaixo de 40% e neutra no meio. Nos indicadores de contexto, a frase vira "Acima de X de N" e a barra fica neutra. Dados: `pct_supera`, `n_supera`, `n_comp` de `coortes.json`.
- **Posição do Brasil ao longo do tempo:** uma linha por coorte com a parcela de países que o Brasil supera, ano a ano, entre os anos **De** e **Até** (padrão: 2000 a 2025). Eixo fixo de 0% a 100%, linha tracejada em 50% e faixas alternadas com os mandatos presidenciais. Em telas largas, cada linha tem o nome e o último valor no fim; nas estreitas, uma legenda embaixo. Cada linha é o Brasil comparado com um grupo (por isso os nomes "vs. Am. Latina", "vs. BRICS"...), e a caixa ao passar o mouse mostra o valor do Brasil no ano. Dados: `pct_supera` de `coortes.json`, para todos os anos.
- **Os países de cada grupo:** gráfico de pontos com América Latina, BRICS e OCDE, um país por ponto, todos na mesma escala, com nome em cima e o Brasil em verde repetido em cada linha. Quando os nomes se encostam, sobem para uma camada de cima, ligados ao ponto por um traço. Valores de `series.json`.
- **Histogramas** do Mundo e da renda média-alta: quantos países caem em cada faixa de valor, com a faixa do Brasil em verde. Dados de `histogramas.json`.
- **Escore por grupo** (tema escolhido, último ano): a mesma régua e o mesmo gráfico de pontos, com os escores.
- **Estatísticas de cada grupo:** tabela com n, média, mediana, desvio, quartis, mínimo, máximo, valor do Brasil e Z do Brasil. O **box plot** fica atrás do botão "Ver box plot", para quem quiser ver os quartis desenhados.

### Vida do Cidadão (`#vida`)
Quanto custa viver, comparado com a renda de quem vive aqui. Cinco cartões:
- **Quanto custa hoje:** um bloco por item (cesta básica, gasolina, etanol, diesel e gás de cozinha) com o preço mais recente, a variação em 12 meses já descontada a inflação (verde quando o item ficou mais barato que a inflação) e quantas unidades um salário mínimo compra.
  - Dentro do mesmo cartão, **Médias por mandato presidencial**: seletores de mandato A e B (como na aba Séries temporais) e uma tabela com a média de cada item nos dois mandatos, a variação em reais e em %, e quanto um salário mínimo comprava em média em cada um. Todas as médias são corrigidas pela inflação. Mandatos cuja série não é coberta por inteiro aparecem marcados como "série parcial" (a cesta básica começa em 2001 e os combustíveis em julho de 2001). Funções `mediaMandato` e `desenharMandatos`.
- **Preço ao longo do tempo:** gráfico mensal do item escolhido, com faixas de mandato, seletor de ano inicial e a opção **"Corrigir pela inflação, em preços de hoje"**, ligada por padrão.
- **Quanto um salário mínimo compra:** a mesma série convertida em unidades por salário mínimo, que é a medida direta de poder de compra.
- **Renda e salário mínimo:** barras com o rendimento domiciliar per capita (PNAD Contínua anual) e linha do salário mínimo mensal corrigido pela inflação.
- **Salário mínimo acima da inflação:** por mandato, o aumento do salário mínimo, a inflação (IPCA) do mesmo período e o ganho real, em barras (verde quando o salário subiu mais que a inflação) e numa tabela que traz também o poder de compra acumulado, com 100 no início da série. Compara dezembro anterior à posse com o fim do mandato; o mandato em curso vai até o último mês com dado. Funções `ganhoMandato` e `desenharGanho`.

Os gráficos mensais usam `lineChart` com a opção `mensal: true`, que faz a caixa de valores pegar o ponto mais próximo do cursor em vez de casar com o ano inteiro. Dados em `consumo.json` (doc 06); a coleta é automática (doc 09). O identificador da aba é `vida`, e `APELIDOS` no `app.js` mantém o endereço antigo `#consumo` funcionando.

### Onde votar (`#votar`)
Serviço ao eleitor: botão que abre o Autoatendimento Eleitoral do TSE numa nova aba, com o passo a passo para chegar a **Consultas → Onde votar**, as alternativas (aplicativo e-Título e atendimento presencial) e um aviso de data que só aparece até o 2º turno de 2026 (25/10). O site não recebe nenhum dado do eleitor: a consulta é feita no site oficial. O endereço do TSE fica no `index.html`.

O TSE não oferece um endereço que abra a consulta "Onde votar" já selecionada; o parâmetro `id` do link é só um número de controle do site deles. Por isso a aba orienta o caminho no menu.

### Metodologia (`#metodo`)
Resumo do cálculo, composição das coortes, limitações e a tabela dos 40 indicadores.

### Explicações para leigos (botão "i")

Todo lugar em que aparece o nome de um indicador tem um "i" à direita:

| Onde | O "i" explica |
|---|---|
| Visão geral → "O que puxa o escore" | Cada indicador da lista de barras |
| Séries temporais → rótulo "Indicador" e título do gráfico | O indicador selecionado |
| Coortes → rótulo "Indicador" e título do gráfico | O indicador selecionado |
| Visão geral → Placar entre mandatos | O que o placar conta, como se decide o melhor, a regra de empate e os cuidados de interpretação |
| Visão geral → cada cartão de tema, "Escore ao longo do tempo", "O que puxa o escore" e "Países comparados" | O que o cartão mostra e como ler. No cartão de tema, também quais indicadores compõem o tema, a variação no mandato, a mediana e o minigráfico |
| Séries temporais → cabeçalho de cada coluna da tabela "Comparar dois mandatos" | O que a coluna mede, como ler, cuidados e um exemplo com os números do Brasil |
| Coortes → título de cada cartão (posição do Brasil, posição ao longo do tempo, países de cada grupo, os dois histogramas, escore por grupo e estatísticas) | O que o gráfico mostra, como ler, por que importa e um cuidado de interpretação |
| Metodologia → tabela de indicadores | Cada indicador da tabela |

A explicação aparece **ao passar o mouse** e some ao tirar o mouse. Ela tem quatro partes em linguagem simples (o que é, como ler, por que importa e atenção) e o último dado do Brasil, com o valor do primeiro ano da série para comparação. Os textos dos indicadores vêm de `scripts/explicacoes.py` (campo `explicacao` de `indicadores.json`). Os textos dos cartões da aba Coortes e das colunas da tabela de mandatos ficam em `CARD_INFO`, no `app.js`, e são ligados aos botões com o atributo `data-info-card` do `index.html`.

Outras formas de abrir:
- **Clique:** fixa a explicação aberta. Clicar de novo no "i", clicar fora ou apertar Esc fecha.
- **Celular:** um toque abre e outro toque (no "i", na explicação ou fora) fecha.
- **Teclado:** o "i" recebe foco com Tab e a explicação aparece. Esc fecha.

### Fonte original (ícone de link)

Todo cartão com gráfico ou tabela de dados tem, ao lado do título, um ícone de link (o `link-45deg` do Bootstrap Icons). Ele abre uma caixa com a fonte original dos dados daquele cartão:

| Cartão | A caixa mostra |
|---|---|
| Gráficos e tabelas de um indicador (Séries temporais e Coortes) | O nome e o produtor do dado, links para a página do indicador e para os dados do Brasil pela API, e o código oficial |
| Escore de um tema (cartões da Visão geral, "Escore ao longo do tempo", "O que puxa o escore", "Escore por grupo") | A lista dos indicadores do tema, cada um com link para a sua página |
| Escore geral e "Países comparados" | As três bases (WDI, WGI e Relatório de Desenvolvimento Humano), com link |

A caixa abre ao passar o mouse e continua aberta enquanto o mouse vai até ela, para dar tempo de clicar nos links. Clique ou toque fixa a caixa; tocar num link abre a fonte numa nova aba. No fim da caixa, um link leva à aba Metodologia, com a lista completa. Os links vêm de `scripts/fontes.py` (campos `url_fonte` e `url_api` de `indicadores.json`) e da constante `BASES` do `app.js`.

### Compartilhar (imagem do gráfico)

Todo cartão com gráfico ou tabela (Visão geral, Séries temporais e Coortes) tem um botão de compartilhar ao lado do título. Ele gera, no próprio navegador e sem servidor, uma imagem PNG com:

- a marca Monitora Brasil e a data;
- o título do cartão e uma linha com as escolhas da tela (indicador, anos, mandatos, grupo);
- o gráfico ou a tabela como estão na tela, sem botões nem menus;
- a fonte dos dados e o endereço do site no rodapé (o domínio em que o site estiver publicado, lido do próprio navegador).

A caixa que se abre mostra a prévia e oferece **Compartilhar…** (no celular, abre o menu do aparelho com WhatsApp, Instagram, LinkedIn etc.), **Baixar imagem**, **Copiar imagem** e **Copiar link**, conforme o navegador permita. A imagem sai em resolução dupla e no tema que estiver ativo (claro ou escuro).

Como funciona: `gerarImagem` monta fora da tela um quadro com uma cópia do cartão, e a biblioteca html-to-image (servida pelo próprio site) converte esse quadro em PNG. Para que as fontes do Google entrem na imagem, a política de segurança (CSP) libera `fonts.googleapis.com` e `fonts.gstatic.com` em `connect-src`; se forem bloqueadas, a imagem usa as fontes do sistema. Textos que só fazem sentido na tela ("passe o mouse...") ficam em elementos com a classe `so-tela` e não entram na imagem. O atributo `data-ctx` do cartão controla a linha de escolhas (`proprio`: só os controles do cartão; `nenhum`: sem a linha).

**Links diretos:** acrescente `#series`, `#coortes`, `#metodo`, `#vida` ou `#votar` ao endereço (o antigo `#consumo` continua funcionando).

## Organização do `app.js`

| Bloco | Conteúdo |
|---|---|
| config | Arquivos de dados, temas, coortes, países, mandatos |
| estado | Objeto `st` com tudo o que o usuário escolheu (aba, coorte, mandato da Visão geral, tema, indicador, países, anos, mandatos comparados, ordenação) |
| utilidades | Formatação pt-BR (`f0`, `f1`, `f2`, `fmtv`, `sgn`), leitura de tokens CSS (`css`, `cor`) |
| tema claro/escuro | Botão do cabeçalho. A escolha fica no `localStorage` (`mb-tema`). Sem escolha, segue o sistema |
| tooltip | Um único elemento `#tip`, de posição fixa, que nunca sai da tela |
| CSV | `baixarCSV()`: separador `;` e vírgula decimal, com BOM UTF-8 para abrir certo no Excel |
| carga e índices | `carregar()` e os três cálculos derivados |
| componentes de gráfico | `lineChart` (com opções de eixo fixo, linha de referência, faixas de mandato, legenda e séries mensais), `spark`, `boxPlot`, `barras`, `regua`, `pontosPorGrupo`, `histograma` |
| abas | `drawResumo`, `drawCartoes`, `drawEvolucao`, `drawDecomp`, `drawRanking`, `drawSeries`, `drawPeriodos`, `drawCoortes`, `drawMetodo` |
| navegação | `show(page)` com o hash da URL, `render()` e o `ResizeObserver`, que redesenha ao mudar a largura |

## Design

- **Tokens** em `:root` (`--bg`, `--panel`, `--fg`, `--muted`, `--line`, `--accent` etc.), com versão escura em `@media (prefers-color-scheme: dark)` e em `[data-theme="dark"]`. Todos os gráficos leem as cores dos tokens na hora de desenhar, então a troca de tema redesenha certo.
- **Paleta de séries** `--s0` a `--s7`. O Brasil é sempre `--s0` (verde), e os demais países seguem a ordem fixa da lista, então cada país mantém a mesma cor em todos os gráficos.
- **Tipografia:** Source Serif 4 no título e nos números grandes, IBM Plex Sans no texto, IBM Plex Mono em rótulos técnicos.
- **Responsivo:** grade de 6, 3 ou 2 cartões conforme a largura. Gráficos medem a largura do contêiner e redesenham. Colunas secundárias das tabelas (`.some-p`) somem abaixo de 640 px. Nos box plots, os nomes das coortes encurtam abaixo de 560 px. Na régua de posição, nome, barra e frase ficam empilhados abaixo de 640 px.
- **Acessibilidade:** link "pular para o conteúdo", abas com `role="tab"`/`aria-selected`, foco visível, `aria-sort` nas tabelas e animação de carregamento desligada com `prefers-reduced-motion`.

## Como modificar

| Quero... | Onde |
|---|---|
| Mudar cores ou fontes | Tokens no topo de `styles.css` (e o link do Google Fonts em `index.html`) |
| Mudar textos fixos | `index.html` |
| Mudar a explicação de um cartão da aba Coortes | `CARD_INFO` em `app.js` |
| Mudar a explicação de um indicador (botão "i") | `scripts/explicacoes.py`, depois rode `build_dados.py` (o texto vai para `indicadores.json`) e `gerar_dicionario.py` |
| Adicionar um indicador | `IND` em `scripts/build_dados.py` + `CODES` em `scripts/baixar_brutos.py`. Regere os dados. Os seletores do site se atualizam sozinhos a partir de `indicadores.json` |
| Adicionar uma coorte | `COHORTS` em `build_dados.py` + `COORTES` em `app.js` |
| Adicionar um país às séries | `COHORTS` (ou uma coorte nova) em `build_dados.py` + `PAIS` em `app.js` |
| Mudar os mandatos | `PERIODS` em `build_dados.py` + `PERIODOS` e `MANDATO` em `app.js` |

## Versão no Claude

Existe também uma versão do painel publicada como artifact do Claude (https://claude.ai/artifact/1VN97WbaUYChpm2aESA54X), feita antes deste site. Ela usa os mesmos dados, mas não é mantida junto com este repositório: a referência daqui em diante é a pasta `site/`.
