#!/usr/bin/env tsx

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { homedir, platform } from 'os';

// Obter o diretório raiz do projeto
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = dirname(__dirname);

// Detectar sistema operacional e definir caminhos do Cursor
function getCursorConfigPath(): string {
  const os = platform();
  const homeDir = homedir();
  
  // Caminhos possíveis para o arquivo mcp.json (ordenados por prioridade)
  const possiblePaths = [
    // Caminho mais comum: ~/.cursor/mcp.json (funciona em todos os SOs)
    join(homeDir, '.cursor', 'mcp.json'),
    
    // Caminhos específicos por sistema operacional
    ...(os === 'win32' ? [
      // Windows: C:\Users\username\.cursor\mcp.json
      join(homeDir, 'AppData', 'Roaming', 'Cursor', 'User', 'mcp.json'),
      join(homeDir, 'AppData', 'Roaming', 'Cursor', 'mcp.json')
    ] : []),
    
    ...(os === 'darwin' ? [
      // macOS: /Users/username/.cursor/mcp.json
      join(homeDir, 'Library', 'Application Support', 'Cursor', 'User', 'mcp.json'),
      join(homeDir, 'Library', 'Application Support', 'Cursor', 'mcp.json')
    ] : []),
    
    ...(os === 'linux' ? [
      // Linux: /home/username/.cursor/mcp.json
      join(homeDir, '.config', 'Cursor', 'User', 'mcp.json'),
      join(homeDir, '.config', 'Cursor', 'mcp.json')
    ] : [])
  ];
  
  // Procurar por arquivo existente
  console.log(`🔍 Procurando arquivo mcp.json em ${possiblePaths.length} locais possíveis...`);
  
  for (const path of possiblePaths) {
    if (existsSync(path)) {
      console.log(`✅ Arquivo de configuração encontrado: ${path}`);
      return path;
    }
  }
  
  // Se não encontrou, usar o caminho padrão mais comum
  const defaultPath = join(homeDir, '.cursor', 'mcp.json');
  console.log(`📁 Arquivo não encontrado, usando caminho padrão: ${defaultPath}`);
  return defaultPath;
}

// Caminhos absolutos para os arquivos
const distPath = join(projectRoot, 'dist', 'index.js');
const componentsPath = join(projectRoot, 'data', 'components.json');
const tokensPath = join(projectRoot, 'data', 'tokens.json');
const iconsPath = join(projectRoot, 'data', 'icons.json');
const pictogramsPath = join(projectRoot, 'data', 'pictograms.json');

// Configuração do servidor carbon-mcp
const carbonMcpConfig = {
  command: "node",
  args: [distPath],
  env: {
    "CARBON_DB": componentsPath,
    "CARBON_TOKENS": tokensPath,
    "CARBON_ICONS": iconsPath,
    "CARBON_PICTOS": pictogramsPath
  }
};

// Configuração completa do MCP (apenas carbon-mcp)
const mcpConfig = {
  mcpServers: {
    "carbon-mcp": carbonMcpConfig
  }
};

// Função para verificar se a configuração já existe e é igual
function isConfigEqual(existing: any, newConfig: any): boolean {
  if (!existing || !newConfig) return false;
  
  // Comparar command e args
  if (existing.command !== newConfig.command) return false;
  if (JSON.stringify(existing.args) !== JSON.stringify(newConfig.args)) return false;
  
  // Comparar variáveis de ambiente
  if (!existing.env || !newConfig.env) return false;
  if (JSON.stringify(existing.env) !== JSON.stringify(newConfig.env)) return false;
  
  return true;
}

// Função para atualizar configuração do Cursor
function updateCursorConfig(): boolean {
  try {
    const cursorConfigPath = getCursorConfigPath();
    const configDir = dirname(cursorConfigPath);
    
    // Criar diretório se não existir
    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true });
      console.log(`📁 Diretório criado: ${configDir}`);
    }
    
    let existingConfig: { mcpServers: Record<string, any> } = { mcpServers: {} };
    
    // Ler configuração existente se existir
    if (existsSync(cursorConfigPath)) {
      const existingContent = readFileSync(cursorConfigPath, 'utf-8');
      try {
        existingConfig = JSON.parse(existingContent);
      } catch (error) {
        console.warn('⚠️  Arquivo de configuração do Cursor corrompido, criando novo...');
        existingConfig = { mcpServers: {} };
      }
    }
    
    // Verificar se carbon-mcp já existe
    const existingCarbonMcp = existingConfig.mcpServers["carbon-mcp"];
    
    if (existingCarbonMcp) {
      // Verificar se a configuração é igual
      if (isConfigEqual(existingCarbonMcp, carbonMcpConfig)) {
        console.log('✅ Servidor carbon-mcp já está configurado corretamente!');
        console.log('⏭️  Nenhuma alteração necessária');
        return true;
      } else {
        console.log('🔄 Servidor carbon-mcp existe mas com configuração diferente');
        console.log('📝 Atualizando configuração...');
      }
    } else {
      console.log('➕ Servidor carbon-mcp não encontrado, adicionando...');
    }
    
    // Atualizar ou adicionar configuração do carbon-mcp
    existingConfig.mcpServers["carbon-mcp"] = carbonMcpConfig;
    
    // Salvar configuração atualizada
    writeFileSync(cursorConfigPath, JSON.stringify(existingConfig, null, 2));
    
    console.log('✅ Configuração do Cursor atualizada com sucesso!');
    console.log(`📁 Arquivo: ${cursorConfigPath}`);
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao atualizar configuração do Cursor:', error);
    return false;
  }
}

// Gerar o arquivo de configuração standalone
const configPath = join(projectRoot, 'mcp-config.json');
writeFileSync(configPath, JSON.stringify(mcpConfig, null, 2));

console.log('🚀 Gerando configuração do MCP...');
console.log(`📁 Arquivo standalone salvo em: ${configPath}`);

// Atualizar configuração do Cursor
console.log('\n🔧 Atualizando configuração do Cursor...');
const cursorUpdated = updateCursorConfig();

if (cursorUpdated) {
  console.log('\n🎉 Configuração completa!');
  console.log('📋 Servidor carbon-mcp foi adicionado/atualizado no Cursor');
  console.log('🔄 Reinicie o Cursor para aplicar as mudanças');
} else {
  console.log('\n⚠️  Configuração standalone gerada, mas falha ao atualizar Cursor');
  console.log('📋 Use o arquivo mcp-config.json manualmente');
}

console.log('\n📋 Configuração gerada:');
console.log(JSON.stringify(mcpConfig, null, 2));
