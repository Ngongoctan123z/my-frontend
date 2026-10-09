const fs = require('fs');
let code = fs.readFileSync('app/api/ai-grader/rubrics.ts', 'utf8');
code = code.replace(/\\`/g, '`');
fs.writeFileSync('app/api/ai-grader/rubrics.ts', code);
