# Histórico de versões

## 1.24 — 21/10/2026

### Corrigido
- **Eixo dos anos:** o último ano da série passa a aparecer sempre na régua. Antes, num gráfico de 2000 a 2025 a régua parava em 2024 e dava a impressão de que os dados acabavam ali.

### Alterado
- O texto do cartão de posição agora diz qual é o último ano fechado e traz a projeção do FMI para o ano corrente — hoje, a 10ª posição em 2026, com US$ 2,65 trilhões.

## 1.23 — 21/10/2026

### Alterado
- No gráfico de tamanho da economia, os anos observados ficam em linha cheia e as projeções do FMI em linha tracejada, com legenda.

## 1.22 — 21/10/2026

### Alterado
- **"Posição do Brasil entre as economias do mundo":** no lugar da posição em PIB per capita, o cartão passa a mostrar a **posição entre as maiores economias do mundo por PIB nominal**, que é o ranking das manchetes: os países em ordem do PIB em dólares correntes, da maior (1ª) para a menor.
- As duas filas agora aparecem em **gráficos separados**, porque as escalas são muito diferentes: na mesma escala do escore geral, a linha da economia ficava achatada no topo e não dava para ver nada.

### Adicionado
- **`economias.json`**, com o ranking por PIB nominal desde 1995, o PIB do Brasil em dólares a cada ano e as 15 maiores economias de cada ano. Vem da série NGDPD do *World Economic Outlook* do FMI, coletada por `scripts/coletar_economias.py` no workflow `dados-economias.yml` (todo dia 14). O último ano é projeção do FMI e aparece marcado como tal.
- O botão de fonte do cartão passa a apontar para o FMI e para o Banco Mundial, as duas bases que o cartão usa.

## 1.21 — 21/10/2026

### Adicionado
- **Visão geral: "Posição do Brasil entre as economias do mundo"**, antes do placar dos 40 indicadores. Mostra em que lugar o Brasil fica quando todos os países são postos em fila, por escore geral e por PIB per capita, com o eixo invertido e faixas de mandato, e uma tabela com as posições ganhas ou perdidas em cada mandato. O "i" avisa que o número de países muda de ano para ano, o que por si só mexe na posição.

## 1.20 — 20/10/2026

### Alterado
- **Médias por mandato presidencial:** o verde e o vermelho saíram das colunas de variação e foram para as duas colunas de "1 salário mínimo", que mostram o poder de compra. Verde marca o mandato em que um salário mínimo comprava mais daquele item. A comparação usa o número já arredondado, então a cor nunca contradiz o que está escrito, e quando os dois mandatos mostram o mesmo número nenhum fica colorido.
- Em telas estreitas, a tabela passa a esconder a coluna "Variação" em reais, no lugar das colunas de poder de compra, que agora carregam a cor.

## 1.19 — 20/10/2026

### Alterado
- A aba **Consumo básico** passou a se chamar **Vida do Cidadão**. O endereço antigo (`#consumo`) continua funcionando.

### Adicionado
- **Cartão "Salário mínimo acima da inflação":** por mandato, o aumento do salário mínimo, a inflação do mesmo período e o ganho real, em barras e em tabela. A tabela traz ainda o poder de compra acumulado do salário mínimo, com 100 no início da série. Cobre de FHC 1 a Lula 3.
- `consumo.json` ganhou o número-índice do IPCA, e as séries do IPCA e do salário mínimo passaram a começar em dezembro de 1994, para alcançar os mandatos anteriores a 2001.

## 1.18 — 20/10/2026

### Adicionado
- **Consumo básico: médias por mandato presidencial** dentro do cartão "Quanto custa hoje", com seletores de mandato A e B, como na aba Séries temporais. A tabela mostra o preço médio de cada item nos dois mandatos (corrigido pela inflação), a variação em reais e em %, e quanto um salário mínimo comprava em média em cada mandato. Em preço, cair é melhor: a variação aparece em verde quando o item ficou mais barato. Mandatos sem a série inteira são marcados como "série parcial", e a nota avisa quando o mandato B ainda está em curso.

## 1.17 — 20/10/2026

### Adicionado
- **Aba "Consumo básico"** (`#consumo`): cesta básica, gasolina, etanol, óleo diesel e gás de cozinha, comparados com a renda das pessoas.
  - **Quanto custa hoje:** preço mais recente de cada item, variação em 12 meses já descontada a inflação e quanto um salário mínimo compra.
  - **Preço ao longo do tempo:** série mensal desde 2001, com faixas de mandato e a opção de corrigir pela inflação (ligada por padrão).
  - **Quanto um salário mínimo compra:** a mesma série em cestas, litros ou botijões por salário mínimo.
  - **Renda e salário mínimo:** rendimento domiciliar per capita (PNAD Contínua) e salário mínimo real mês a mês.
- `scripts/coletar_consumo.py` e o workflow `dados-consumo.yml` (coleta automática todo dia 12). Fontes: DIEESE (cesta básica), ANP (combustíveis), IBGE (PNAD Contínua e IPCA) e Ipeadata.
- `lineChart` ganhou a opção `mensal`, para séries mês a mês, e voltou o componente `barras`.
- Em telas estreitas, as barras escondem o rótulo do valor quando ele não cabe; o número aparece ao tocar.

## 1.16 — 19/10/2026

### Alterado
- O placar entre mandatos voltou a comparar a **média do valor** de cada indicador, com a regra de empate por desvio-padrão da versão 1.12. A comparação por percentil (versão 1.15) foi desfeita.

## 1.14 — 19/10/2026

### Adicionado
- **Aba "Onde votar"** (`#votar`): botão para o Autoatendimento Eleitoral do TSE (abre numa nova aba), passo a passo até Consultas → Onde votar, alternativas (app e-Título e atendimento presencial) e aviso do 2º turno de 25/10/2026, que some depois da data. O site não coleta nenhum dado do eleitor.

## 1.13.1 — 18/10/2026

### Corrigido
- **Compartilhar no celular:** tocar em "Baixar imagem", "Copiar imagem" ou "Copiar link" fechava a caixa antes de a ação acontecer. Agora toques em botões dentro da caixa não a fecham.
- **Prévia em branco:** a prévia da imagem não aparecia porque a política de segurança não libera endereços `blob:`. A prévia e o download agora usam `data:`.
- A caixa de compartilhar se reposiciona quando a prévia carrega e ganha rolagem se não couber na tela; antes os botões podiam ficar fora da tela no celular.
- CSP: `font-src` aceita `data:`, para as fontes embutidas na imagem gerada.

## 1.13 — 18/10/2026

### Adicionado
- **Botão de compartilhar em cada cartão com gráfico ou tabela.** Gera no navegador, sem servidor, uma imagem PNG com a marca, a data, o título, as escolhas da tela, o gráfico como está na tela, a fonte dos dados e o endereço do site. A caixa mostra a prévia e oferece Compartilhar… (menu do celular), Baixar imagem, Copiar imagem e Copiar link.
- Biblioteca html-to-image 1.11.11 (MIT), servida pelo próprio site em `assets/js/`.

### Alterado
- CSP: `connect-src` libera `fonts.googleapis.com` e `fonts.gstatic.com`, para embutir as fontes na imagem (em `vercel.json`, `site/_headers`, `site/.htaccess` e no exemplo de Nginx).

## 1.12 — 17/10/2026

### Adicionado
- **Visão geral: Placar entre mandatos**, antes dos cartões de tema. Para dois mandatos escolhidos, mostra em quantos indicadores cada um teve a média do Brasil melhor, com dois cartões de totais, um quadrado por indicador (com o nome e as duas médias ao passar o mouse), legenda e o placar sem a regra de empate. Tem "i" com a explicação e o ícone de fonte.
- Regra de empate explícita: diferença menor que 3% do desvio-padrão entre os países do mundo no indicador. Para 2019–2022 contra 2023–2026, o resultado é 7 a 21, com 9 empates, 1 sem dado e 2 só de contexto.

## 1.11 — 16/10/2026

### Adicionado
- **Visão geral: botão "i" em cada cartão.** Nos seis cartões de tema, a explicação diz quais indicadores compõem o tema e como ler o número, a variação no mandato, a mediana do grupo e o minigráfico. "Escore ao longo do tempo", "O que puxa o escore" e "Países comparados" também ganharam o "i", ao lado do ícone de fonte.

## 1.10 — 16/10/2026

### Adicionado
- **Ícone de link com a fonte original em cada cartão com gráfico ou tabela de dados** (Visão geral, Séries temporais e Coortes). Nos cartões de um indicador, a caixa traz a página do indicador, os dados do Brasil pela API e o código oficial. Nos de escore, a lista dos indicadores do tema com o link de cada um. No escore geral e no ranking, as três bases oficiais.
- A caixa de explicação continua aberta enquanto o mouse vai do ícone até ela, para que os links possam ser clicados. No celular, tocar num link não fecha a caixa antes de abrir a fonte.

### Alterado
- Os cartões de tema da Visão geral deixaram de ser botões HTML (para poder conter o ícone de link). Continuam clicáveis e acessíveis pelo teclado (Tab, Enter ou espaço).

## 1.9 — 15/10/2026

### Adicionado
- **Séries temporais: "i" em cada coluna da tabela "Comparar dois mandatos"** (País, Média A/B, Variação, Variação %, Mediana B, Desvio B, Tendência A/B). Cada explicação diz o que a coluna mede, como ler e os cuidados, e traz um exemplo calculado com os números do Brasil para o indicador e os mandatos escolhidos (ex.: "−5,10 ÷ 12,01 = −42,5%").
- Glossário (doc 05): Variação, Variação %, pontos percentuais e Tendência.

### Alterado
- Quando o indicador já é uma porcentagem, a coluna "Variação" passa a se chamar "Variação (p.p.)", de pontos percentuais, para não ser confundida com a Variação %.

## 1.8.1 — 15/10/2026

### Alterado
- Coortes: ficou explícito que o Brasil é a referência de cada barra e de cada linha, e não uma linha à parte. As linhas de "Posição do Brasil ao longo do tempo" agora se chamam "vs. Am. Latina", "vs. BRICS" etc., o texto do cartão e o "i" explicam a leitura, e a caixa ao passar o mouse mostra o valor do Brasil no ano (ex.: "2003 · Brasil: 14,71% a.a.").
- A linha abaixo do título do indicador mostra o valor do Brasil no ano escolhido.

## 1.8 — 15/10/2026

### Adicionado
- **Coortes: "Posição do Brasil ao longo do tempo".** Gráfico de linhas com a porcentagem de países de cada grupo que o Brasil supera no indicador escolhido, ano a ano, com seletores **De** e **Até**. Linha de referência em 50% e faixas com os mandatos presidenciais. O "i" do cartão explica como ler e os cuidados (posição relativa, grupos pequenos oscilam muito, número de países varia por ano, coincidência com mandato não prova causa).
- `lineChart` ganhou as opções `ydomain`, `ref`, `faixas` e `legenda`.

## 1.7 — 15/10/2026

### Adicionado
- **Botão "i" em cada cartão da aba Coortes**, com explicação para leigos do que o gráfico mostra, como ler, por que importa e um cuidado de interpretação: posição do Brasil em cada grupo, países de cada grupo, os dois histogramas, escore por grupo (e suas duas partes) e estatísticas de cada grupo (com o significado de média, mediana, desvio, quartis, Z do Brasil e do box plot). Funciona como o "i" dos indicadores: ao passar o mouse, com um toque no celular ou com Tab.

## 1.6 — 15/10/2026

### Alterado
- **Aba Coortes redesenhada** para ser lida sem conhecer box plot:
  - **Posição do Brasil em cada grupo:** régua por coorte com a frase "Supera X de N países (P%)", que leva em conta se é melhor ter valor alto ou baixo.
  - **Os países de cada grupo:** gráfico de pontos com o nome de cada país da América Latina, dos BRICS e da OCDE, e o Brasil em verde.
  - **Histogramas** do Mundo e dos países de renda média-alta, com a faixa do Brasil em destaque.
  - O escore por tema ganhou a mesma régua e o mesmo gráfico de pontos.
  - O box plot continua disponível no botão "Ver box plot", junto da tabela de estatísticas.

### Adicionado
- `coortes.json` e `escores_coortes.json` ganharam `n_comp`, `n_supera` e `pct_supera`.
- Novo `histogramas.json` (faixas por coorte grande, indicador e ano, e por tema nos escores). Esquema e regra das faixas no doc 06.
- Glossário (doc 05): parcela superada e histograma.

## 1.5 — 15/10/2026

### Adicionado
- **Google Analytics** (tag `G-8GFHJSPY8T`) no início do `<head>` do site.
- Política de segurança (CSP) ajustada em `vercel.json`, `site/_headers`, `site/.htaccess` e no exemplo de Nginx: libera os domínios do Google Analytics e o trecho de configuração da tag pela impressão digital (hash `sha256`), sem `'unsafe-inline'`. O `docs/10` explica como recalcular o hash se o trecho mudar e traz uma recomendação sobre a LGPD.

## 1.4 — 15/10/2026

### Alterado
- **Visão geral: o seletor "Variação desde" virou "Variação no mandato".** As opções são os mandatos presidenciais de 4 anos, de FHC 2 (1999–2002) a Lula 3 (2023–2026). A variação de cada tema compara o ano anterior à posse com o último ano do mandato (ou o último ano com dado, no mandato atual). Como os escores começam em 2000, FHC 2 é medido de 2000 a 2002.
- O minigráfico de cada cartão e o gráfico "Escore ao longo do tempo" destacam o mandato escolhido. "O que puxa o escore" mostra os percentis do último ano do mandato, com um traço no ano anterior à posse.

## 1.3 — 15/10/2026

### Adicionado
- **Fontes e APIs na aba Metodologia:** APIs e bases oficiais (Banco Mundial, WGI, PNUD, Poverty and Inequality Platform), os repositórios de onde o painel baixa os dados, os produtores originais de cada dado (FMI, OIT, UNESCO, OMPI, UIP, UNODC, OMS/UNICEF, ONU, EDGAR, FAO, ICP) e o código do projeto. Todos os links foram conferidos em 15/10/2026.
- A tabela de indicadores ganhou o código oficial e os links **Página** e **API** de cada indicador. A API já abre filtrada para o Brasil.
- `scripts/fontes.py` com os códigos e os links. `indicadores.json` ganhou os campos `codigo_oficial`, `url_fonte` e `url_api`. O dicionário (docs/04) também mostra os links.

### Corrigido
- O doc 06 dizia que 38 dos 40 indicadores vêm do WDI. São 33: os outros são os 6 de governança (WGI) e o IDH (PNUD).

## 1.2.1 — 15/10/2026

### Corrigido
- As explicações dos indicadores podiam aparecer vazias para quem já tinha visitado o site: a lista de indicadores ficava guardada no navegador por até um dia, numa versão sem os textos. Agora os dados são sempre revalidados (`cache: 'no-cache'` no `app.js` e `max-age=0, must-revalidate` em `vercel.json`, `_headers` e `.htaccess`), e `styles.css` e `app.js` levam número de versão (`?v=1.3`) no `index.html`.

### Alterado
- Ícone de informação redesenhado: círculo de traço fino em tom neutro, que ganha a cor de destaque só ao passar o mouse, com área de toque maior que o desenho. A caixa de explicação ficou mais limpa, com títulos discretos.

## 1.2 — 15/10/2026

### Adicionado
- **Explicação para leigos em cada indicador.** Um "i" à direita do nome de cada indicador mostra, ao passar o mouse, o que o indicador mede, como ler, por que importa, um cuidado de interpretação e o último dado do Brasil. Fica na lista "O que puxa o escore" (Visão geral), no rótulo "Indicador" e no título dos gráficos (Séries temporais e Coortes) e na tabela da Metodologia. No celular, abre com um toque. Pelo teclado, com Tab.
- `scripts/explicacoes.py` com os textos dos 40 indicadores. Eles entram em `indicadores.json` (campo `explicacao`) e no dicionário (docs/04, seção "Em linguagem simples").

### Corrigido
- No celular, o gráfico "Escore ao longo do tempo" cortava o rótulo da mediana da coorte. Os rótulos no fim das linhas agora só aparecem em telas largas. Nas estreitas, os valores aparecem ao tocar no gráfico.

## 1.1.1 — 15/10/2026

### Corrigido
- Deploy na Vercel retornava "404: NOT_FOUND" porque a Vercel servia a raiz do repositório. O novo `vercel.json` publica a pasta `site/` com os cabeçalhos de cache e segurança. Instruções e solução de problemas em `docs/10-publicacao.md`.

## 1.1 — 15/10/2026

### Posicionamento
- O projeto passa a ser apresentado como **trabalho voluntário, aberto e para o público geral**, e não como produto interno. README, doc 01 e rodapé do site atualizados. O README ganhou a seção "Como contribuir".

### Adicionado
- **Site próprio** na pasta `site/`: o painel completo em HTML, CSS e JavaScript puros, com a d3 7.9.0 servida localmente. Pode ser hospedado em qualquer domínio, sem depender do Claude.
- Tema claro e escuro com botão no cabeçalho. A escolha fica lembrada no navegador.
- Botões "Baixar CSV" no ranking de países e nas séries temporais (separador `;` e vírgula decimal, prontos para o Excel).
- Publicação automática no GitHub Pages (`.github/workflows/pages.yml`) e configurações para Netlify (`netlify.toml`), Netlify e Cloudflare Pages (`site/_headers`) e Apache/cPanel (`site/.htaccess`), com cache e política de segurança de conteúdo.
- `docs/10-publicacao.md`: passo a passo para publicar em domínio próprio.
- Este arquivo de histórico.

### Alterado
- `scripts/build_dados.py` grava os dados também em `site/data/`.
- `docs/07-dashboard.md` virou `docs/07-site.md`, descrevendo a arquitetura do site, a organização do `app.js`, o design e como modificar.
- Os documentos 03, 06, 08 e 09 deixam de citar a API do artifact (`dash.calc`, ativos) e passam a apontar para o site.
- Links atualizados para o novo nome do repositório: `ChrisBerenguer/Monitora-Brasil`.

### Removido
- A pasta `dashboard/` (página presa ao formato de artifact do Claude). O artifact continua publicado, mas não é mais mantido junto com este repositório.

## 1.0 — 15/10/2026

- Primeira versão: 40 indicadores, 23 países, séries de 1995 a 2025, escores de 0 a 100 para 5 macrotemas de 2000 a 2025, coortes (América Latina, BRICS, OCDE, renda média-alta e mundo) e comparação entre mandatos presidenciais de 4 anos.
- Scripts de coleta (`baixar_brutos.py`), cálculo (`build_dados.py`) e geração do dicionário (`gerar_dicionario.py`).
- Documentação de 01 a 09: visão geral, conceitos e teorias, metodologia, dicionário de indicadores, nomenclatura, dados e esquemas, painel, limitações e roadmap, e como atualizar.
- Painel publicado como artifact do tipo Dashboard no Claude.
