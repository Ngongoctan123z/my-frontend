const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      try {
        let content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('getRouteMetadata') && !content.includes('import { getRouteMetadata }')) {
          content = "import { getRouteMetadata } from '@/src/utils/serverSeo';\n" + content;
          fs.writeFileSync(fullPath, content);
          console.log('Fixed', fullPath);
        }
      } catch(e) {}
    }
  }
}

processDir('app/tools');
processDir('app/en/tools');
