# Histórico de versões

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
