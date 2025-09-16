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

4. **Teste o servidor:**
   ```bash
   npm run start
   ```

> **Nota**: O comando `npm run generate` pode levar alguns minutos na primeira execução, pois precisa processar milhares de ícones e tokens do Carbon Design System.

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
- `npm run mcp-config` - **Configura automaticamente o servidor MCP no Cursor**

## 🔧 Configuração no Cursor

### ⚡ Configuração Automática (Recomendado)

Execute o comando para configurar automaticamente o servidor MCP no Cursor:

```bash
npm run mcp-config
```

Este comando irá:
- ✅ **Detectar automaticamente** o sistema operacional (Windows, macOS, Linux)
- ✅ **Encontrar o arquivo** `mcp.json` do Cursor
- ✅ **Adicionar/atualizar** apenas o servidor `carbon-mcp`
- ✅ **Preservar** outros servidores MCP existentes
- ✅ **Usar caminhos absolutos** corretos
- ✅ **Evitar duplicações** - só atualiza se necessário

**Caminhos suportados:**
- **macOS:** `/Users/username/.cursor/mcp.json`
- **Windows:** `C:\Users\username\.cursor\mcp.json`
- **Linux:** `/home/username/.cursor/mcp.json`

### 📋 Configuração Manual (Alternativa)

Se preferir configurar manualmente, adicione ao arquivo `mcp.json` do Cursor:

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

> **Substitua `<ABSOLUTE_PATH>` pelo caminho absoluto do projeto**

### ✨ Vantagens da Configuração Automática

- **🚀 Zero configuração manual** - Um comando configura tudo
- **🔍 Detecção inteligente** - Encontra automaticamente o arquivo do Cursor
- **🛡️ Preserva configurações** - Não sobrescreve outros servidores MCP
- **⚡ Atualização inteligente** - Só modifica se necessário
- **🌍 Multiplataforma** - Funciona em Windows, macOS e Linux
- **📝 Logs detalhados** - Mostra exatamente o que está fazendo

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
carbon.suggest { "intent": "tabela com dados ordenáveis" }
carbon.suggest { "intent": "formulário de login" }
```

### Buscar ícones e pictogramas
```
carbon.icons.search { "query": "download" }
carbon.icons.search { "query": "user", "category": "User" }
carbon.icons.search { "query": "arrow", "size": 16 }
carbon.pictograms.search { "query": "cloud" }
carbon.pictograms.search { "query": "ai", "category": "AI & Technology" }
```

### Obter tokens do Design System
```
carbon.tokens
```

### Recarregar dados
```
carbon.refresh
```

## 📊 Dados Disponíveis

Após executar `npm run generate`, você terá acesso a:

- **14 componentes** com props tipadas e documentação completa
- **2.510+ ícones** indexados e categorizados
- **6 categorias de tokens**: cores, temas, tipografia, layout, motion, grid
- **0 pictogramas** (metadados não disponíveis, mas sistema preparado)

## 🔧 Troubleshooting

### Problema: Script `mcp-config` não encontra o arquivo do Cursor
- **Windows:** Verifique se o arquivo existe em `C:\Users\seu-usuario\.cursor\mcp.json`
- **macOS:** Verifique se o arquivo existe em `/Users/seu-usuario/.cursor/mcp.json`
- **Linux:** Verifique se o arquivo existe em `/home/seu-usuario/.cursor/mcp.json`
- Se não existir, crie o diretório: `mkdir -p ~/.cursor` e execute novamente

### Problema: Servidor não inicia
- Verifique se executou `npm run generate` e `npm run build`
- Confirme se os arquivos em `data/` existem
- Execute `npm run mcp-config` para verificar/atualizar a configuração

### Problema: Dados não carregam
- Execute `npm run refresh` para regenerar os dados
- Verifique se os pacotes do Carbon estão instalados em `node_modules/`

### Problema: Ícones não aparecem
- O sistema usa metadados do `@carbon/icons` quando disponível
- Se não houver metadados, usa fallback por varredura de diretórios
- Execute `npm run refresh` se houver problemas

### Problema: Configuração não é aplicada
- Reinicie o Cursor completamente após executar `npm run mcp-config`
- Verifique se o arquivo `mcp.json` foi atualizado corretamente
- Execute `npm run mcp-config` novamente para verificar o status

## 📁 Estrutura do Projeto

```
carbon-mcp-server/
├── src/
│   └── index.ts              # Servidor MCP principal
├── scripts/
│   ├── generate-components-json.ts  # Gera dados de componentes
│   ├── scan-assets.ts              # Gera tokens, ícones e pictogramas
│   └── generate-mcp-config.ts      # Configura automaticamente o MCP no Cursor
├── seed/
│   └── carbon-seed.json      # Dados curados de componentes
├── data/
│   ├── components.json       # Dados gerados de componentes (19KB)
│   ├── tokens.json          # Tokens do Design System (516KB)
│   ├── icons.json           # Índice de ícones (312KB)
│   └── pictograms.json      # Índice de pictogramas (2B)
├── dist/
│   ├── index.js             # Servidor compilado
│   └── index.d.ts           # Definições TypeScript
├── mcp-config.json          # Configuração standalone gerada
├── package.json
├── tsconfig.json
├── .gitignore
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

## 🚀 Quick Start

Para começar rapidamente:

```bash
# Clone ou baixe o projeto
cd carbon-mcp-server

# Instale dependências
npm install

# Gere dados (pode levar alguns minutos)
npm run generate

# Compile o projeto
npm run build

# Configure automaticamente no Cursor
npm run mcp-config

# Reinicie o Cursor e teste!
```

> **🎉 Pronto!** O servidor MCP estará disponível no Cursor após reiniciar.

## 📄 Licença

Este projeto é privado e segue as licenças dos pacotes do Carbon Design System utilizados.

---

**Desenvolvido para integração com Cursor IDE e Carbon Design System** 🎯
