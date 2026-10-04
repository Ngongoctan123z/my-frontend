const fs = require('fs');

const files = {
  'app/ai-grader/ielts/AiGraderClient.tsx': {
    line456: "                              const parts = item.essay.split(/\\[BODY\\n]|\\[CONCLUSION\\n]/)",
    line457: "                              const intro = parts[0]?.replace(/\\[INTRODUCTION\\n]/, '').trim() || ''"
  },
  'app/ai-grader/toeic/ToeicGraderClient.tsx': {
    line454: "                              const parts = item.essay.split(/\\[BODY\\n]|\\[CONCLUSION\\n]/)",
    line455: "                              const intro = parts[0]?.replace(/\\[INTRODUCTION\\n]/, '').trim() || ''"
  }
};

Object.entries(files).forEach(([filepath, replacements]) => {
  let c = fs.readFileSync(filepath, 'utf8');
  let lines = c.split(/\r?\n/);
  
  Object.entries(replacements).forEach(([lineKey, newContent]) => {
    const lineNum = parseInt(lineKey.replace('line', '')) - 1;
    lines[lineNum] = newContent;
  });
  
  fs.writeFileSync(filepath, lines.join('\n'));
  console.log('Fixed:', filepath);
});
