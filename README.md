# Carbon MCP Server

Um servidor MCP (Model Context Protocol) local que expõe de forma estruturada a base do Carbon Design System para React, incluindo componentes, tokens, ícones e pictogramas.

## 🚀 Instalação

1. **Instale as dependências:**
   ```bash
   npm install
   ```

2. **Gere os dados iniciais:**
   ```bash
   npm run generate
   ```

3. **Compile o projeto:**
   ```bash
   npm run build
   ```

## 📦 Pacotes Incluídos

### Principais (React)
- `@carbon/react` - Componentes React
- `@carbon/icons-react` - Ícones React
- `@carbon/pictograms-react` - Pictogramas React
- `@carbon/utilities-react` - Utilitários React

### Design System (tokens/utilitários)
- `@carbon/colors` - Paleta de cores
- `@carbon/themes` - Temas (white, g10, g90, g100, v10)
- `@carbon/type` - Tipografia e escala
- `@carbon/layout` - Layout e espaçamento
- `@carbon/motion` - Animações e transições
- `@carbon/grid` - Sistema de grid

### Suporte
- `@carbon/styles` - Estilos base
- `@carbon/elements` - Elementos fundamentais
- `@carbon/feature-flags` - Flags de funcionalidade

### Dados (meta)
- `@carbon/icons` - Metadados de ícones
- `@carbon/pictograms` - Metadados de pictogramas

## 🛠️ Scripts Disponíveis

- `npm run dev` - Executa em modo desenvolvimento
- `npm run build` - Compila o projeto
- `npm run start` - Executa a versão compilada
- `npm run generate` - Gera dados de componentes e assets
- `npm run refresh` - Regenera dados e recompila

## 🔧 Configuração no Cursor

Adicione a seguinte configuração no arquivo `.cursor/mcp.json`:

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

Substitua `<ABSOLUTE_PATH>` pelo caminho absoluto para o diretório do projeto.

## 🎯 Tools Disponíveis

### Componentes
- `carbon.list` - Lista componentes com filtros opcionais
- `carbon.search` - Busca componentes por nome/uso/props
- `carbon.get` - Retorna resource_link para um componente
- `carbon.props` - Retorna props tipadas de um componente
- `carbon.suggest` - Mapeia intenção para componente recomendado

### Design System
- `carbon.tokens` - Retorna tokens unificados (cores, temas, tipografia, layout, motion, grid)

### Assets
- `carbon.icons.search` - Busca ícones por nome/label/categoria
- `carbon.pictograms.search` - Busca pictogramas por nome/label/categoria

### Utilitários
- `carbon.refresh` - Reprocessa base de dados

## 📚 Resources Disponíveis

- `comp://{name}` - Documentação completa de um componente (Markdown)
- `ds://tokens` - Todos os tokens do Design System (JSON)
- `icons://list` - Lista indexada de ícones (JSON)
- `pictograms://list` - Lista indexada de pictogramas (JSON)

## 🧪 Exemplos de Uso

### Listar componentes
```
carbon.list
carbon.list { "category": "Form" }
carbon.list { "search": "button" }
```

### Buscar componentes
```
carbon.search { "query": "table" }
carbon.search { "query": "modal", "category": "Overlay" }
```

### Obter informações de um componente
```
carbon.get { "name": "Button" }
carbon.props { "name": "DataTable" }
```

### Sugerir componente por intenção
```
carbon.suggest { "intent": "preciso de um botão para salvar dados" }
```

### Buscar ícones e pictogramas
```
carbon.icons.search { "query": "download" }
carbon.icons.search { "query": "user", "category": "User" }
carbon.pictograms.search { "query": "cloud" }
```

### Obter tokens do Design System
```
carbon.tokens
```

### Recarregar dados
```
carbon.refresh
```

## 📁 Estrutura do Projeto

```
carbon-mcp-server/
├── src/
│   └── index.ts              # Servidor MCP principal
├── scripts/
│   ├── generate-components-json.ts  # Gera dados de componentes
│   └── scan-assets.ts              # Gera tokens, ícones e pictogramas
├── seed/
│   └── carbon-seed.json      # Dados curados de componentes
├── data/
│   ├── components.json       # Dados gerados de componentes
│   ├── tokens.json          # Tokens do Design System
│   ├── icons.json           # Índice de ícones
│   └── pictograms.json      # Índice de pictogramas
├── package.json
├── tsconfig.json
└── README.md
```

## 🔍 Como Funciona

1. **Geração de Dados**: Os scripts analisam os pacotes do Carbon instalados e extraem informações sobre componentes, tokens, ícones e pictogramas.

2. **Cache Local**: Os dados são armazenados em arquivos JSON na pasta `data/` para acesso rápido.

3. **Servidor MCP**: O servidor expõe os dados através de tools e resources do protocolo MCP.

4. **Integração**: O Cursor pode usar o servidor para acessar informações do Carbon Design System durante o desenvolvimento.

## 🚨 Limitações

- **Somente leitura**: O servidor apenas lê dados, não modifica arquivos
- **Pacotes específicos**: Apenas os pacotes listados são incluídos
- **Fallback robusto**: Se metadados não estiverem disponíveis, usa varredura de diretórios
- **Segurança**: Acesso limitado a `node_modules` e pasta `data/`

## 🤝 Contribuição

Este projeto segue as especificações do Carbon Design System e está limitado aos pacotes oficiais sob o escopo `@carbon`. Não inclui pacotes legados como `carbon-components*`.

## 📄 Licença

Este projeto é privado e segue as licenças dos pacotes do Carbon Design System utilizados.
