# Histórico de versões

## 1.2 — 15/10/2026

### Adicionado
- **Botão "i" nos gráficos de indicador** (abas Séries temporais e Coortes): abre uma explicação em linguagem simples, com o que o indicador mede, como ler, por que importa e um cuidado de interpretação, além do último dado do Brasil.
- `scripts/explicacoes.py` com os textos dos 40 indicadores. Eles entram em `indicadores.json` (campo `explicacao`) e no dicionário (docs/04, seção "Em linguagem simples").

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
