# Histórico de versões

## 1.1 — 15/10/2026

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
