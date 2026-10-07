const fs = require('fs');
const files = [
  'd:/khodeVN/exam-web-frontend/app/tools/casio/page.tsx',
  'd:/khodeVN/exam-web-frontend/app/tools/lock/page.tsx',
  'd:/khodeVN/exam-web-frontend/app/tools/merge-files/page.tsx',
  'd:/khodeVN/exam-web-frontend/app/tools/remove-pages/page.tsx'
];
for(const f of files) {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/,\r?\n\s*openGraph: \{[\s\S]*?\}\r?\n\}/, '');
  c = c.replace(/'\/tools\/(.*?)\/page.tsx'/, "'/tools/$1'");
  fs.writeFileSync(f, c, 'utf8');
}
