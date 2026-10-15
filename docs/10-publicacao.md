# 10 · Publicação em domínio próprio

O site é a pasta `site/`. Qualquer hospedagem de arquivos estáticos serve. Abaixo estão quatro caminhos, do mais automático ao mais manual. Em todos, o domínio próprio é configurado no DNS do registrador (Registro.br, GoDaddy, Cloudflare etc.).

## Opção A — GitHub Pages (recomendada: já está tudo no repositório)

O workflow `.github/workflows/pages.yml` publica a pasta `site/` a cada push na `main` que altere o site.

1. No GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Faça um push (ou rode o workflow em **Actions → Publicar site → Run workflow**). O site sai em `https://chrisberenguer.github.io/Monitora-Brasil/` (o caminho segue o nome do repositório, com maiúsculas).
3. **Domínio próprio:** em **Settings → Pages → Custom domain**, digite o domínio (ex.: `monitorabrasil.com.br`) e salve. Depois marque **Enforce HTTPS** quando o certificado ficar pronto.
4. **DNS no registrador:**
   - Para um subdomínio (ex.: `painel.seudominio.com.br`): um registro **CNAME** `painel` → `chrisberenguer.github.io`.
   - Para o domínio raiz (ex.: `monitorabrasil.com.br`): quatro registros **A** para `185.199.108.153`, `185.199.109.153`, `185.199.110.153` e `185.199.111.153`. Opcionalmente, mais um CNAME `www` → `chrisberenguer.github.io`.
5. A propagação do DNS leva de minutos a algumas horas.

O repositório precisa ser público, ou estar num plano do GitHub que permita Pages em repositório privado.

## Opção B — Netlify ou Cloudflare Pages

Os dois leem o arquivo `site/_headers` (cache e segurança).

**Netlify**
1. **Add new site → Import an existing project** → escolha o repositório.
2. O `netlify.toml` já define `publish = "site"` e nenhum comando de build.
3. **Domain management → Add a domain** e siga as instruções de DNS (CNAME para `<nome>.netlify.app`, ou os servidores DNS da Netlify).

**Cloudflare Pages**
1. **Workers & Pages → Create → Pages → Connect to Git** → repositório.
2. Build command: vazio. Build output directory: `site`.
3. **Custom domains → Set up a domain**. Se o domínio já usa o DNS da Cloudflare, o registro é criado automaticamente.

## Opção B2 — Vercel

O arquivo `vercel.json` na raiz já diz à Vercel para publicar a pasta `site/` (`"outputDirectory": "site"`), sem etapa de build, com os cabeçalhos de cache e segurança.

1. **Add New → Project** → importe o repositório `Monitora-Brasil`.
2. Em **Configure Project**, deixe **Framework Preset: Other** e **Root Directory** na raiz (`./`). Não preencha Build Command nem Output Directory: o `vercel.json` cuida disso.
3. **Deploy**. Depois, em **Settings → Domains**, adicione o domínio e crie no registrador o registro que a Vercel indicar (em geral um CNAME para `cname.vercel-dns.com`, ou um registro A para o domínio raiz).

**Se aparecer "404: NOT_FOUND"**, a Vercel está servindo a raiz do repositório, onde não há `index.html`. Confirme que o `vercel.json` está no commit publicado e faça um novo deploy (**Deployments → ⋯ → Redeploy**). Se em **Settings → Build and Deployment** alguém tiver preenchido manualmente o Output Directory com outro valor, apague ou ajuste para `site`. Uma alternativa é definir **Root Directory = `site`**; nesse caso, os cabeçalhos do `vercel.json` da raiz não são aplicados.

## Opção C — Hospedagem compartilhada (cPanel, Apache)

1. Envie **o conteúdo** da pasta `site/` (não a pasta em si) para `public_html/` ou para a pasta do subdomínio, pelo Gerenciador de Arquivos ou por FTP.
2. Confirme que o arquivo oculto `.htaccess` foi enviado (alguns clientes de FTP escondem arquivos que começam com ponto). Ele liga a compressão, o cache e os cabeçalhos de segurança.
3. O domínio já aponta para a hospedagem pelo próprio painel do provedor. Ative o SSL gratuito (Let's Encrypt/AutoSSL).

## Opção D — Servidor próprio (Nginx)

```nginx
server {
    listen 443 ssl http2;
    server_name monitorabrasil.com.br;
    root /var/www/Monitora-Brasil/site;
    index index.html;

    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;

    location /assets/ { add_header Cache-Control "public, max-age=31536000, immutable"; }
    location /data/   { add_header Cache-Control "public, max-age=86400"; }

    add_header X-Content-Type-Options nosniff;
    add_header Referrer-Policy strict-origin-when-cross-origin;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'self'; base-uri 'self'";

    ssl_certificate     /etc/letsencrypt/live/monitorabrasil.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/monitorabrasil.com.br/privkey.pem;
}
```

## Segurança e desempenho

- **CSP:** a política só permite scripts do próprio site (d3 está em `assets/js/`) e fontes do Google. `'unsafe-inline'` em `style-src` é necessário porque os gráficos aplicam estilos por atributo. Se trocar as fontes por arquivos locais, remova `fonts.googleapis.com` e `fonts.gstatic.com` da política.
- **Cache:** os arquivos em `assets/` são imutáveis (1 ano). Ao alterar `app.js` ou `styles.css`, mude o nome do arquivo (ex.: `app.v2.js`) ou acrescente `?v=2` no `index.html` para os visitantes receberem a versão nova. Os dados têm cache de 1 dia.
- **Tamanho:** cerca de 4,2 MB de dados sem compressão, menos de 1 MB com gzip/brotli. A primeira visita baixa tudo de uma vez, e a navegação seguinte não faz mais requisições.

## Checklist de publicação

- [ ] Rodou `scripts/build_dados.py`, e `site/data/` está atualizado.
- [ ] Testou localmente com `python -m http.server` dentro de `site/`.
- [ ] Ajustou no `index.html` o título e a descrição para o domínio final, se necessário. Para pré-visualização em redes sociais, acrescente `og:url` e uma imagem `og:image` de 1200×630.
- [ ] HTTPS ativo no domínio.
- [ ] Abriu as 4 abas no celular e no computador, nos temas claro e escuro.

## Atualizações depois de publicado

1. Rode o pipeline (doc 09), que regrava `dados/` e `site/data/`.
2. Faça commit e push. No GitHub Pages, Netlify e Cloudflare, a publicação é automática. No cPanel, envie de novo a pasta `site/data/`.
