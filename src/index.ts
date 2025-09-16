#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  Tool,
  Resource,
  CallToolResult,
  ListResourcesResult,
  ListToolsResult,
  ReadResourceResult,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';

// Interfaces para os dados
interface ComponentInfo {
  name: string;
  description?: string;
  whenToUse?: string;
  examples?: string[];
  category?: string;
  props: ComponentProp[];
  importPath: string;
}

interface ComponentProp {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: any;
  description?: string;
}

interface TokenData {
  colors: Record<string, any>;
  themes: Record<string, any>;
  type: Record<string, any>;
  layout: Record<string, any>;
  motion: Record<string, any>;
  grid: Record<string, any>;
}

interface IconInfo {
  name: string;
  importPath: string;
  category?: string;
  size?: number;
}

interface PictogramInfo {
  name: string;
  importPath: string;
  category?: string;
}

// Cache para os dados
let componentsCache: ComponentInfo[] = [];
let tokensCache: TokenData | null = null;
let iconsCache: IconInfo[] = [];
let pictogramsCache: PictogramInfo[] = [];

// Função para carregar dados
function loadData() {
  const dataDir = process.env.CARBON_DB ? 
    process.env.CARBON_DB.replace('components.json', '') : 
    join(process.cwd(), 'data');

  // Carrega componentes
  const componentsPath = join(dataDir, 'components.json');
  if (existsSync(componentsPath)) {
    const componentsData = readFileSync(componentsPath, 'utf-8');
    componentsCache = JSON.parse(componentsData);
  }

  // Carrega tokens
  const tokensPath = process.env.CARBON_TOKENS || join(dataDir, 'tokens.json');
  if (existsSync(tokensPath)) {
    const tokensData = readFileSync(tokensPath, 'utf-8');
    tokensCache = JSON.parse(tokensData);
  }

  // Carrega ícones
  const iconsPath = process.env.CARBON_ICONS || join(dataDir, 'icons.json');
  if (existsSync(iconsPath)) {
    const iconsData = readFileSync(iconsPath, 'utf-8');
    iconsCache = JSON.parse(iconsData);
  }

  // Carrega pictogramas
  const pictogramsPath = process.env.CARBON_PICTOS || join(dataDir, 'pictograms.json');
  if (existsSync(pictogramsPath)) {
    const pictogramsData = readFileSync(pictogramsPath, 'utf-8');
    pictogramsCache = JSON.parse(pictogramsData);
  }
}

// Schemas de validação
const ListComponentsSchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
});

const SearchComponentsSchema = z.object({
  query: z.string(),
  category: z.string().optional(),
});

const GetComponentSchema = z.object({
  name: z.string(),
});

const GetComponentPropsSchema = z.object({
  name: z.string(),
});

const SuggestComponentSchema = z.object({
  intent: z.string(),
});

const GetTokensSchema = z.object({});

const SearchIconsSchema = z.object({
  query: z.string(),
  category: z.string().optional(),
  size: z.number().optional(),
});

const SearchPictogramsSchema = z.object({
  query: z.string(),
  category: z.string().optional(),
});

const RefreshSchema = z.object({});

// Cria o servidor MCP
const server = new Server(
  {
    name: 'carbon-mcp',
    version: '0.1.0',
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

// Lista de tools disponíveis
const tools: Tool[] = [
  {
    name: 'carbon.list',
    description: 'Lista componentes do @carbon/react com filtros opcionais',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Filtrar por categoria (Form, Data Display, Navigation, etc.)',
        },
        search: {
          type: 'string',
          description: 'Buscar por nome ou descrição',
        },
      },
    },
  },
  {
    name: 'carbon.search',
    description: 'Busca componentes por nome, descrição ou uso',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Termo de busca',
        },
        category: {
          type: 'string',
          description: 'Filtrar por categoria',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'carbon.get',
    description: 'Retorna resource_link para um componente específico',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Nome do componente',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'carbon.props',
    description: 'Retorna props tipadas de um componente',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Nome do componente',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'carbon.suggest',
    description: 'Mapeia intenção para componente recomendado',
    inputSchema: {
      type: 'object',
      properties: {
        intent: {
          type: 'string',
          description: 'Descrição da intenção ou uso desejado',
        },
      },
      required: ['intent'],
    },
  },
  {
    name: 'carbon.tokens',
    description: 'Retorna tokens unificados (cores, temas, tipografia, layout, motion, grid)',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'carbon.icons.search',
    description: 'Busca ícones por nome, label ou categoria',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Termo de busca',
        },
        category: {
          type: 'string',
          description: 'Filtrar por categoria',
        },
        size: {
          type: 'number',
          description: 'Filtrar por tamanho (16, 20, 24, 32)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'carbon.pictograms.search',
    description: 'Busca pictogramas por nome, label ou categoria',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Termo de busca',
        },
        category: {
          type: 'string',
          description: 'Filtrar por categoria',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'carbon.refresh',
    description: 'Reprocessa base de dados (props, tokens, ícones)',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

// Lista de resources disponíveis
const resources: Resource[] = [
  {
    uri: 'comp://{name}',
    name: 'Component Documentation',
    description: 'Documentação completa de um componente Carbon React',
    mimeType: 'text/markdown',
  },
  {
    uri: 'ds://tokens',
    name: 'Design System Tokens',
    description: 'Todos os tokens do Carbon Design System',
    mimeType: 'application/json',
  },
  {
    uri: 'icons://list',
    name: 'Icons List',
    description: 'Lista indexada de todos os ícones disponíveis',
    mimeType: 'application/json',
  },
  {
    uri: 'pictograms://list',
    name: 'Pictograms List',
    description: 'Lista indexada de todos os pictogramas disponíveis',
    mimeType: 'application/json',
  },
];

// Handlers para tools
async function handleListComponents(args: any): Promise<CallToolResult> {
  const { category, search } = ListComponentsSchema.parse(args);
  
  let filteredComponents = componentsCache;
  
  if (category) {
    filteredComponents = filteredComponents.filter(comp => 
      comp.category?.toLowerCase().includes(category.toLowerCase())
    );
  }
  
  if (search) {
    const searchLower = search.toLowerCase();
    filteredComponents = filteredComponents.filter(comp => 
      comp.name.toLowerCase().includes(searchLower) ||
      comp.description?.toLowerCase().includes(searchLower) ||
      comp.whenToUse?.toLowerCase().includes(searchLower)
    );
  }
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          components: filteredComponents.map(comp => ({
            name: comp.name,
            description: comp.description,
            category: comp.category,
            importPath: comp.importPath,
            propsCount: comp.props.length,
          })),
          total: filteredComponents.length,
        }, null, 2),
      },
    ],
  };
}

async function handleSearchComponents(args: any): Promise<CallToolResult> {
  const { query, category } = SearchComponentsSchema.parse(args);
  
  const queryLower = query.toLowerCase();
  let results = componentsCache.filter(comp => 
    comp.name.toLowerCase().includes(queryLower) ||
    comp.description?.toLowerCase().includes(queryLower) ||
    comp.whenToUse?.toLowerCase().includes(queryLower) ||
    comp.examples?.some(example => example.toLowerCase().includes(queryLower))
  );
  
  if (category) {
    results = results.filter(comp => 
      comp.category?.toLowerCase().includes(category.toLowerCase())
    );
  }
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          query,
          results: results.map(comp => ({
            name: comp.name,
            description: comp.description,
            category: comp.category,
            importPath: comp.importPath,
            relevance: calculateRelevance(comp, query),
          })),
          total: results.length,
        }, null, 2),
      },
    ],
  };
}

async function handleGetComponent(args: any): Promise<CallToolResult> {
  const { name } = GetComponentSchema.parse(args);
  
  const component = componentsCache.find(comp => 
    comp.name.toLowerCase() === name.toLowerCase()
  );
  
  if (!component) {
    throw new McpError(
      ErrorCode.InvalidParams,
      `Componente '${name}' não encontrado`
    );
  }
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          resourceLink: `comp://${component.name}`,
          name: component.name,
          description: component.description,
          category: component.category,
          importPath: component.importPath,
        }),
      },
    ],
  };
}

async function handleGetComponentProps(args: any): Promise<CallToolResult> {
  const { name } = GetComponentPropsSchema.parse(args);
  
  const component = componentsCache.find(comp => 
    comp.name.toLowerCase() === name.toLowerCase()
  );
  
  if (!component) {
    throw new McpError(
      ErrorCode.InvalidParams,
      `Componente '${name}' não encontrado`
    );
  }
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          name: component.name,
          props: component.props.map(prop => ({
            name: prop.name,
            type: prop.type,
            required: prop.required,
            defaultValue: prop.defaultValue,
            description: prop.description,
          })),
          total: component.props.length,
        }, null, 2),
      },
    ],
  };
}

async function handleSuggestComponent(args: any): Promise<CallToolResult> {
  const { intent } = SuggestComponentSchema.parse(args);
  
  const intentLower = intent.toLowerCase();
  
  // Busca por palavras-chave na descrição e exemplos
  const suggestions = componentsCache
    .map(comp => ({
      component: comp,
      score: calculateIntentScore(comp, intentLower),
    }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          intent,
          suggestions: suggestions.map(item => ({
            name: item.component.name,
            description: item.component.description,
            category: item.component.category,
            score: item.score,
            importPath: item.component.importPath,
          })),
        }, null, 2),
      },
    ],
  };
}

async function handleGetTokens(args: any): Promise<CallToolResult> {
  GetTokensSchema.parse(args);
  
  if (!tokensCache) {
    throw new McpError(
      ErrorCode.InternalError,
      'Tokens não carregados. Execute carbon.refresh primeiro.'
    );
  }
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(tokensCache, null, 2),
      },
    ],
  };
}

async function handleSearchIcons(args: any): Promise<CallToolResult> {
  const { query, category, size } = SearchIconsSchema.parse(args);
  
  const queryLower = query.toLowerCase();
  let results = iconsCache.filter(icon => 
    icon.name.toLowerCase().includes(queryLower) ||
    icon.category?.toLowerCase().includes(queryLower)
  );
  
  if (category) {
    results = results.filter(icon => 
      icon.category?.toLowerCase().includes(category.toLowerCase())
    );
  }
  
  if (size) {
    results = results.filter(icon => icon.size === size);
  }
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          query,
          results: results.map(icon => ({
            name: icon.name,
            importPath: icon.importPath,
            category: icon.category,
            size: icon.size,
          })),
          total: results.length,
        }, null, 2),
      },
    ],
  };
}

async function handleSearchPictograms(args: any): Promise<CallToolResult> {
  const { query, category } = SearchPictogramsSchema.parse(args);
  
  const queryLower = query.toLowerCase();
  let results = pictogramsCache.filter(pictogram => 
    pictogram.name.toLowerCase().includes(queryLower) ||
    pictogram.category?.toLowerCase().includes(queryLower)
  );
  
  if (category) {
    results = results.filter(pictogram => 
      pictogram.category?.toLowerCase().includes(category.toLowerCase())
    );
  }
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          query,
          results: results.map(pictogram => ({
            name: pictogram.name,
            importPath: pictogram.importPath,
            category: pictogram.category,
          })),
          total: results.length,
        }, null, 2),
      },
    ],
  };
}

async function handleRefresh(args: any): Promise<CallToolResult> {
  RefreshSchema.parse(args);
  
  // Recarrega todos os dados
  loadData();
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          message: 'Base de dados recarregada com sucesso',
          stats: {
            components: componentsCache.length,
            icons: iconsCache.length,
            pictograms: pictogramsCache.length,
            tokensLoaded: tokensCache !== null,
          },
        }),
      },
    ],
  };
}

// Handlers para resources
async function handleReadComponentResource(uri: string): Promise<ReadResourceResult> {
  const componentName = uri.replace('comp://', '');
  const component = componentsCache.find(comp => 
    comp.name.toLowerCase() === componentName.toLowerCase()
  );
  
  if (!component) {
    throw new McpError(
      ErrorCode.InvalidParams,
      `Componente '${componentName}' não encontrado`
    );
  }
  
  const markdown = generateComponentMarkdown(component);
  
  return {
    contents: [
      {
        uri,
        mimeType: 'text/markdown',
        text: markdown,
      },
    ],
  };
}

async function handleReadTokensResource(): Promise<ReadResourceResult> {
  if (!tokensCache) {
    throw new McpError(
      ErrorCode.InternalError,
      'Tokens não carregados. Execute carbon.refresh primeiro.'
    );
  }
  
  return {
    contents: [
      {
        uri: 'ds://tokens',
        mimeType: 'application/json',
        text: JSON.stringify(tokensCache, null, 2),
      },
    ],
  };
}

async function handleReadIconsResource(): Promise<ReadResourceResult> {
  return {
    contents: [
      {
        uri: 'icons://list',
        mimeType: 'application/json',
        text: JSON.stringify(iconsCache, null, 2),
      },
    ],
  };
}

async function handleReadPictogramsResource(): Promise<ReadResourceResult> {
  return {
    contents: [
      {
        uri: 'pictograms://list',
        mimeType: 'application/json',
        text: JSON.stringify(pictogramsCache, null, 2),
      },
    ],
  };
}

// Funções auxiliares
function calculateRelevance(component: ComponentInfo, query: string): number {
  const queryLower = query.toLowerCase();
  let score = 0;
  
  if (component.name.toLowerCase().includes(queryLower)) score += 10;
  if (component.description?.toLowerCase().includes(queryLower)) score += 5;
  if (component.whenToUse?.toLowerCase().includes(queryLower)) score += 3;
  if (component.examples?.some(example => example.toLowerCase().includes(queryLower))) score += 2;
  
  return score;
}

function calculateIntentScore(component: ComponentInfo, intent: string): number {
  const text = [
    component.name,
    component.description,
    component.whenToUse,
    ...(component.examples || []),
  ].join(' ').toLowerCase();
  
  const intentWords = intent.split(' ').filter(word => word.length > 2);
  let score = 0;
  
  for (const word of intentWords) {
    if (text.includes(word)) {
      score += 1;
    }
  }
  
  return score;
}

function generateComponentMarkdown(component: ComponentInfo): string {
  let markdown = `# ${component.name}\n\n`;
  
  if (component.description) {
    markdown += `## Descrição\n\n${component.description}\n\n`;
  }
  
  if (component.whenToUse) {
    markdown += `## Quando usar\n\n${component.whenToUse}\n\n`;
  }
  
  if (component.examples && component.examples.length > 0) {
    markdown += `## Exemplos\n\n`;
    component.examples.forEach((example, index) => {
      markdown += `${index + 1}. ${example}\n`;
    });
    markdown += '\n';
  }
  
  markdown += `## Importação\n\n\`\`\`javascript\nimport { ${component.name} } from '${component.importPath}';\n\`\`\`\n\n`;
  
  if (component.props && component.props.length > 0) {
    markdown += `## Props\n\n`;
    markdown += `| Nome | Tipo | Obrigatório | Padrão | Descrição |\n`;
    markdown += `|------|------|-------------|--------|----------|\n`;
    
    component.props.forEach(prop => {
      markdown += `| ${prop.name} | \`${prop.type}\` | ${prop.required ? 'Sim' : 'Não'} | ${prop.defaultValue || '-'} | ${prop.description || '-'} |\n`;
    });
    markdown += '\n';
  }
  
  if (component.category) {
    markdown += `## Categoria\n\n${component.category}\n\n`;
  }
  
  return markdown;
}

// Registra handlers
server.setRequestHandler(ListToolsRequestSchema, async (): Promise<ListToolsResult> => {
  return { tools };
});

server.setRequestHandler(ListResourcesRequestSchema, async (): Promise<ListResourcesResult> => {
  return { resources };
});

server.setRequestHandler(CallToolRequestSchema, async (request): Promise<CallToolResult> => {
  const { name, arguments: args } = request.params;
  
  switch (name) {
    case 'carbon.list':
      return handleListComponents(args);
    case 'carbon.search':
      return handleSearchComponents(args);
    case 'carbon.get':
      return handleGetComponent(args);
    case 'carbon.props':
      return handleGetComponentProps(args);
    case 'carbon.suggest':
      return handleSuggestComponent(args);
    case 'carbon.tokens':
      return handleGetTokens(args);
    case 'carbon.icons.search':
      return handleSearchIcons(args);
    case 'carbon.pictograms.search':
      return handleSearchPictograms(args);
    case 'carbon.refresh':
      return handleRefresh(args);
    default:
      throw new McpError(ErrorCode.MethodNotFound, `Tool '${name}' não encontrada`);
  }
});

server.setRequestHandler(ReadResourceRequestSchema, async (request): Promise<ReadResourceResult> => {
  const { uri } = request.params;
  
  if (uri.startsWith('comp://')) {
    return handleReadComponentResource(uri);
  } else if (uri === 'ds://tokens') {
    return handleReadTokensResource();
  } else if (uri === 'icons://list') {
    return handleReadIconsResource();
  } else if (uri === 'pictograms://list') {
    return handleReadPictogramsResource();
  } else {
    throw new McpError(ErrorCode.InvalidParams, `Resource '${uri}' não encontrado`);
  }
});

// Inicializa o servidor
async function main() {
  console.error('🚀 Iniciando Carbon MCP Server...');
  
  // Carrega dados iniciais
  loadData();
  console.error(`📊 Dados carregados: ${componentsCache.length} componentes, ${iconsCache.length} ícones, ${pictogramsCache.length} pictogramas`);
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('✅ Carbon MCP Server conectado e pronto!');
}

main().catch(error => {
  console.error('❌ Erro ao iniciar servidor:', error);
  process.exit(1);
});
