const fs = require('fs');
const path = require('path');

const directories = [
  'd:/khodeVN/exam-web-frontend/app/tools',
  'd:/khodeVN/exam-web-frontend/app/en/tools'
];

function processFile(filePath, basePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes('generateMetadata')) return; // Already processed

  const match = content.match(/export const metadata: Metadata = \{([\s\S]*?)\};?/);
  if (!match) {
     const match2 = content.match(/export const metadata = \{([\s\S]*?)\};?/);
     if (!match2) return;
  }
  const fullMatch = match ? match[0] : content.match(/export const metadata = \{([\s\S]*?)\};?/)[0];

  const titleMatch = content.match(/title:\s*'([^']+)'/);
  const descMatch = content.match(/description:\s*'([^']+)'/);
  
  const title = titleMatch ? titleMatch[1] : '';
  const desc = descMatch ? descMatch[1] : '';

  const route = filePath.split('app')[1].replace('/page.tsx', '').replace(/\\/g, '/');

  const importStatement = `import { getRouteMetadata } from '@/src/utils/serverSeo'\n\n`;
  const generateMetadataFn = `export async function generateMetadata() {\n  return getRouteMetadata(\n    '${route}',\n    '${title.replace(/'/g, "\\'")}',\n    '${desc.replace(/'/g, "\\'")}'\n  )\n}\n`;

  content = content.replace(fullMatch, generateMetadataFn);
  
  if (!content.includes('getRouteMetadata')) {
    const lastImportIndex = content.lastIndexOf('import ');
    const endOfLastImport = content.indexOf('\n', lastImportIndex) + 1;
    content = content.slice(0, endOfLastImport) + importStatement + content.slice(endOfLastImport);
  }

  content = content.replace(/import \{ Metadata \} from 'next'\n/, '');
  content = content.replace(/import type \{ Metadata \} from 'next'\n/, '');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Processed: ${filePath}`);
}

function traverseDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverseDir(fullPath);
    } else if (file === 'page.tsx') {
      processFile(fullPath, dir);
    }
  }
}

directories.forEach(traverseDir);
