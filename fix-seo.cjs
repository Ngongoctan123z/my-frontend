const fs = require('fs');
const path = require('path');

const filesToFix = [
  { path: 'app/ai-grader/ielts/page.tsx', route: '/ai-grader/ielts' },
  { path: 'app/ai-grader/toeic/page.tsx', route: '/ai-grader/toeic' },
  { path: 'app/ai-grader/topik/page.tsx', route: '/ai-grader/topik' },
  { path: 'app/ai-grader/hsk/page.tsx', route: '/ai-grader/hsk' },
  { path: 'app/ai-grader/tai-lieu-tong-hop/page.tsx', route: '/ai-grader/tai-lieu-tong-hop' },
  { path: 'app/tools/casio/page.tsx', route: '/tools/casio' },
  { path: 'app/tools/convert/page.tsx', route: '/tools/convert' },
  { path: 'app/tools/lock/page.tsx', route: '/tools/lock' },
  { path: 'app/tools/merge-files/page.tsx', route: '/tools/merge-files' },
  { path: 'app/tools/remove-pages/page.tsx', route: '/tools/remove-pages' },
  { path: 'app/about/page.tsx', route: '/about' },
  { path: 'app/contact/page.tsx', route: '/contact' },
  { path: 'app/privacy/page.tsx', route: '/privacy' },
  { path: 'app/terms/page.tsx', route: '/terms' },
  { path: 'app/favorites/page.tsx', route: '/favorites' }
];

for (const fileObj of filesToFix) {
  const filePath = path.join(__dirname, fileObj.path);
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${filePath}, does not exist.`);
    continue;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Extract title and description
  let titleMatch = content.match(/title:\s*['"`](.*?)['"`]/);
  let descMatch = content.match(/description:\s*['"`](.*?)['"`]/);
  
  const title = titleMatch ? titleMatch[1] : '';
  const desc = descMatch ? descMatch[1] : '';
  
  // Replace the export const metadata block
  // We need to find the block from "export const metadata" to the closing brace "}" before the component.
  // Using a regex for the block:
  const metadataRegex = /export const metadata[^=]*=\s*\{[\s\S]*?\n\}/m;
  
  if (metadataRegex.test(content)) {
    const importStatement = `import { getRouteMetadata } from '@/src/utils/serverSeo'\n\n`;
    
    // Check if we already imported getRouteMetadata
    if (!content.includes('getRouteMetadata')) {
       // Insert import after the last import
       const lastImportMatch = [...content.matchAll(/^import.*$/gm)].pop();
       if (lastImportMatch) {
         const idx = lastImportMatch.index + lastImportMatch[0].length;
         content = content.slice(0, idx) + '\n' + importStatement + content.slice(idx);
       } else {
         content = importStatement + content;
       }
    }
    
    const newMetadataFunc = `export async function generateMetadata() {\n  return getRouteMetadata(\n    '${fileObj.route}',\n    '${title}',\n    '${desc}'\n  )\n}`;
    
    content = content.replace(metadataRegex, newMetadataFunc);
    
    // Also change `export const metadata = {` if it's missing type
    const metadataRegexNoType = /export const metadata\s*=\s*\{[\s\S]*?\n\}/m;
    content = content.replace(metadataRegexNoType, newMetadataFunc);

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed ${filePath}`);
  } else {
    console.log(`Metadata block not found in ${filePath}`);
  }
}
