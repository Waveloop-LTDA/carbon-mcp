#!/usr/bin/env node

// src/index.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  McpError
} from "@modelcontextprotocol/sdk/types.js";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { z } from "zod";
var componentsCache = [];
var tokensCache = null;
var iconsCache = [];
var pictogramsCache = [];
function loadData() {
  const dataDir = process.env.CARBON_DB ? process.env.CARBON_DB.replace("components.json", "") : join(process.cwd(), "data");
  const componentsPath = join(dataDir, "components.json");
  if (existsSync(componentsPath)) {
    const componentsData = readFileSync(componentsPath, "utf-8");
    componentsCache = JSON.parse(componentsData);
  }
  const tokensPath = process.env.CARBON_TOKENS || join(dataDir, "tokens.json");
  if (existsSync(tokensPath)) {
    const tokensData = readFileSync(tokensPath, "utf-8");
    tokensCache = JSON.parse(tokensData);
  }
  const iconsPath = process.env.CARBON_ICONS || join(dataDir, "icons.json");
  if (existsSync(iconsPath)) {
    const iconsData = readFileSync(iconsPath, "utf-8");
    iconsCache = JSON.parse(iconsData);
  }
  const pictogramsPath = process.env.CARBON_PICTOS || join(dataDir, "pictograms.json");
  if (existsSync(pictogramsPath)) {
    const pictogramsData = readFileSync(pictogramsPath, "utf-8");
    pictogramsCache = JSON.parse(pictogramsData);
  }
}
var ListComponentsSchema = z.object({
  category: z.string().optional(),
  search: z.string().optional()
});
var SearchComponentsSchema = z.object({
  query: z.string(),
  category: z.string().optional()
});
var GetComponentSchema = z.object({
  name: z.string()
});
var GetComponentPropsSchema = z.object({
  name: z.string()
});
var SuggestComponentSchema = z.object({
  intent: z.string()
});
var GetTokensSchema = z.object({});
var SearchIconsSchema = z.object({
  query: z.string(),
  category: z.string().optional(),
  size: z.number().optional()
});
var SearchPictogramsSchema = z.object({
  query: z.string(),
  category: z.string().optional()
});
var RefreshSchema = z.object({});
var server = new Server(
  {
    name: "carbon-mcp",
    version: "0.1.0"
  },
  {
    capabilities: {
      resources: {},
      tools: {}
    }
  }
);
var tools = [
  {
    name: "carbon.list",
    description: "Lista componentes do @carbon/react com filtros opcionais",
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description: "Filtrar por categoria (Form, Data Display, Navigation, etc.)"
        },
        search: {
          type: "string",
          description: "Buscar por nome ou descri\xE7\xE3o"
        }
      }
    }
  },
  {
    name: "carbon.search",
    description: "Busca componentes por nome, descri\xE7\xE3o ou uso",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Termo de busca"
        },
        category: {
          type: "string",
          description: "Filtrar por categoria"
        }
      },
      required: ["query"]
    }
  },
  {
    name: "carbon.get",
    description: "Retorna resource_link para um componente espec\xEDfico",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Nome do componente"
        }
      },
      required: ["name"]
    }
  },
  {
    name: "carbon.props",
    description: "Retorna props tipadas de um componente",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Nome do componente"
        }
      },
      required: ["name"]
    }
  },
  {
    name: "carbon.suggest",
    description: "Mapeia inten\xE7\xE3o para componente recomendado",
    inputSchema: {
      type: "object",
      properties: {
        intent: {
          type: "string",
          description: "Descri\xE7\xE3o da inten\xE7\xE3o ou uso desejado"
        }
      },
      required: ["intent"]
    }
  },
  {
    name: "carbon.tokens",
    description: "Retorna tokens unificados (cores, temas, tipografia, layout, motion, grid)",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "carbon.icons.search",
    description: "Busca \xEDcones por nome, label ou categoria",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Termo de busca"
        },
        category: {
          type: "string",
          description: "Filtrar por categoria"
        },
        size: {
          type: "number",
          description: "Filtrar por tamanho (16, 20, 24, 32)"
        }
      },
      required: ["query"]
    }
  },
  {
    name: "carbon.pictograms.search",
    description: "Busca pictogramas por nome, label ou categoria",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Termo de busca"
        },
        category: {
          type: "string",
          description: "Filtrar por categoria"
        }
      },
      required: ["query"]
    }
  },
  {
    name: "carbon.refresh",
    description: "Reprocessa base de dados (props, tokens, \xEDcones)",
    inputSchema: {
      type: "object",
      properties: {}
    }
  }
];
var resources = [
  {
    uri: "comp://{name}",
    name: "Component Documentation",
    description: "Documenta\xE7\xE3o completa de um componente Carbon React",
    mimeType: "text/markdown"
  },
  {
    uri: "ds://tokens",
    name: "Design System Tokens",
    description: "Todos os tokens do Carbon Design System",
    mimeType: "application/json"
  },
  {
    uri: "icons://list",
    name: "Icons List",
    description: "Lista indexada de todos os \xEDcones dispon\xEDveis",
    mimeType: "application/json"
  },
  {
    uri: "pictograms://list",
    name: "Pictograms List",
    description: "Lista indexada de todos os pictogramas dispon\xEDveis",
    mimeType: "application/json"
  }
];
async function handleListComponents(args) {
  const { category, search } = ListComponentsSchema.parse(args);
  let filteredComponents = componentsCache;
  if (category) {
    filteredComponents = filteredComponents.filter(
      (comp) => comp.category?.toLowerCase().includes(category.toLowerCase())
    );
  }
  if (search) {
    const searchLower = search.toLowerCase();
    filteredComponents = filteredComponents.filter(
      (comp) => comp.name.toLowerCase().includes(searchLower) || comp.description?.toLowerCase().includes(searchLower) || comp.whenToUse?.toLowerCase().includes(searchLower)
    );
  }
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          components: filteredComponents.map((comp) => ({
            name: comp.name,
            description: comp.description,
            category: comp.category,
            importPath: comp.importPath,
            propsCount: comp.props.length
          })),
          total: filteredComponents.length
        }, null, 2)
      }
    ]
  };
}
async function handleSearchComponents(args) {
  const { query, category } = SearchComponentsSchema.parse(args);
  const queryLower = query.toLowerCase();
  let results = componentsCache.filter(
    (comp) => comp.name.toLowerCase().includes(queryLower) || comp.description?.toLowerCase().includes(queryLower) || comp.whenToUse?.toLowerCase().includes(queryLower) || comp.examples?.some((example) => example.toLowerCase().includes(queryLower))
  );
  if (category) {
    results = results.filter(
      (comp) => comp.category?.toLowerCase().includes(category.toLowerCase())
    );
  }
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          query,
          results: results.map((comp) => ({
            name: comp.name,
            description: comp.description,
            category: comp.category,
            importPath: comp.importPath,
            relevance: calculateRelevance(comp, query)
          })),
          total: results.length
        }, null, 2)
      }
    ]
  };
}
async function handleGetComponent(args) {
  const { name } = GetComponentSchema.parse(args);
  const component = componentsCache.find(
    (comp) => comp.name.toLowerCase() === name.toLowerCase()
  );
  if (!component) {
    throw new McpError(
      ErrorCode.InvalidParams,
      `Componente '${name}' n\xE3o encontrado`
    );
  }
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          resourceLink: `comp://${component.name}`,
          name: component.name,
          description: component.description,
          category: component.category,
          importPath: component.importPath
        })
      }
    ]
  };
}
async function handleGetComponentProps(args) {
  const { name } = GetComponentPropsSchema.parse(args);
  const component = componentsCache.find(
    (comp) => comp.name.toLowerCase() === name.toLowerCase()
  );
  if (!component) {
    throw new McpError(
      ErrorCode.InvalidParams,
      `Componente '${name}' n\xE3o encontrado`
    );
  }
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          name: component.name,
          props: component.props.map((prop) => ({
            name: prop.name,
            type: prop.type,
            required: prop.required,
            defaultValue: prop.defaultValue,
            description: prop.description
          })),
          total: component.props.length
        }, null, 2)
      }
    ]
  };
}
async function handleSuggestComponent(args) {
  const { intent } = SuggestComponentSchema.parse(args);
  const intentLower = intent.toLowerCase();
  const suggestions = componentsCache.map((comp) => ({
    component: comp,
    score: calculateIntentScore(comp, intentLower)
  })).filter((item) => item.score > 0).sort((a, b) => b.score - a.score).slice(0, 5);
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          intent,
          suggestions: suggestions.map((item) => ({
            name: item.component.name,
            description: item.component.description,
            category: item.component.category,
            score: item.score,
            importPath: item.component.importPath
          }))
        }, null, 2)
      }
    ]
  };
}
async function handleGetTokens(args) {
  GetTokensSchema.parse(args);
  if (!tokensCache) {
    throw new McpError(
      ErrorCode.InternalError,
      "Tokens n\xE3o carregados. Execute carbon.refresh primeiro."
    );
  }
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(tokensCache, null, 2)
      }
    ]
  };
}
async function handleSearchIcons(args) {
  const { query, category, size } = SearchIconsSchema.parse(args);
  const queryLower = query.toLowerCase();
  let results = iconsCache.filter(
    (icon) => icon.name.toLowerCase().includes(queryLower) || icon.category?.toLowerCase().includes(queryLower)
  );
  if (category) {
    results = results.filter(
      (icon) => icon.category?.toLowerCase().includes(category.toLowerCase())
    );
  }
  if (size) {
    results = results.filter((icon) => icon.size === size);
  }
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          query,
          results: results.map((icon) => ({
            name: icon.name,
            importPath: icon.importPath,
            category: icon.category,
            size: icon.size
          })),
          total: results.length
        }, null, 2)
      }
    ]
  };
}
async function handleSearchPictograms(args) {
  const { query, category } = SearchPictogramsSchema.parse(args);
  const queryLower = query.toLowerCase();
  let results = pictogramsCache.filter(
    (pictogram) => pictogram.name.toLowerCase().includes(queryLower) || pictogram.category?.toLowerCase().includes(queryLower)
  );
  if (category) {
    results = results.filter(
      (pictogram) => pictogram.category?.toLowerCase().includes(category.toLowerCase())
    );
  }
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          query,
          results: results.map((pictogram) => ({
            name: pictogram.name,
            importPath: pictogram.importPath,
            category: pictogram.category
          })),
          total: results.length
        }, null, 2)
      }
    ]
  };
}
async function handleRefresh(args) {
  RefreshSchema.parse(args);
  loadData();
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          message: "Base de dados recarregada com sucesso",
          stats: {
            components: componentsCache.length,
            icons: iconsCache.length,
            pictograms: pictogramsCache.length,
            tokensLoaded: tokensCache !== null
          }
        })
      }
    ]
  };
}
async function handleReadComponentResource(uri) {
  const componentName = uri.replace("comp://", "");
  const component = componentsCache.find(
    (comp) => comp.name.toLowerCase() === componentName.toLowerCase()
  );
  if (!component) {
    throw new McpError(
      ErrorCode.InvalidParams,
      `Componente '${componentName}' n\xE3o encontrado`
    );
  }
  const markdown = generateComponentMarkdown(component);
  return {
    contents: [
      {
        uri,
        mimeType: "text/markdown",
        text: markdown
      }
    ]
  };
}
async function handleReadTokensResource() {
  if (!tokensCache) {
    throw new McpError(
      ErrorCode.InternalError,
      "Tokens n\xE3o carregados. Execute carbon.refresh primeiro."
    );
  }
  return {
    contents: [
      {
        uri: "ds://tokens",
        mimeType: "application/json",
        text: JSON.stringify(tokensCache, null, 2)
      }
    ]
  };
}
async function handleReadIconsResource() {
  return {
    contents: [
      {
        uri: "icons://list",
        mimeType: "application/json",
        text: JSON.stringify(iconsCache, null, 2)
      }
    ]
  };
}
async function handleReadPictogramsResource() {
  return {
    contents: [
      {
        uri: "pictograms://list",
        mimeType: "application/json",
        text: JSON.stringify(pictogramsCache, null, 2)
      }
    ]
  };
}
function calculateRelevance(component, query) {
  const queryLower = query.toLowerCase();
  let score = 0;
  if (component.name.toLowerCase().includes(queryLower)) score += 10;
  if (component.description?.toLowerCase().includes(queryLower)) score += 5;
  if (component.whenToUse?.toLowerCase().includes(queryLower)) score += 3;
  if (component.examples?.some((example) => example.toLowerCase().includes(queryLower))) score += 2;
  return score;
}
function calculateIntentScore(component, intent) {
  const text = [
    component.name,
    component.description,
    component.whenToUse,
    ...component.examples || []
  ].join(" ").toLowerCase();
  const intentWords = intent.split(" ").filter((word) => word.length > 2);
  let score = 0;
  for (const word of intentWords) {
    if (text.includes(word)) {
      score += 1;
    }
  }
  return score;
}
function generateComponentMarkdown(component) {
  let markdown = `# ${component.name}

`;
  if (component.description) {
    markdown += `## Descri\xE7\xE3o

${component.description}

`;
  }
  if (component.whenToUse) {
    markdown += `## Quando usar

${component.whenToUse}

`;
  }
  if (component.examples && component.examples.length > 0) {
    markdown += `## Exemplos

`;
    component.examples.forEach((example, index) => {
      markdown += `${index + 1}. ${example}
`;
    });
    markdown += "\n";
  }
  markdown += `## Importa\xE7\xE3o

\`\`\`javascript
import { ${component.name} } from '${component.importPath}';
\`\`\`

`;
  if (component.props && component.props.length > 0) {
    markdown += `## Props

`;
    markdown += `| Nome | Tipo | Obrigat\xF3rio | Padr\xE3o | Descri\xE7\xE3o |
`;
    markdown += `|------|------|-------------|--------|----------|
`;
    component.props.forEach((prop) => {
      markdown += `| ${prop.name} | \`${prop.type}\` | ${prop.required ? "Sim" : "N\xE3o"} | ${prop.defaultValue || "-"} | ${prop.description || "-"} |
`;
    });
    markdown += "\n";
  }
  if (component.category) {
    markdown += `## Categoria

${component.category}

`;
  }
  return markdown;
}
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return { resources };
});
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  switch (name) {
    case "carbon.list":
      return handleListComponents(args);
    case "carbon.search":
      return handleSearchComponents(args);
    case "carbon.get":
      return handleGetComponent(args);
    case "carbon.props":
      return handleGetComponentProps(args);
    case "carbon.suggest":
      return handleSuggestComponent(args);
    case "carbon.tokens":
      return handleGetTokens(args);
    case "carbon.icons.search":
      return handleSearchIcons(args);
    case "carbon.pictograms.search":
      return handleSearchPictograms(args);
    case "carbon.refresh":
      return handleRefresh(args);
    default:
      throw new McpError(ErrorCode.MethodNotFound, `Tool '${name}' n\xE3o encontrada`);
  }
});
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  if (uri.startsWith("comp://")) {
    return handleReadComponentResource(uri);
  } else if (uri === "ds://tokens") {
    return handleReadTokensResource();
  } else if (uri === "icons://list") {
    return handleReadIconsResource();
  } else if (uri === "pictograms://list") {
    return handleReadPictogramsResource();
  } else {
    throw new McpError(ErrorCode.InvalidParams, `Resource '${uri}' n\xE3o encontrado`);
  }
});
async function main() {
  console.error("\u{1F680} Iniciando Carbon MCP Server...");
  loadData();
  console.error(`\u{1F4CA} Dados carregados: ${componentsCache.length} componentes, ${iconsCache.length} \xEDcones, ${pictogramsCache.length} pictogramas`);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("\u2705 Carbon MCP Server conectado e pronto!");
}
main().catch((error) => {
  console.error("\u274C Erro ao iniciar servidor:", error);
  process.exit(1);
});
