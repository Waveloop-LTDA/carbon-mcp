Quero um **servidor MCP local (stdio)** chamado **`carbon-mcp`** que exponha, de forma estruturada, a base do **Carbon** para React **incluindo** estes pacotes (e só eles):

**Principais (React)**

* `@carbon/react`
* `@carbon/icons-react`
* `@carbon/pictograms-react`
* `@carbon/utilities-react`

**Design System (tokens/utilitários)**

* `@carbon/colors`
* `@carbon/themes`
* `@carbon/type`
* `@carbon/layout`
* `@carbon/motion`
* `@carbon/grid`

**Suporte**

* `@carbon/styles`
* `@carbon/elements`
* `@carbon/feature-flags`

**Dados (meta)**

* `@carbon/icons` (meta/ícones)
* `@carbon/pictograms` (meta/pictogramas)

> **Não instalar/não usar**: `carbon-components`, `carbon-components-react`, `web-components`, `icons-vue`, `cli`, `cli-reporter`, `upgrade`, `test-utils`, `scss-generator`, `icon-build-helpers`, `icon-helpers` (fora do escopo).

### O que o MCP deve expor

**Tools**

* `carbon.list` → lista componentes do `@carbon/react`
* `carbon.search` → busca por nome/uso/props
* `carbon.get` → retorna *resource\_link* `comp://{name}`
* `carbon.props` → JSON de props tipadas
* `carbon.suggest` → mapeia intenção → componente
* `carbon.tokens` → retorna tokens unificados `{ colors, themes, type, layout, motion, grid }`
* `carbon.icons.search` → busca ícones (por nome/label/categoria) e retorna import paths de `@carbon/icons-react`
* `carbon.pictograms.search` → idem para `@carbon/pictograms-react`
* `carbon.refresh` → reprocessa base (props, tokens, ícones)

**Resources**

* `comp://{name}` → Markdown (quando usar, props, exemplos)
* `ds://tokens` → JSON com todos tokens resolvidos
* `icons://list` e `pictograms://list` → listas indexadas

### Projeto (arquivos e conteúdo)

**`package.json`**

```json
{
  "name": "carbon-mcp",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "bin": { "carbon-mcp": "dist/index.js" },
  "scripts": {
    "build": "tsup src/index.ts --format esm --target node18 --dts --out-dir dist",
    "start": "node dist/index.js",
    "dev": "tsx src/index.ts",
    "generate": "tsx scripts/generate-components-json.ts && tsx scripts/scan-assets.ts",
    "refresh": "npm run generate && npm run build"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "zod": "^3.23.8",
    "@carbon/react": "^1.91.0",
    "@carbon/icons-react": "^11.67.0",
    "@carbon/pictograms-react": "^11.85.0",
    "@carbon/utilities-react": "^0.12.0",
    "@carbon/colors": "^11.39.0",
    "@carbon/themes": "^11.40.0",
    "@carbon/type": "^11.39.0",
    "@carbon/layout": "^11.40.0",
    "@carbon/motion": "^11.31.0",
    "@carbon/grid": "^11.24.0",
    "@carbon/styles": "^1.89.0",
    "@carbon/elements": "^11.40.0",
    "@carbon/feature-flags": "^0.19.0",
    "@carbon/icons": "^11.67.0",
    "@carbon/pictograms": "^12.60.0",
    "yaml": "^2.5.0",
    "fast-glob": "^3.3.2"
  },
  "devDependencies": {
    "react-docgen-typescript": "^2.2.2",
    "tsup": "^8.0.0",
    "tsx": "^4.7.0",
    "typescript": "^5.6.2"
  }
}
```

**`src/index.ts`** (registre tools/resources e leia os JSONs gerados em `data/`)

* Carrega `data/components.json` (props + metadados), `data/tokens.json`, `data/icons.json`, `data/pictograms.json`.
* Implementa as tools acima. (Pode usar o esqueleto que já te passei; adicione as novas tools de tokens/ícones.)

**`scripts/generate-components-json.ts`**

* Usa `react-docgen-typescript` para parsear tipos do `@carbon/react` (globs: `node_modules/@carbon/react/**/**.d.ts`).
* Faz *merge* com um seed `seed/carbon-seed.json` (descrições/“quando usar”/exemplos curados).
* Salva em `data/components.json`.

**`scripts/scan-assets.ts`**

* Gera **tokens**:

  * Importa e serializa:

    * Cores: de `@carbon/colors`
    * Temas: de `@carbon/themes` (white, g10, g90, g100, v10)
    * Tipos: de `@carbon/type` (escala, tokens)
    * Layout/spacing/breakpoints: de `@carbon/layout` e `@carbon/grid`
    * Motion: de `@carbon/motion`
  * Salva em `data/tokens.json`.
* Indexa **ícones**:

  * Preferencial: ler metadados de `@carbon/icons` (se houver manifest). Senão, *fallback* varrendo `node_modules/@carbon/icons-react/lib/**/*.js` e montando `{ name, importPath: "@carbon/icons-react/Name", category? }`.
  * Salva em `data/icons.json`.
* Indexa **pictograms**:

  * Preferencial: metadados de `@carbon/pictograms`. Senão, *fallback* varrendo `node_modules/@carbon/pictograms-react/lib/**/*.js`.
  * Salva em `data/pictograms.json`.

**`seed/carbon-seed.json`**

* Conteúdo curado mínimo (Button, Modal, DataTable, etc.) com `description`, `whenToUse`, `examples`.

**`data/.gitkeep`** para versionar a pasta.

**`README.md`** com instruções:

* `npm i`, `npm run generate`, `npm run build`.
* Configurar o Cursor com `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "carbon-mcp": {
      "command": "node",
      "args": ["<ABSOLUTE_PATH>/dist/index.js"],
      "env": {
        "CARBON_DB": "<ABSOLUTE_PATH>/data/components.json",
        "CARBON_TOKENS": "<ABSOLUTE_PATH>/data/tokens.json",
        "CARBON_ICONS": "<ABSOLUTE_PATH>/data/icons.json",
        "CARBON_PICTOS": "<ABSOLUTE_PATH>/data/pictograms.json"
      }
    }
  }
}
```

### Regras de implementação

* **Nada de hospedar**: transporte `stdio`.
* **Somente os pacotes pertinentes** acima. Explicitamente **não** adicionar os “não pertinentes”.
* **Fail-soft**: se um pacote de meta (ex.: `@carbon/pictograms`) não expuser manifest, o *fallback* por varredura dos diretórios `lib/` deve funcionar.
* **Saídas compactas**: tools retornam arrays resumidos; o *resource\_link* carrega o Markdown completo sob demanda.
* **Segurança**: leitura somente em `node_modules` e na pasta `data/`. Sem exec externo.

### Exemplos de retorno

* `carbon.tokens` → `{ themes: { white, g10, ... }, colors: {...}, type: {...}, layout: {...}, motion: {...}, grid: {...} }`
* `carbon.icons.search { q: "download" }` → `[ { name:"Download", import:"@carbon/icons-react/Download" }, ... ]`
* `carbon.pictograms.search { q: "cloud" }` → idem.
* `carbon.props { name:"Button" }` → lista de props com tipo/required/default/descrição.
* `carbon.get { name:"Modal" }` → `resource_link` para `comp://Modal`.

### Testes no Cursor

* `carbon.list`, `carbon.search "table"`, `carbon.get "DataTable"`.
* `carbon.tokens` (checar que vêm os 5 temas e escalas).
* `carbon.icons.search "add"` e `carbon.pictograms.search "ai"`.

> Observação: os pacotes citados existem e são os oficiais sob o escopo `@carbon` (React, ícones, pictograms, tokens, estilos, flags). **Não** use os pacotes legados (`carbon-components*`). ([Npm][1])
> Tokens/temas/tipografia/layout/motion/grid estão disponíveis como pacotes dedicados. ([Npm][2])
> Metadados/ativos de ícones e pictogramas estão em `@carbon/icons` e `@carbon/pictograms`; para React, use `@carbon/icons-react` e `@carbon/pictograms-react`. ([Npm][3])

