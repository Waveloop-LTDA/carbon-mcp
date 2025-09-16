#!/usr/bin/env tsx

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';
import glob from 'fast-glob';

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

async function scanAssets() {
  console.log('🔍 Escaneando assets do Carbon Design System...');
  
  const dataDir = join(process.cwd(), 'data');
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }

  // Gera tokens
  console.log('🎨 Gerando tokens...');
  const tokens = await generateTokens();
  writeFileSync(join(dataDir, 'tokens.json'), JSON.stringify(tokens, null, 2));
  console.log(`✅ Tokens salvos: ${Object.keys(tokens).length} categorias`);

  // Gera ícones
  console.log('🔍 Indexando ícones...');
  const icons = await generateIcons();
  writeFileSync(join(dataDir, 'icons.json'), JSON.stringify(icons, null, 2));
  console.log(`✅ Ícones indexados: ${icons.length} ícones`);

  // Gera pictogramas
  console.log('🎭 Indexando pictogramas...');
  const pictograms = await generatePictograms();
  writeFileSync(join(dataDir, 'pictograms.json'), JSON.stringify(pictograms, null, 2));
  console.log(`✅ Pictogramas indexados: ${pictograms.length} pictogramas`);

  console.log('\n🎉 Scan de assets concluído!');
}

async function generateTokens(): Promise<TokenData> {
  const tokens: TokenData = {
    colors: {},
    themes: {},
    type: {},
    layout: {},
    motion: {},
    grid: {}
  };

  try {
    // Cores
    console.log('  📦 Processando @carbon/colors...');
    const colorsModule = await import('@carbon/colors');
    tokens.colors = extractModuleExports(colorsModule);

    // Temas
    console.log('  🎨 Processando @carbon/themes...');
    const themesModule = await import('@carbon/themes');
    tokens.themes = extractModuleExports(themesModule);

    // Tipografia
    console.log('  📝 Processando @carbon/type...');
    const typeModule = await import('@carbon/type');
    tokens.type = extractModuleExports(typeModule);

    // Layout
    console.log('  📐 Processando @carbon/layout...');
    const layoutModule = await import('@carbon/layout');
    tokens.layout = extractModuleExports(layoutModule);

    // Motion
    console.log('  🎬 Processando @carbon/motion...');
    const motionModule = await import('@carbon/motion');
    tokens.motion = extractModuleExports(motionModule);

    // Grid
    console.log('  🔲 Processando @carbon/grid...');
    try {
      const gridModule = await import('@carbon/grid');
      tokens.grid = extractModuleExports(gridModule);
    } catch (error) {
      console.log('  ⚠️  @carbon/grid não disponível, usando dados básicos...');
      tokens.grid = {
        breakpoints: {
          sm: '0px',
          md: '672px',
          lg: '1056px',
          xlg: '1312px',
          max: '1584px'
        },
        container: {
          sm: '100%',
          md: '100%',
          lg: '100%',
          xlg: '100%',
          max: '100%'
        }
      };
    }

  } catch (error) {
    console.warn('⚠️  Erro ao processar alguns módulos de tokens:', error);
  }

  return tokens;
}

function extractModuleExports(module: any): Record<string, any> {
  const exports: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(module)) {
    if (key !== 'default' && typeof value !== 'function') {
      try {
        // Serializa valores primitivos e objetos simples
        exports[key] = JSON.parse(JSON.stringify(value));
      } catch {
        // Se não conseguir serializar, salva como string
        exports[key] = String(value);
      }
    }
  }
  
  return exports;
}

async function generateIcons(): Promise<IconInfo[]> {
  const icons: IconInfo[] = [];
  
  try {
    // Tenta primeiro usar metadados do @carbon/icons
    console.log('  📋 Tentando usar metadados do @carbon/icons...');
    const iconsMetaPath = join(process.cwd(), 'node_modules/@carbon/icons/metadata.json');
    
    if (existsSync(iconsMetaPath)) {
      const metaContent = readFileSync(iconsMetaPath, 'utf-8');
      const metadata = JSON.parse(metaContent);
      
      for (const icon of metadata.icons || []) {
        icons.push({
          name: icon.name,
          importPath: `@carbon/icons-react/${icon.name}`,
          category: icon.category,
          size: icon.size
        });
      }
      
      console.log(`  ✅ Carregados ${icons.length} ícones via metadados`);
      return icons;
    }
  } catch (error) {
    console.log('  ⚠️  Metadados não disponíveis, usando fallback...');
  }

  // Fallback: varre diretório lib
  console.log('  🔍 Varrendo diretório lib do @carbon/icons-react...');
  const iconFiles = await glob('node_modules/@carbon/icons-react/lib/**/*.js');
  
  for (const filePath of iconFiles) {
    const fileName = filePath.split('/').pop()?.replace('.js', '');
    if (fileName && fileName !== 'index') {
      icons.push({
        name: fileName,
        importPath: `@carbon/icons-react/${fileName}`,
        category: categorizeIcon(fileName)
      });
    }
  }

  console.log(`  ✅ Encontrados ${icons.length} ícones via varredura`);
  return icons.sort((a, b) => a.name.localeCompare(b.name));
}

async function generatePictograms(): Promise<PictogramInfo[]> {
  const pictograms: PictogramInfo[] = [];
  
  try {
    // Tenta primeiro usar metadados do @carbon/pictograms
    console.log('  📋 Tentando usar metadados do @carbon/pictograms...');
    const pictogramsMetaPath = join(process.cwd(), 'node_modules/@carbon/pictograms/metadata.json');
    
    if (existsSync(pictogramsMetaPath)) {
      const metaContent = readFileSync(pictogramsMetaPath, 'utf-8');
      const metadata = JSON.parse(metaContent);
      
      for (const pictogram of metadata.pictograms || []) {
        pictograms.push({
          name: pictogram.name,
          importPath: `@carbon/pictograms-react/${pictogram.name}`,
          category: pictogram.category
        });
      }
      
      console.log(`  ✅ Carregados ${pictograms.length} pictogramas via metadados`);
      return pictograms;
    }
  } catch (error) {
    console.log('  ⚠️  Metadados não disponíveis, usando fallback...');
  }

  // Fallback: varre diretório lib
  console.log('  🔍 Varrendo diretório lib do @carbon/pictograms-react...');
  const pictogramFiles = await glob('node_modules/@carbon/pictograms-react/lib/**/*.js');
  
  for (const filePath of pictogramFiles) {
    const fileName = filePath.split('/').pop()?.replace('.js', '');
    if (fileName && fileName !== 'index') {
      pictograms.push({
        name: fileName,
        importPath: `@carbon/pictograms-react/${fileName}`,
        category: categorizePictogram(fileName)
      });
    }
  }

  console.log(`  ✅ Encontrados ${pictograms.length} pictogramas via varredura`);
  return pictograms.sort((a, b) => a.name.localeCompare(b.name));
}

function categorizeIcon(name: string): string {
  // Categorização básica baseada no nome do ícone
  const nameLower = name.toLowerCase();
  
  if (nameLower.includes('add') || nameLower.includes('plus')) return 'Actions';
  if (nameLower.includes('delete') || nameLower.includes('remove') || nameLower.includes('trash')) return 'Actions';
  if (nameLower.includes('edit') || nameLower.includes('pencil')) return 'Actions';
  if (nameLower.includes('save') || nameLower.includes('check')) return 'Actions';
  if (nameLower.includes('download') || nameLower.includes('upload')) return 'Actions';
  if (nameLower.includes('search') || nameLower.includes('magnify')) return 'Actions';
  if (nameLower.includes('filter') || nameLower.includes('sort')) return 'Actions';
  
  if (nameLower.includes('user') || nameLower.includes('person') || nameLower.includes('profile')) return 'User';
  if (nameLower.includes('settings') || nameLower.includes('preferences') || nameLower.includes('gear')) return 'Settings';
  if (nameLower.includes('notification') || nameLower.includes('alert') || nameLower.includes('warning')) return 'Alerts';
  if (nameLower.includes('home') || nameLower.includes('house')) return 'Navigation';
  if (nameLower.includes('arrow') || nameLower.includes('chevron') || nameLower.includes('caret')) return 'Navigation';
  if (nameLower.includes('menu') || nameLower.includes('hamburger')) return 'Navigation';
  
  if (nameLower.includes('file') || nameLower.includes('document') || nameLower.includes('folder')) return 'Files';
  if (nameLower.includes('image') || nameLower.includes('photo') || nameLower.includes('picture')) return 'Media';
  if (nameLower.includes('video') || nameLower.includes('play') || nameLower.includes('pause')) return 'Media';
  if (nameLower.includes('audio') || nameLower.includes('sound') || nameLower.includes('volume')) return 'Media';
  
  if (nameLower.includes('email') || nameLower.includes('mail') || nameLower.includes('message')) return 'Communication';
  if (nameLower.includes('phone') || nameLower.includes('call')) return 'Communication';
  if (nameLower.includes('chat') || nameLower.includes('comment')) return 'Communication';
  
  if (nameLower.includes('calendar') || nameLower.includes('date') || nameLower.includes('time')) return 'Time';
  if (nameLower.includes('clock') || nameLower.includes('timer')) return 'Time';
  
  if (nameLower.includes('chart') || nameLower.includes('graph') || nameLower.includes('analytics')) return 'Charts';
  if (nameLower.includes('table') || nameLower.includes('grid')) return 'Data';
  if (nameLower.includes('list') || nameLower.includes('item')) return 'Data';
  
  return 'Other';
}

function categorizePictogram(name: string): string {
  // Categorização básica para pictogramas
  const nameLower = name.toLowerCase();
  
  if (nameLower.includes('ai') || nameLower.includes('machine') || nameLower.includes('robot')) return 'AI & Technology';
  if (nameLower.includes('cloud') || nameLower.includes('server') || nameLower.includes('data')) return 'Cloud & Data';
  if (nameLower.includes('security') || nameLower.includes('shield') || nameLower.includes('lock')) return 'Security';
  if (nameLower.includes('business') || nameLower.includes('office') || nameLower.includes('team')) return 'Business';
  if (nameLower.includes('health') || nameLower.includes('medical') || nameLower.includes('care')) return 'Healthcare';
  if (nameLower.includes('finance') || nameLower.includes('money') || nameLower.includes('bank')) return 'Finance';
  if (nameLower.includes('education') || nameLower.includes('school') || nameLower.includes('learn')) return 'Education';
  if (nameLower.includes('travel') || nameLower.includes('transport') || nameLower.includes('journey')) return 'Travel';
  if (nameLower.includes('environment') || nameLower.includes('green') || nameLower.includes('sustainability')) return 'Environment';
  
  return 'General';
}

// Executa o script
scanAssets().catch(error => {
  console.error('❌ Erro ao escanear assets:', error);
  process.exit(1);
});
