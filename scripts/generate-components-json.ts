#!/usr/bin/env tsx

import { parse } from 'react-docgen-typescript';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import glob from 'fast-glob';

interface ComponentProp {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: any;
  description?: string;
}

interface ComponentInfo {
  name: string;
  description?: string;
  whenToUse?: string;
  examples?: string[];
  category?: string;
  props: ComponentProp[];
  importPath: string;
}

async function generateComponentsJson() {
  console.log('🔍 Procurando arquivos de definição de tipos do @carbon/react...');
  
  // Busca por arquivos .d.ts no @carbon/react
  const pattern = 'node_modules/@carbon/react/**/*.d.ts';
  const files = await glob(pattern);
  
  if (files.length === 0) {
    console.error('❌ Nenhum arquivo de definição encontrado. Execute "npm install" primeiro.');
    process.exit(1);
  }

  console.log(`📁 Encontrados ${files.length} arquivos de definição`);

  // Carrega dados do seed
  const seedPath = join(process.cwd(), 'seed', 'carbon-seed.json');
  let seedData: Record<string, any> = {};
  
  if (existsSync(seedPath)) {
    const seedContent = readFileSync(seedPath, 'utf-8');
    seedData = JSON.parse(seedContent);
    console.log(`📋 Carregados dados do seed para ${Object.keys(seedData).length} componentes`);
  }

  // Para simplificar, vamos usar apenas os dados do seed por enquanto
  // e adicionar props básicas para cada componente
  const components: ComponentInfo[] = [];

  for (const [componentName, seedInfo] of Object.entries(seedData)) {
    // Props básicas comuns para componentes React
    const commonProps: ComponentProp[] = [
      {
        name: 'children',
        type: 'ReactNode',
        required: false,
        description: 'Conteúdo filho do componente'
      },
      {
        name: 'className',
        type: 'string',
        required: false,
        description: 'Classe CSS personalizada'
      },
      {
        name: 'id',
        type: 'string',
        required: false,
        description: 'Identificador único do elemento'
      },
      {
        name: 'onClick',
        type: '() => void',
        required: false,
        description: 'Função chamada quando o elemento é clicado'
      }
    ];

    // Adiciona props específicas baseadas no tipo de componente
    let specificProps: ComponentProp[] = [];
    
    if (componentName === 'Button') {
      specificProps = [
        { name: 'kind', type: '"primary" | "secondary" | "tertiary" | "ghost" | "danger"', required: false, description: 'Tipo visual do botão' },
        { name: 'size', type: '"sm" | "md" | "lg"', required: false, description: 'Tamanho do botão' },
        { name: 'disabled', type: 'boolean', required: false, description: 'Se o botão está desabilitado' }
      ];
    } else if (componentName === 'Modal') {
      specificProps = [
        { name: 'open', type: 'boolean', required: true, description: 'Se o modal está aberto' },
        { name: 'onRequestClose', type: '() => void', required: true, description: 'Função chamada para fechar o modal' },
        { name: 'modalHeading', type: 'string', required: false, description: 'Título do modal' }
      ];
    } else if (componentName === 'DataTable') {
      specificProps = [
        { name: 'rows', type: 'Array<any>', required: true, description: 'Dados da tabela' },
        { name: 'headers', type: 'Array<{key: string, header: string}>', required: true, description: 'Cabeçalhos da tabela' },
        { name: 'sortable', type: 'boolean', required: false, description: 'Se a tabela é ordenável' }
      ];
    } else if (componentName === 'TextInput') {
      specificProps = [
        { name: 'value', type: 'string', required: false, description: 'Valor do input' },
        { name: 'onChange', type: '(event: ChangeEvent<HTMLInputElement>) => void', required: false, description: 'Função chamada quando o valor muda' },
        { name: 'placeholder', type: 'string', required: false, description: 'Texto placeholder' },
        { name: 'type', type: 'string', required: false, description: 'Tipo do input (text, email, password, etc.)' }
      ];
    } else if (componentName === 'Select') {
      specificProps = [
        { name: 'value', type: 'string', required: false, description: 'Valor selecionado' },
        { name: 'onChange', type: '(event: ChangeEvent<HTMLSelectElement>) => void', required: false, description: 'Função chamada quando a seleção muda' },
        { name: 'options', type: 'Array<{value: string, text: string}>', required: true, description: 'Opções disponíveis' }
      ];
    } else if (componentName === 'Checkbox') {
      specificProps = [
        { name: 'checked', type: 'boolean', required: false, description: 'Se o checkbox está marcado' },
        { name: 'onChange', type: '(checked: boolean) => void', required: false, description: 'Função chamada quando o estado muda' },
        { name: 'labelText', type: 'string', required: false, description: 'Texto do label' }
      ];
    } else if (componentName === 'RadioButton') {
      specificProps = [
        { name: 'checked', type: 'boolean', required: false, description: 'Se o radio está selecionado' },
        { name: 'onChange', type: '(checked: boolean) => void', required: false, description: 'Função chamada quando o estado muda' },
        { name: 'labelText', type: 'string', required: false, description: 'Texto do label' },
        { name: 'name', type: 'string', required: true, description: 'Nome do grupo de radio buttons' }
      ];
    }

    const component: ComponentInfo = {
      name: componentName,
      description: seedInfo.description || '',
      whenToUse: seedInfo.whenToUse || '',
      examples: seedInfo.examples || [],
      category: seedInfo.category || 'Other',
      props: [...commonProps, ...specificProps],
      importPath: `@carbon/react/${componentName}`
    };

    components.push(component);
  }

  // Ordena componentes por nome
  components.sort((a, b) => a.name.localeCompare(b.name));

  console.log(`✅ Processados ${components.length} componentes`);

  // Cria diretório data se não existir
  const dataDir = join(process.cwd(), 'data');
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }

  // Salva arquivo JSON
  const outputPath = join(dataDir, 'components.json');
  writeFileSync(outputPath, JSON.stringify(components, null, 2));
  
  console.log(`💾 Componentes salvos em: ${outputPath}`);
  console.log(`📊 Estatísticas:`);
  console.log(`   - Total de componentes: ${components.length}`);
  console.log(`   - Componentes com descrição: ${components.filter(c => c.description).length}`);
  console.log(`   - Componentes com exemplos: ${components.filter(c => c.examples?.length).length}`);
  
  // Mostra alguns exemplos
  console.log(`\n🎯 Exemplos de componentes encontrados:`);
  components.slice(0, 5).forEach(comp => {
    console.log(`   - ${comp.name} (${comp.category}): ${comp.props.length} props`);
  });
}

function extractComponentName(filePath: string): string | null {
  // Extrai nome do componente do caminho do arquivo
  const match = filePath.match(/node_modules\/@carbon\/react\/([^\/]+)\/.*\.d\.ts$/);
  if (match) {
    return match[1];
  }
  
  // Fallback: tenta extrair do nome do arquivo
  const fileName = filePath.split('/').pop()?.replace('.d.ts', '');
  if (fileName && fileName !== 'index') {
    return fileName;
  }
  
  return null;
}

// Executa o script
generateComponentsJson().catch(error => {
  console.error('❌ Erro ao gerar components.json:', error);
  process.exit(1);
});
