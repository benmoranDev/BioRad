# GUIA DE HOSPEDAGEM ESTÁTICA (Locaweb, GitHub Pages, cPanel, Apache)

Este projeto gera **HTML5, CSS3 e JavaScript puros** prontos para qualquer hospedagem compartilhada (Locaweb, HostGator, KingHost, cPanel, GitHub Pages, Vercel, Netlify).

---

## 1. COMO GERAR O HTML5 PURO

No terminal do seu computador, execute:
```bash
npm run build
```

Isso criará a pasta **`dist/`** com:
- `dist/index.html` (Arquivo HTML5 principal)
- `dist/assets/index-*.js` (Scripts JavaScript compilados)
- `dist/assets/index-*.css` (Estilos compilados com Bootstrap 5 e Tailwind)

---

## 2. COMO HOSPEDAR NA LOCAWEB (Via FTP ou Gerenciador de Arquivos)

Na Locaweb (Hospedagem de Sites Linux/Windows):

1. Acesse o **Painel de Controle da Locaweb** (ou conecte via **FileZilla / FTP**).
2. Vá até o diretório público do seu domínio:
   - Geralmente é a pasta **`public_html/`** ou **`public_html/web/`** ou **`htdocs/`**.
3. **IMPORTANTE:** Envie **O CONTEÚDO** de dentro da pasta `dist/` para a raiz da pasta pública:
   - Envie o arquivo `index.html`
   - Envie a pasta `assets/` (com todos os arquivos `.js` e `.css` que estão dentro dela)
4. O `index.html` deve ficar exatamente na raiz:
   ```
   public_html/
   ├── index.html
   └── assets/
       ├── index-XXXX.js
       └── index-XXXX.css
   ```
5. Pronto! Acesse `seusite.com.br` e ele abrirá imediatamente.

---

## 3. POR QUE NO GITHUB PAGES DAVA TELA BRANCA?

Se você subir o repositório inteiro com as pastas `src/`, `package.json`, `vite.config.ts`, o GitHub Pages **não compila** sozinho se estiver configurado no modo padrão "Deploy from a branch". O navegador tentava ler o arquivo `src/main.tsx` que não é HTML nem JS puro.

### Para funcionar no GitHub Pages:

#### Modo A: Upload da pasta `dist` (Branch gh-pages)
1. No seu computador, instale:
   ```bash
   npm install --save-dev gh-pages
   ```
2. No `package.json`, adicione em scripts:
   ```json
   "deploy": "gh-pages -d dist"
   ```
3. Execute:
   ```bash
   npm run build
   npm run deploy
   ```
4. No GitHub: **Settings > Pages > Source:** escolha a branch `gh-pages` e pasta `/ (root)`.

#### Modo B: Pelo GitHub Actions (Já configurado neste projeto)
1. Vá no seu repositório no GitHub: **Settings > Pages**.
2. Em **Source**, mude para **GitHub Actions**.
3. Faça um `git push` de qualquer alteração na branch `main`. O GitHub rodará o workflow `.github/workflows/deploy.yml` que criamos, compilando o HTML5 e publicando automaticamente.
