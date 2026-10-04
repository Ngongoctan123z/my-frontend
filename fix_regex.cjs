const fs = require('fs');
const files = [
  'app/ai-grader/topik/TopikGraderClient.tsx',
  'app/ai-grader/toeic/ToeicGraderClient.tsx',
  'app/ai-grader/ielts/AiGraderClient.tsx',
  'app/ai-grader/hsk/HskGraderClient.tsx'
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/data\.limit \|\| 2s\+/g, '\\s+');
  content = content.replace(/data\.limit \|\| 2n/g, '\\n');
  content = content.replace(/data\.limit \|\| 2\[/g, '\\[');
  content = content.replace(/\]data\.limit \|\| 2/g, '\\]');
  content = content.replace(/data\.limit \|\|data\.limit \|\| 2/g, 'data.limit || 2');
  content = content.replace(/chưa đầydata\.limit \|\| 2 giây/g, 'chưa đầy 15 giây');
  fs.writeFileSync(f, content);
});
